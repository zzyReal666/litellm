from __future__ import annotations

import binascii
import os
import threading
import time
from functools import lru_cache
from pathlib import Path
from typing import Final

from litellm._logging import verbose_proxy_logger
from litellm.proxy.product_license import fingerprint
from litellm.proxy.product_license.native_backend import (
    DEFAULT_SERVER_TYPE,
    NativeLicenseBackend,
    NativeLicenseError,
    NativeLicenseUnavailableError,
)
from litellm.proxy.product_license.subprocess_backend import SubprocessLicenseBackend
from litellm.proxy.product_license.types import (
    NativeLicenseInfo,
    ProductLicenseState,
    ProductLicenseStatus,
)

DEFAULT_PRODUCT_NAME: Final = "AI Token网关"
DEFAULT_LICENSE_FILE_NAME: Final = "product_license.lic"
STATUS_CACHE_TTL_SECONDS: Final = 30.0
MAX_LICENSE_FILE_CHARS: Final = 1024 * 1024
TIME_FORMAT: Final = "%Y-%m-%d %H:%M:%S"
UNAVAILABLE_MESSAGE: Final = "授权组件不可用"


class ProductLicenseImportError(RuntimeError):
    pass


def is_enforcement_enabled() -> bool:
    raw: Final = os.getenv("LITELLM_PRODUCT_LICENSE_ENABLED")
    if raw is None:
        return True
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _detect_product_version() -> str:
    override: Final = os.getenv("LITELLM_PRODUCT_VERSION", "").strip()
    if override:
        return override
    try:
        from litellm._version import version as litellm_version
    except ImportError:
        return "未知"
    return str(litellm_version)


def _format_timestamp(timestamp: int) -> str:
    if timestamp <= 0:
        return "暂无信息"
    try:
        return time.strftime(TIME_FORMAT, time.localtime(timestamp))
    except (OSError, OverflowError, ValueError):
        return "暂无信息"


def _time_text(state: ProductLicenseState, info: NativeLicenseInfo | None) -> str:
    licensed: Final = info is not None and info.version_int != 0
    if not licensed or info is None:
        return "暂无信息"
    if info.t_start == info.t_end:
        return "长期有效"
    if state is ProductLicenseState.NOT_YET_VALID:
        return f"{_format_timestamp(info.t_start)} 起生效"
    return f"{_format_timestamp(info.t_start)} 至 {_format_timestamp(info.t_end)}"


def _create_time_text(info: NativeLicenseInfo | None) -> str:
    licensed: Final = info is not None and info.version_int != 0
    if not licensed or info is None:
        return "暂无信息"
    return _format_timestamp(info.t_start)


