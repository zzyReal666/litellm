from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from litellm.proxy.product_license import router as router_module
from litellm.proxy.product_license.manager import ProductLicenseManager
from litellm.proxy.product_license.native_backend import NativeLicenseError
from tests.test_litellm.proxy.product_license._product_license_test_utils import (
    FakeNativeLicenseBackend,
    build_info,
)


def make_manager(tmp_path, info, **backend_kwargs) -> ProductLicenseManager:
    return ProductLicenseManager(
        backend=FakeNativeLicenseBackend(info, **backend_kwargs),
        license_file=str(tmp_path / "license.lic"),
        product_name="AI Token网关",
        product_version="9.9.9",
        serial_number="AAAA-BBBB-CCCC-DDDD",
        machine_fingerprint="0" * 64,
    )


def make_client(monkeypatch, license_manager: ProductLicenseManager) -> TestClient:
    monkeypatch.setattr(router_module, "get_product_license_manager", lambda: license_manager)
    app = FastAPI()
    app.include_router(router_module.router)
    return TestClient(app)


def test_info_endpoint_returns_authorization_details(tmp_path, monkeypatch):
    license_manager = make_manager(tmp_path, build_info(t_start=1700000000, t_end=1700000000))
    client = make_client(monkeypatch, license_manager)

    response = client.get("/product/license/info")

    assert response.status_code == 200
    body = response.json()
    assert body["product_name"] == "AI Token网关"
    assert body["product_version"] == "9.9.9"
    assert body["serial_number"] == "AAAA-BBBB-CCCC-DDDD"
    assert body["machine_code"] == "0000-0000-0000-0000"
    assert body["status"] == "正式授权"
    assert body["time"] == "长期有效"
    assert body["auth_state"] == "authorized"
    assert body["license_version"] == 1
    assert body["user_count"] == 100
    assert body["native_available"] is True


def test_info_endpoint_reports_unlicensed_state(tmp_path, monkeypatch):
    license_manager = make_manager(tmp_path, build_info(version_int=0))
    client = make_client(monkeypatch, license_manager)

    body = client.get("/product/license/info").json()

    assert body["status"] == "未授权"
    assert body["auth_state"] == "unauthorized"
    assert body["license_version"] == 0


def test_request_endpoint_returns_hex_text_attachment(tmp_path, monkeypatch):
    license_manager = make_manager(tmp_path, build_info(), request=b"\x01\x02\xab")
    client = make_client(monkeypatch, license_manager)

    response = client.get("/product/license/request")

    assert response.status_code == 200
    assert response.text == "0102ab"
    assert "product_license_request.txt" in response.headers["content-disposition"]


def test_request_endpoint_returns_503_when_native_library_fails(tmp_path, monkeypatch):
    license_manager = make_manager(
        tmp_path,
        build_info(),
        request_error=NativeLicenseError("device busy"),
    )
    client = make_client(monkeypatch, license_manager)

    response = client.get("/product/license/request")

    assert response.status_code == 503
    assert "device busy" in response.json()["detail"]


def test_import_endpoint_activates_and_persists_license(tmp_path, monkeypatch):
    authorized = build_info(t_start=1700000000, t_end=1700000000)
    license_manager = make_manager(
        tmp_path,
        build_info(version_int=0),
        info_after_import=authorized,
    )
    client = make_client(monkeypatch, license_manager)

    response = client.post(
        "/product/license/import",
        files={"file": ("license.txt", b"de ad be ef")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "授权成功"
    assert body["license"]["auth_state"] == "authorized"
    assert (tmp_path / "license.lic").read_bytes() == b"deadbeef"


def test_import_endpoint_rejects_invalid_file(tmp_path, monkeypatch):
    license_manager = make_manager(tmp_path, build_info(version_int=0))
    client = make_client(monkeypatch, license_manager)

    response = client.post(
        "/product/license/import",
        files={"file": ("license.txt", b"not-hex")},
    )

    assert response.status_code == 400
    assert "十六进制" in response.json()["detail"]


@pytest.mark.parametrize("path", ["/product/license/info", "/product/license/request"])
def test_license_read_endpoints_are_public(tmp_path, monkeypatch, path):
    license_manager = make_manager(tmp_path, build_info())
    client = make_client(monkeypatch, license_manager)

    response = client.get(path)

    assert response.status_code == 200
