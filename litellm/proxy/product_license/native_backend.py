from __future__ import annotations

import ctypes
import ctypes.util
import os
from collections.abc import Callable
from struct import Struct
from typing import Final, Protocol

from litellm._logging import verbose_proxy_logger
from litellm.proxy.product_license.types import NativeLicenseInfo

LICENSE_REQUEST_BUFFER_SIZE: Final = 3072
LICENSE_INFO_MIN_SIZE: Final = 196
LICENSE_INFO_STRUCT: Final = Struct("<i32siiqq64sii32s32s")
RESERVED_FIELD_MAX_LENGTH: Final = 32
DEFAULT_SERVER_TYPE: Final = "ai-token-gateway"

PACKAGE_LIB_DIR: Final = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib")
COMMON_LIBRARY_PATHS: Final = (
    os.path.join(PACKAGE_LIB_DIR, "liblicense.so"),
    os.path.join(os.getcwd(), "liblicense.so"),
    "/usr/local/lib/liblicense.so",
    "/usr/lib/liblicense.so",
    "/app/liblicense.so",
)


class NativeLicenseError(RuntimeError):
    pass


class NativeLicenseUnavailableError(NativeLicenseError):
    pass


class NativeLicenseBackend(Protocol):
    @property
    def available(self) -> bool: ...

    @property
    def unavailable_reason(self) -> str: ...

    def generate_request(self, server_type: str) -> bytes: ...

    def import_license(self, license_bytes: bytes) -> None: ...

    def get_license_info(self) -> NativeLicenseInfo: ...


def decode_fixed_string(raw: bytes) -> str:
    return raw.split(b"\x00", maxsplit=1)[0].decode("utf-8", errors="replace")


def _as_int(value: object) -> int:
    return int(value)  # pyright: ignore[reportArgumentType]  # struct.unpack elements are untyped


def _as_bytes(value: object) -> bytes:
    return bytes(value)  # pyright: ignore[reportArgumentType]  # struct.unpack elements are untyped


def _bounded_length(length: int, limit: int) -> int:
    return min(max(length, 0), limit)


def parse_license_info(payload: bytes) -> NativeLicenseInfo:
    if len(payload) < LICENSE_INFO_MIN_SIZE:
        raise NativeLicenseError(f"授权信息长度不足: {len(payload)} < {LICENSE_INFO_MIN_SIZE}")
    fields: Final[tuple[object, ...]] = LICENSE_INFO_STRUCT.unpack(payload[:LICENSE_INFO_MIN_SIZE])
    return NativeLicenseInfo(
        version_int=_as_int(fields[0]),
        server_type=decode_fixed_string(_as_bytes(fields[1])),
        user_count=_as_int(fields[2]),
        thread_count=_as_int(fields[3]),
        t_start=_as_int(fields[4]),
        t_end=_as_int(fields[5]),
        user_desc=decode_fixed_string(_as_bytes(fields[6])),
        reserved1=decode_fixed_string(
            _as_bytes(fields[9])[: _bounded_length(_as_int(fields[7]), RESERVED_FIELD_MAX_LENGTH)]
        ),
        reserved2=decode_fixed_string(
            _as_bytes(fields[10])[: _bounded_length(_as_int(fields[8]), RESERVED_FIELD_MAX_LENGTH)]
        ),
    )


def resolve_library_path(library_path: str | None = None) -> tuple[str | None, str]:
    requested: Final = library_path or os.getenv("LITELLM_PRODUCT_LICENSE_LIB", "").strip() or None
    if requested is not None:
        if os.path.isfile(requested):
            return requested, ""
        return None, f"LITELLM_PRODUCT_LICENSE_LIB 指向的文件不存在: {requested}"
    for candidate in COMMON_LIBRARY_PATHS:
        if os.path.isfile(candidate):
            return candidate, ""
    discovered: Final = ctypes.util.find_library("license")
    if discovered:
        return discovered, ""
    return None, "未找到 liblicense.so，请设置 LITELLM_PRODUCT_LICENSE_LIB 或把原生库放到应用目录"


def _foreign_function(library: ctypes.CDLL, name: str) -> Callable[..., object]:
    function: Final = library[name]  # pyright: ignore[reportAny]  # ctypes exposes foreign functions dynamically
    return function


def _bind_signature(library: ctypes.CDLL, name: str, arguments: tuple[object, ...], result: object) -> None:
    function: Final = _foreign_function(library, name)
    setattr(function, "argtypes", arguments)  # noqa: B010  # ctypes function signatures are set dynamically
    setattr(function, "restype", result)  # noqa: B010  # ctypes function signatures are set dynamically


def _invoke(function: Callable[..., object], arguments: tuple[object, ...]) -> int:
    return _as_int(function(*arguments))


