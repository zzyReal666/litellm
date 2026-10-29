from __future__ import annotations

from types import MappingProxyType
from typing import Annotated, Final

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse

from litellm._logging import verbose_proxy_logger
from litellm.proxy.product_license.manager import (
    ProductLicenseImportError,
    get_product_license_manager,
)
from litellm.proxy.product_license.native_backend import NativeLicenseError
from litellm.proxy.product_license.types import (
    ProductLicenseImportResponse,
    ProductLicenseInfoResponse,
    status_to_response,
)

router: Final = APIRouter()

REQUEST_FILE_NAME: Final = "product_license_request.txt"


@router.get(
    "/product/license/info",
    response_model=ProductLicenseInfoResponse,
    tags=["product license"],  # mutable-ok: FastAPI route tags parameter is list[str]
)
async def get_product_license_info() -> ProductLicenseInfoResponse:
    return status_to_response(get_product_license_manager().get_status())


@router.get(
    "/product/license/request",
    response_class=PlainTextResponse,
    tags=["product license"],  # mutable-ok: FastAPI route tags parameter is list[str]
)
async def download_product_license_request() -> PlainTextResponse:
    try:
        request_code: Final = get_product_license_manager().get_request_code()
    except NativeLicenseError as exc:
        raise HTTPException(status_code=503, detail=f"生成授权申请码失败: {exc}") from exc
    return PlainTextResponse(
        content=request_code,
        headers=MappingProxyType({"Content-Disposition": f'attachment; filename="{REQUEST_FILE_NAME}"'}),
    )


@router.post(
    "/product/license/import",
    response_model=ProductLicenseImportResponse,
    tags=["product license"],  # mutable-ok: FastAPI route tags parameter is list[str]
)
async def import_product_license(
    file: Annotated[UploadFile, File(description="授权文件（十六进制文本）")],
) -> ProductLicenseImportResponse:
    raw_bytes: Final = await file.read()
    try:
        status: Final = get_product_license_manager().import_license(raw_bytes)
    except ProductLicenseImportError as exc:
        verbose_proxy_logger.warning("product license import rejected: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ProductLicenseImportResponse(message="授权成功", license=status_to_response(status))