class ProductLicenseManager:
    def __init__(
        self,
        backend: NativeLicenseBackend | None = None,
        license_file: str | None = None,
        product_name: str | None = None,
        product_version: str | None = None,
        product_code: str = DEFAULT_SERVER_TYPE,
        serial_number: str | None = None,
        machine_fingerprint: str | None = None,
    ) -> None:
        self._backend: Final = backend if backend is not None else SubprocessLicenseBackend()
        self._license_file: Final = (
            license_file
            or os.getenv("LITELLM_PRODUCT_LICENSE_FILE", "").strip()
            or os.path.join(os.getcwd(), DEFAULT_LICENSE_FILE_NAME)
        )
        self._product_name: Final = (
            product_name or os.getenv("LITELLM_PRODUCT_NAME", "").strip() or DEFAULT_PRODUCT_NAME
        )
        self._product_version: Final = product_version or _detect_product_version()
        self._product_code: Final = product_code or DEFAULT_SERVER_TYPE
        detected_fingerprint: Final = machine_fingerprint or fingerprint.machine_fingerprint()
        self._machine_code: Final = fingerprint.format_serial(detected_fingerprint)
        self._serial_number: Final = serial_number or fingerprint.product_serial_number(detected_fingerprint)
        self._lock: Final = threading.RLock()
        self._cached_status: ProductLicenseStatus | None = None
        self._cache_deadline: float = 0.0

    @property
    def license_file(self) -> str:
        return self._license_file

    @property
    def product_name(self) -> str:
        return self._product_name

    @property
    def product_version(self) -> str:
        return self._product_version

    def get_status(self, force_refresh: bool = False) -> ProductLicenseStatus:
        with self._lock:
            cached: Final = self._cached_status
            if not force_refresh and cached is not None and time.monotonic() < self._cache_deadline:
                return cached
            status: Final = self._compute_status()
            self._cached_status = status
            self._cache_deadline = time.monotonic() + STATUS_CACHE_TTL_SECONDS
            return status

    def is_authorized(self) -> bool:
        return self.get_status().authorized

    def get_request_code(self) -> str:
        with self._lock:
            request_bytes: Final = self._backend.generate_request(self._product_code)
        return binascii.hexlify(request_bytes).decode("ascii").lower()

    def import_license(self, raw_bytes: bytes) -> ProductLicenseStatus:
        compact: Final = b"".join(raw_bytes.split())
        if not compact:
            raise ProductLicenseImportError("授权文件内容为空")
        if len(compact) > MAX_LICENSE_FILE_CHARS:
            raise ProductLicenseImportError("授权文件过大")
        try:
            decoded: Final = binascii.unhexlify(compact)
        except (binascii.Error, ValueError) as exc:
            raise ProductLicenseImportError("授权文件格式错误：内容必须是十六进制文本") from exc
        with self._lock:
            try:
                self._backend.import_license(decoded)
            except NativeLicenseUnavailableError as exc:
                raise ProductLicenseImportError(f"{UNAVAILABLE_MESSAGE}: {exc}") from exc
            except NativeLicenseError as exc:
                raise ProductLicenseImportError(f"授权文件导入失败: {exc}") from exc
            status: Final = self._compute_status()
            self._cached_status = status
            self._cache_deadline = time.monotonic() + STATUS_CACHE_TTL_SECONDS
            if not status.authorized:
                raise ProductLicenseImportError(f"授权文件无效: {status.message}")
            try:
                self._persist_license(compact)
            except OSError as exc:
                raise ProductLicenseImportError(f"授权文件保存失败: {exc}") from exc
        verbose_proxy_logger.info("product license imported and stored at %s", self._license_file)
        return status

    def activate_from_disk(self) -> ProductLicenseStatus:
        license_path: Final = Path(self._license_file)
        if license_path.is_file():
            try:
                stored: Final = license_path.read_bytes()
            except OSError as exc:
                verbose_proxy_logger.warning("unable to read stored product license %s: %s", license_path, exc)
            else:
                try:
                    self.import_license(stored)
                except ProductLicenseImportError as exc:
                    verbose_proxy_logger.warning("stored product license is invalid: %s", exc)
        status: Final = self.get_status(force_refresh=True)
        if status.authorized:
            verbose_proxy_logger.info(
                "product license active: product=%s serial=%s state=%s",
                status.product_name,
                status.serial_number,
                status.state.value,
            )
        else:
            verbose_proxy_logger.warning("product license not active: %s", status.message)
        return status

    def _compute_status(self) -> ProductLicenseStatus:
        state, message, info, native_available = self._read_native_state()
        return ProductLicenseStatus(
            state=state,
            message=message,
            native_info=info,
            product_name=self._product_name,
            product_version=self._product_version,
            serial_number=self._serial_number,
            machine_code=self._machine_code,
            native_available=native_available,
            license_file=self._license_file,
            time_text=_time_text(state, info),
            create_time_text=_create_time_text(info),
        )

    def _read_native_state(
        self,
    ) -> tuple[ProductLicenseState, str, NativeLicenseInfo | None, bool]:
        available: Final = self._safe_available()
        if not available:
            reason: Final = self._backend.unavailable_reason or UNAVAILABLE_MESSAGE
            return ProductLicenseState.COMPONENT_UNAVAILABLE, reason, None, False
        try:
            info: Final = self._backend.get_license_info()
        except NativeLicenseUnavailableError as exc:
            return (
                ProductLicenseState.COMPONENT_UNAVAILABLE,
                f"{UNAVAILABLE_MESSAGE}: {exc}",
                None,
                False,
            )
        except Exception as exc:  # noqa: BLE001  # native call failures must surface as license state, not HTTP 500
            return ProductLicenseState.INVALID, f"获取授权信息失败: {exc}", None, True
        state, message = self._evaluate(info)
        return state, message, info, True

    def _safe_available(self) -> bool:
        try:
            return self._backend.available
        except Exception:  # noqa: BLE001  # a broken native library must not crash license status reporting
            return False

    @staticmethod
    def _evaluate(info: NativeLicenseInfo) -> tuple[ProductLicenseState, str]:
        if info.version_int == 0:
            return ProductLicenseState.UNAUTHORIZED, "该系统未被授权，请导入授权文件"
        if info.t_start == info.t_end:
            return ProductLicenseState.AUTHORIZED, "授权有效"
        now: Final = int(time.time())
        if now < info.t_start:
            return ProductLicenseState.NOT_YET_VALID, f"授权未到生效日期: {_format_timestamp(info.t_start)}"
        if now > info.t_end:
            return ProductLicenseState.EXPIRED, f"授权已过期: {_format_timestamp(info.t_end)}"
        return ProductLicenseState.AUTHORIZED, "授权有效"

    def _persist_license(self, compact_hex: bytes) -> None:
        license_path: Final = Path(self._license_file)
        license_path.parent.mkdir(parents=True, exist_ok=True)
        temporary_path: Final = license_path.with_name(f"{license_path.name}.tmp")
        temporary_path.write_bytes(compact_hex)
        temporary_path.replace(license_path)


@lru_cache(maxsize=1)
def _create_manager() -> ProductLicenseManager:
    return ProductLicenseManager()


def get_product_license_manager() -> ProductLicenseManager:
    return _create_manager()


def reset_product_license_manager() -> None:
    _create_manager.cache_clear()
