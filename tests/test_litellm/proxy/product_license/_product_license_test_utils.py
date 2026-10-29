from __future__ import annotations

import struct
import time

from litellm.proxy.product_license.native_backend import LICENSE_INFO_STRUCT
from litellm.proxy.product_license.types import NativeLicenseInfo


def build_info(
    version_int: int = 1,
    t_start: int | None = None,
    t_end: int | None = None,
    server_type: str = "ai-token-gateway",
    user_count: int = 100,
    thread_count: int = 50,
    user_desc: str = "授权用户",
    reserved1: str = "",
    reserved2: str = "",
) -> NativeLicenseInfo:
    now = int(time.time())
    return NativeLicenseInfo(
        version_int=version_int,
        server_type=server_type,
        user_count=user_count,
        thread_count=thread_count,
        t_start=now if t_start is None else t_start,
        t_end=now if t_end is None else t_end,
        user_desc=user_desc,
        reserved1=reserved1,
        reserved2=reserved2,
    )


def encode_info(info: NativeLicenseInfo) -> bytes:
    reserved1: bytes = info.reserved1.encode("utf-8")
    reserved2: bytes = info.reserved2.encode("utf-8")
    return LICENSE_INFO_STRUCT.pack(
        info.version_int,
        info.server_type.encode("utf-8"),
        info.user_count,
        info.thread_count,
        info.t_start,
        info.t_end,
        info.user_desc.encode("utf-8"),
        len(reserved1),
        len(reserved2),
        reserved1.ljust(32, b"\x00"),
        reserved2.ljust(32, b"\x00"),
    )


def pad_info(payload: bytes) -> bytes:
    return payload + b"\x00" * (3072 - len(payload))


class FakeNativeLicenseBackend:
    def __init__(
        self,
        info: NativeLicenseInfo,
        available: bool = True,
        request: bytes = b"\x01\x02\xab",
        import_error: Exception | None = None,
        info_after_import: NativeLicenseInfo | None = None,
        request_error: Exception | None = None,
        info_error: Exception | None = None,
    ) -> None:
        self.info = info
        self.available_flag = available
        self.request = request
        self.import_error = import_error
        self.info_after_import = info_after_import
        self.request_error = request_error
        self.info_error = info_error
        self.imported_payloads: list[bytes] = []
        self.requested_server_types: list[str] = []

    @property
    def available(self) -> bool:
        return self.available_flag

    @property
    def unavailable_reason(self) -> str:
        return "" if self.available_flag else "未找到 liblicense.so"

    def generate_request(self, server_type: str) -> bytes:
        if self.request_error is not None:
            raise self.request_error
        self.requested_server_types.append(server_type)
        return self.request

    def import_license(self, license_bytes: bytes) -> None:
        if self.import_error is not None:
            raise self.import_error
        self.imported_payloads.append(license_bytes)
        if self.info_after_import is not None:
            self.info = self.info_after_import

    def get_license_info(self) -> NativeLicenseInfo:
        if self.info_error is not None:
            raise self.info_error
        return self.info


def unpack_struct(payload: bytes) -> tuple[object, ...]:
    return struct.unpack("<i32siiqq64sii32s32s", payload[:196])