class LibLicenseBackend:
    def __init__(self, library_path: str | None = None) -> None:
        self._requested_library_path: Final = library_path
        self._library: ctypes.CDLL | None = None
        self._load_error: str = ""

    @property
    def available(self) -> bool:
        try:
            self._load_library()
        except NativeLicenseUnavailableError:
            return False
        return True

    @property
    def unavailable_reason(self) -> str:
        return self._load_error

    def _load_library(self) -> ctypes.CDLL:
        if self._library is not None:
            return self._library
        resolved, error = resolve_library_path(self._requested_library_path)
        if resolved is None:
            self._load_error = error
            raise NativeLicenseUnavailableError(error)
        try:
            library: Final = ctypes.CDLL(resolved)
        except OSError as exc:
            self._load_error = f"加载原生授权库失败: {resolved}: {exc}"
            raise NativeLicenseUnavailableError(self._load_error) from exc
        self._configure(library)
        self._library = library
        verbose_proxy_logger.debug("product license native library loaded: %s", resolved)
        return library

    def _configure(self, library: ctypes.CDLL) -> None:
        _bind_signature(library, "License_OpenDevice", (ctypes.POINTER(ctypes.c_void_p),), ctypes.c_int)
        _bind_signature(
            library,
            "License_OpenSession",
            (ctypes.c_void_p, ctypes.POINTER(ctypes.c_void_p)),
            ctypes.c_int,
        )
        _bind_signature(library, "License_CloseSession", (ctypes.c_void_p,), ctypes.c_int)
        _bind_signature(library, "License_CloseDevice", (ctypes.c_void_p,), ctypes.c_int)
        _bind_signature(
            library,
            "License_GenerateLicenseReq",
            (
                ctypes.c_void_p,
                ctypes.c_char_p,
                ctypes.c_int,
                ctypes.POINTER(ctypes.c_char),
                ctypes.POINTER(ctypes.c_int),
            ),
            ctypes.c_int,
        )
        _bind_signature(
            library,
            "License_ImportLicenseResp",
            (ctypes.c_void_p, ctypes.POINTER(ctypes.c_char), ctypes.c_int),
            ctypes.c_int,
        )
        _bind_signature(
            library,
            "License_GetLicenseInfo",
            (ctypes.c_void_p, ctypes.POINTER(ctypes.c_char), ctypes.POINTER(ctypes.c_int)),
            ctypes.c_int,
        )

    def _open_session(self) -> tuple[ctypes.c_void_p, ctypes.c_void_p]:
        library: Final = self._load_library()
        device_handle: Final = ctypes.c_void_p()
        open_device: Final = _foreign_function(library, "License_OpenDevice")
        return_code: Final = _invoke(open_device, (ctypes.byref(device_handle),))
        if return_code != 0:
            raise NativeLicenseError(f"License_OpenDevice 失败: 0x{return_code:08x}")
        session_handle: Final = ctypes.c_void_p()
        open_session: Final = _foreign_function(library, "License_OpenSession")
        session_return_code: Final = _invoke(open_session, (device_handle, ctypes.byref(session_handle)))
        if session_return_code != 0:
            self._close(library, device_handle, None)
            raise NativeLicenseError(f"License_OpenSession 失败: 0x{session_return_code:08x}")
        return device_handle, session_handle

    @staticmethod
    def _close(
        library: ctypes.CDLL,
        device_handle: ctypes.c_void_p,
        session_handle: ctypes.c_void_p | None,
    ) -> None:
        if session_handle is not None:
            close_session: Final = _foreign_function(library, "License_CloseSession")
            _invoke(close_session, (session_handle,))
        close_device: Final = _foreign_function(library, "License_CloseDevice")
        _invoke(close_device, (device_handle,))

    def generate_request(self, server_type: str = DEFAULT_SERVER_TYPE) -> bytes:
        library: Final = self._load_library()
        server_type_bytes: Final = server_type.encode("utf-8")
        request_buffer: Final = ctypes.create_string_buffer(LICENSE_REQUEST_BUFFER_SIZE)
        request_length: Final = ctypes.c_int(0)
        device_handle, session_handle = self._open_session()
        try:
            generate_request: Final = _foreign_function(library, "License_GenerateLicenseReq")
            return_code: Final = _invoke(
                generate_request,
                (
                    session_handle,
                    ctypes.c_char_p(server_type_bytes),
                    len(server_type_bytes),
                    request_buffer,
                    ctypes.byref(request_length),
                ),
            )
            if return_code != 0:
                raise NativeLicenseError(f"License_GenerateLicenseReq 失败: 0x{return_code:08x}")
            request_bytes: Final = request_buffer.raw[
                : _bounded_length(request_length.value, LICENSE_REQUEST_BUFFER_SIZE)
            ]
        finally:
            self._close(library, device_handle, session_handle)
        if not request_bytes:
            raise NativeLicenseError("License_GenerateLicenseReq 返回空申请码")
        return request_bytes

    def import_license(self, license_bytes: bytes) -> None:
        library: Final = self._load_library()
        payload: Final = bytes(license_bytes)
        if not payload:
            raise NativeLicenseError("授权文件内容为空")
        license_buffer: Final = ctypes.create_string_buffer(payload, len(payload))
        device_handle, session_handle = self._open_session()
        try:
            import_response: Final = _foreign_function(library, "License_ImportLicenseResp")
            return_code: Final = _invoke(
                import_response,
                (session_handle, license_buffer, len(payload)),
            )
            if return_code != 0:
                raise NativeLicenseError(f"License_ImportLicenseResp 失败: 0x{return_code:08x}")
        finally:
            self._close(library, device_handle, session_handle)

    def get_license_info(self) -> NativeLicenseInfo:
        library: Final = self._load_library()
        info_buffer: Final = ctypes.create_string_buffer(LICENSE_REQUEST_BUFFER_SIZE)
        info_length: Final = ctypes.c_int(0)
        device_handle, session_handle = self._open_session()
        try:
            get_license_info: Final = _foreign_function(library, "License_GetLicenseInfo")
            return_code: Final = _invoke(
                get_license_info,
                (session_handle, info_buffer, ctypes.byref(info_length)),
            )
            if return_code != 0:
                raise NativeLicenseError(f"License_GetLicenseInfo 失败: 0x{return_code:08x}")
            info_bytes: Final = info_buffer.raw
        finally:
            self._close(library, device_handle, session_handle)
        return parse_license_info(info_bytes)
