from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from enum import Enum
from types import MappingProxyType
from typing import Final

from pydantic import BaseModel


class ProductLicenseState(str, Enum):
    AUTHORIZED = "authorized"
    UNAUTHORIZED = "unauthorized"
    EXPIRED = "expired"
    NOT_YET_VALID = "not_yet_valid"
    INVALID = "invalid"
    COMPONENT_UNAVAILABLE = "component_unavailable"


STATE_DISPLAY: Final[Mapping[ProductLicenseState, str]] = MappingProxyType(
    {
        ProductLicenseState.AUTHORIZED: "正式授权",
        ProductLicenseState.UNAUTHORIZED: "未授权",
        ProductLicenseState.EXPIRED: "已过期",
        ProductLicenseState.NOT_YET_VALID: "未生效",
        ProductLicenseState.INVALID: "授权无效",
        ProductLicenseState.COMPONENT_UNAVAILABLE: "授权组件不可用",
    }
)


@dataclass(frozen=True, slots=True)
class NativeLicenseInfo:
    version_int: int
    server_type: str
    user_count: int
    thread_count: int
    t_start: int
    t_end: int
    user_desc: str
    reserved1: str
    reserved2: str


@dataclass(frozen=True, slots=True)
class ProductLicenseStatus:
    state: ProductLicenseState
    message: str
    native_info: NativeLicenseInfo | None
    product_name: str
    product_version: str
    serial_number: str
    machine_code: str
    native_available: bool
    license_file: str
    time_text: str
    create_time_text: str

    @property
    def authorized(self) -> bool:
        return self.state is ProductLicenseState.AUTHORIZED

    @property
    def status_text(self) -> str:
        return STATE_DISPLAY[self.state]


class ProductLicenseInfoResponse(BaseModel):
    product_name: str
    product_version: str
    serial_number: str
    status: str
    time: str
    create_time: str
    auth_state: str
    machine_code: str
    user_count: int | None
    thread_count: int | None
    user_desc: str | None
    license_version: int | None
    native_available: bool
    license_file: str
    message: str


class ProductLicenseImportResponse(BaseModel):
    message: str
    license: ProductLicenseInfoResponse


def status_to_response(status: ProductLicenseStatus) -> ProductLicenseInfoResponse:
    native_info: Final = status.native_info
    return ProductLicenseInfoResponse(
        product_name=status.product_name,
        product_version=status.product_version,
        serial_number=status.serial_number,
        status=status.status_text,
        time=status.time_text,
        create_time=status.create_time_text,
        auth_state=status.state.value,
        machine_code=status.machine_code,
        user_count=native_info.user_count if native_info is not None else None,
        thread_count=native_info.thread_count if native_info is not None else None,
        user_desc=native_info.user_desc if native_info is not None else None,
        license_version=native_info.version_int if native_info is not None else None,
        native_available=status.native_available,
        license_file=status.license_file,
        message=status.message,
    )
