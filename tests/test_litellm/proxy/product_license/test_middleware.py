from __future__ import annotations

import pytest
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route, WebSocketRoute
from starlette.testclient import TestClient
from starlette.websockets import WebSocket, WebSocketDisconnect

from litellm.proxy.middleware.per_request_root_path_middleware import PerRequestRootPathMiddleware
from litellm.proxy.product_license.middleware import ProductLicenseGateMiddleware


async def _ok(request):
    return JSONResponse({"ok": True})


async def _ws_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    await websocket.send_text("ok")
    await websocket.close()


ROUTES = (
    Route("/", _ok),
    Route("/ui/", _ok),
    Route("/ui/login", _ok),
    Route("/ui/login/", _ok),
    Route("/ui/license-activation/", _ok),
    Route("/ui/settings", _ok),
    Route("/ui/_next/static/chunk.js", _ok),
    Route("/ui/assets/logo.png", _ok),
    Route("/v1/chat/completions", _ok, methods=["POST"]),
    Route("/health", _ok),
    Route("/metrics", _ok),
    Route("/product/license/info", _ok),
    Route("/get_image", _ok),
    Route("/v1/evil.json", _ok),
    Route("/login", _ok, methods=["POST"]),
    WebSocketRoute("/v1/realtime", _ws_endpoint),
)


def build_client(authorized: bool) -> TestClient:
    app = Starlette(routes=list(ROUTES))
    app.add_middleware(ProductLicenseGateMiddleware, status_provider=lambda: authorized)
    return TestClient(app)


@pytest.fixture
def enforcement_enabled(monkeypatch):
    monkeypatch.setenv("LITELLM_PRODUCT_LICENSE_ENABLED", "true")


@pytest.fixture
def enforcement_disabled(monkeypatch):
    monkeypatch.setenv("LITELLM_PRODUCT_LICENSE_ENABLED", "false")


def test_authorized_requests_pass(enforcement_enabled):
    client = build_client(authorized=True)
    assert client.post("/v1/chat/completions").status_code == 200
    assert client.get("/ui/settings").status_code == 200


def test_unlicensed_api_requests_are_blocked(enforcement_enabled):
    client = build_client(authorized=False)

    response = client.post("/v1/chat/completions")

    assert response.status_code == 403
    assert response.headers["x-litellm-product-license"] == "unauthorized"
    assert response.json()["error"]["type"] == "product_not_authorized"
    assert "授权" in response.json()["error"]["message"]


def test_unlicensed_ui_page_redirects_to_activation(enforcement_enabled):
    client = build_client(authorized=False)

    for path in ("/", "/ui/", "/ui/settings"):
        response = client.get(path, follow_redirects=False)
        assert response.status_code == 302
        assert response.headers["location"] == "/ui/license-activation/"


def test_unlicensed_login_activation_and_assets_remain_available(enforcement_enabled):
    client = build_client(authorized=False)

    for path in (
        "/ui/login",
        "/ui/license-activation/",
        "/ui/_next/static/chunk.js",
        "/ui/assets/logo.png",
        "/health",
        "/metrics",
        "/product/license/info",
        "/get_image",
    ):
        assert client.get(path).status_code == 200, path


def test_static_suffix_outside_ui_is_not_treated_as_asset(enforcement_enabled):
    client = build_client(authorized=False)

    assert client.get("/v1/evil.json").status_code == 403


def test_unlicensed_health_and_license_endpoints_allowed(enforcement_enabled):
    client = build_client(authorized=False)
    assert client.get("/health").status_code == 200
    assert client.get("/product/license/info").status_code == 200


def test_enforcement_disabled_allows_everything(enforcement_disabled):
    client = build_client(authorized=False)
    assert client.post("/v1/chat/completions").status_code == 200
    assert client.get("/ui/settings").status_code == 200


def test_root_path_prefix_is_normalized(enforcement_enabled, monkeypatch):
    monkeypatch.setenv("SERVER_ROOT_PATH", "/gateway")
    client = build_client(authorized=False)

    redirect = client.get("/gateway/ui/settings", follow_redirects=False)
    blocked = client.post("/gateway/v1/chat/completions")

    assert redirect.status_code == 302
    assert redirect.headers["location"] == "/gateway/ui/license-activation/"
    assert blocked.status_code == 403


def test_per_request_root_paths_are_normalized(enforcement_enabled, monkeypatch):
    monkeypatch.delenv("SERVER_ROOT_PATH", raising=False)
    monkeypatch.setenv("SERVER_ROOT_PATHS", "/tenant-a,/tenant-b")
    app = Starlette(routes=list(ROUTES))
    app.add_middleware(ProductLicenseGateMiddleware, status_provider=lambda: False)
    app.add_middleware(PerRequestRootPathMiddleware, root_paths=("/tenant-a", "/tenant-b"))
    client = TestClient(app)

    redirect = client.get("/tenant-b/ui/settings", follow_redirects=False)
    blocked = client.post("/tenant-b/v1/chat/completions")

    assert redirect.status_code == 302
    assert redirect.headers["location"] == "/tenant-b/ui/license-activation/"
    assert blocked.status_code == 403


def test_status_provider_failure_denies_access(enforcement_enabled):
    def failing_provider() -> bool:
        raise RuntimeError("license subsystem down")

    app = Starlette(routes=list(ROUTES))
    app.add_middleware(ProductLicenseGateMiddleware, status_provider=failing_provider)
    client = TestClient(app)

    assert client.post("/v1/chat/completions").status_code == 403


def test_unlicensed_websocket_is_rejected(enforcement_enabled):
    client = build_client(authorized=False)

    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/v1/realtime") as websocket:
            websocket.receive_text()


def test_authorized_websocket_is_allowed(enforcement_enabled):
    client = build_client(authorized=True)

    with client.websocket_connect("/v1/realtime") as websocket:
        assert websocket.receive_text() == "ok"
