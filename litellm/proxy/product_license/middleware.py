from __future__ import annotations

import json
import os
from collections.abc import Callable
from dataclasses import asdict, dataclass
from types import MappingProxyType
from typing import Final

from starlette.responses import RedirectResponse, Response
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from litellm._logging import verbose_proxy_logger
from litellm.proxy.middleware.per_request_root_path_middleware import get_server_root_paths
from litellm.proxy.product_license.manager import (
    get_product_license_manager,
    is_enforcement_enabled,
)

ALLOWED_PATH_PREFIXES: Final = (
    "/product/license",
    "/health",
    "/metrics",
    "/login",
    "/v2/login",
    "/logout",
    "/sso",
    "/.well-known",
    "/litellm/.well-known",
    "/get_image",
    "/get_favicon",
    "/favicon.ico",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/swagger",
    "/litellm-asset-prefix",
    "/_next",
)
UI_PATH_PREFIX: Final = "/ui"
UI_LOGIN_PATH: Final = "/ui/login"
UI_ACTIVATION_PATH: Final = "/ui/license-activation"
REDIRECT_PATH: Final = "/ui/license-activation/"
STATIC_SUFFIXES: Final = (".js", ".css", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".woff", ".woff2", ".txt", ".json")
UNAUTHORIZED_MESSAGE: Final = "本产品尚未授权，请先导入授权文件"


def _server_root_path() -> str:
    return os.getenv("SERVER_ROOT_PATH", "").rstrip("/")


def _strip_root_path(raw_path: str, roots: tuple[str, ...]) -> str:
    for root in roots:
        if root and (raw_path == root or raw_path.startswith(f"{root}/")):
            return raw_path[len(root) :] or "/"
    return raw_path


def _normalized_path(raw_path: str) -> str:
    root_prefixes: Final = (_server_root_path(), *get_server_root_paths())
    return _strip_root_path(raw_path, root_prefixes)


def _redirect_location(scope: Scope) -> str:
    root: Final = _scope_string(scope, "root_path", "").rstrip("/") or _server_root_path()
    return f"{root}{REDIRECT_PATH}" if root else REDIRECT_PATH


def _scope_string(scope: Scope, key: str, default: str) -> str:
    value: Final = scope.get(key)  # pyright: ignore[reportAny]  # ASGI scope values are Any
    return value if isinstance(value, str) else default


def _is_allowed_path(path: str) -> bool:
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in ALLOWED_PATH_PREFIXES)


def _is_ui_path(path: str) -> bool:
    return path == UI_PATH_PREFIX or path.startswith(f"{UI_PATH_PREFIX}/")


def _is_ui_static_path(path: str) -> bool:
    return path.startswith("/_next") or path.endswith(STATIC_SUFFIXES) or "/_next/" in path


def _is_ui_passthrough_path(path: str) -> bool:
    if path.startswith((UI_LOGIN_PATH, UI_ACTIVATION_PATH)):
        return True
    return path.startswith(f"{UI_PATH_PREFIX}/") and _is_ui_static_path(path)


def _is_ui_page_request(method: str, path: str) -> bool:
    if method != "GET":
        return False
    if path == "/":
        return True
    if not _is_ui_path(path):
        return False
    if path.startswith((UI_LOGIN_PATH, UI_ACTIVATION_PATH)):
        return False
    return not _is_ui_static_path(path)


@dataclass(frozen=True, slots=True)
class _ErrorDetail:
    message: str
    type: str
    code: str


@dataclass(frozen=True, slots=True)
class _ErrorPayload:
    error: _ErrorDetail


def _unauthorized_body() -> bytes:
    payload: Final = _ErrorPayload(
        error=_ErrorDetail(
            message=UNAUTHORIZED_MESSAGE,
            type="product_not_authorized",
            code="product_not_authorized",
        )
    )
    return json.dumps(asdict(payload), ensure_ascii=False).encode("utf-8")


class ProductLicenseGateMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        status_provider: Callable[[], bool] | None = None,
    ) -> None:
        self.app = app
        self._status_provider = status_provider

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        scope_type: Final = _scope_string(scope, "type", "")
        if scope_type not in ("http", "websocket") or not is_enforcement_enabled():
            await self.app(scope, receive, send)
            return
        path: Final = _normalized_path(_scope_string(scope, "path", "/"))
        if self._is_authorized() or _is_allowed_path(path):
            await self.app(scope, receive, send)
            return
        if scope_type == "websocket":
            close_message: Final[Message] = {
                "type": "websocket.close",
                "code": 1008,
                "reason": "product not authorized",
            }
            await receive()
            await send(close_message)
            return
        method: Final = _scope_string(scope, "method", "GET")
        if _is_ui_passthrough_path(path) or _is_ui_page_request(method, path):
            if _is_ui_page_request(method, path):
                redirect: Final = RedirectResponse(url=_redirect_location(scope), status_code=302)
                await redirect(scope, receive, send)
                return
            await self.app(scope, receive, send)
            return
        verbose_proxy_logger.debug("product license gate blocked request: %s %s", method, path)
        response: Final = Response(
            content=_unauthorized_body(),
            status_code=403,
            media_type="application/json",
            headers=MappingProxyType({"X-LiteLLM-Product-License": "unauthorized"}),
        )
        await response(scope, receive, send)

    def _is_authorized(self) -> bool:
        provider: Final = self._status_provider
        try:
            if provider is not None:
                return provider()
            return get_product_license_manager().is_authorized()
        except Exception:  # noqa: BLE001  # license status failures must deny access, never crash requests
            return False
