from __future__ import annotations

import time

import pytest

from litellm.proxy.product_license.manager import (
    MAX_LICENSE_FILE_CHARS,
    ProductLicenseImportError,
    ProductLicenseManager,
    is_enforcement_enabled,
)
from litellm.proxy.product_license.native_backend import NativeLicenseError
from litellm.proxy.product_license.types import ProductLicenseState
from tests.test_litellm.proxy.product_license._product_license_test_utils import (
    FakeNativeLicenseBackend,
    build_info,
)


def make_manager(
    tmp_path,
    info,
    product_code="ai-token-gateway",
    **backend_kwargs,
):
    backend = FakeNativeLicenseBackend(info, **backend_kwargs)
    license_manager = ProductLicenseManager(
        backend=backend,
        license_file=str(tmp_path / "license.lic"),
        product_name="AI Token网关",
        product_version="9.9.9",
        product_code=product_code,
        serial_number="AAAA-BBBB-CCCC-DDDD",
        machine_fingerprint="0" * 64,
    )
    return license_manager, backend


def format_timestamp(timestamp: int) -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(timestamp))


def test_permanent_license_is_authorized(tmp_path):
    license_manager, _ = make_manager(tmp_path, build_info(t_start=1700000000, t_end=1700000000))

    status = license_manager.get_status()

    assert status.state is ProductLicenseState.AUTHORIZED
    assert status.authorized is True
    assert status.status_text == "正式授权"
    assert status.time_text == "长期有效"
    assert status.create_time_text == format_timestamp(1700000000)
    assert status.serial_number == "AAAA-BBBB-CCCC-DDDD"
    assert status.machine_code == "0000-0000-0000-0000"
    assert status.product_name == "AI Token网关"
    assert status.product_version == "9.9.9"


def test_license_within_date_range_is_authorized(tmp_path):
    now = int(time.time())
    license_manager, _ = make_manager(tmp_path, build_info(t_start=now - 100, t_end=now + 100))

    status = license_manager.get_status()

    assert status.state is ProductLicenseState.AUTHORIZED
    assert format_timestamp(now - 100) in status.time_text
    assert " 至 " in status.time_text


def test_expired_license_is_not_authorized(tmp_path):
    now = int(time.time())
    license_manager, _ = make_manager(tmp_path, build_info(t_start=now - 1000, t_end=now - 10))

    status = license_manager.get_status()

    assert status.state is ProductLicenseState.EXPIRED
    assert status.authorized is False
    assert status.status_text == "已过期"
    assert status.message == f"授权已过期: {format_timestamp(now - 10)}"


def test_not_yet_valid_license_is_not_authorized(tmp_path):
    now = int(time.time())
    license_manager, _ = make_manager(tmp_path, build_info(t_start=now + 100, t_end=now + 1000))

    status = license_manager.get_status()

    assert status.state is ProductLicenseState.NOT_YET_VALID
    assert status.authorized is False
    assert status.time_text.endswith("起生效")


def test_unlicensed_device_is_unauthorized(tmp_path):
    license_manager, _ = make_manager(tmp_path, build_info(version_int=0))

    status = license_manager.get_status()

    assert status.state is ProductLicenseState.UNAUTHORIZED
    assert status.authorized is False
    assert status.status_text == "未授权"
    assert status.time_text == "暂无信息"
    assert status.create_time_text == "暂无信息"
    assert status.native_available is True


def test_missing_native_library_is_component_unavailable(tmp_path):
    license_manager, _ = make_manager(tmp_path, build_info(), available=False)

    status = license_manager.get_status()

    assert status.state is ProductLicenseState.COMPONENT_UNAVAILABLE
    assert status.native_available is False
    assert status.message == "未找到 liblicense.so"
    assert status.serial_number == "AAAA-BBBB-CCCC-DDDD"


def test_native_lookup_failure_is_invalid(tmp_path):
    license_manager, _ = make_manager(tmp_path, build_info(), info_error=NativeLicenseError("boom"))

    status = license_manager.get_status()

    assert status.state is ProductLicenseState.INVALID
    assert "boom" in status.message


def test_status_is_cached_until_forced(tmp_path):
    license_manager, backend = make_manager(tmp_path, build_info(t_start=1700000000, t_end=1700000000))
    first = license_manager.get_status()
    backend.info = build_info(version_int=0)

    cached = license_manager.get_status()
    refreshed = license_manager.get_status(force_refresh=True)

    assert cached is first
    assert cached.state is ProductLicenseState.AUTHORIZED
    assert refreshed.state is ProductLicenseState.UNAUTHORIZED


def test_request_code_is_lowercase_hex_and_uses_product_code(tmp_path):
    license_manager, backend = make_manager(tmp_path, build_info(), request=b"\x01\x02\xab", product_code="gateway")
    assert license_manager.get_request_code() == "0102ab"
    assert backend.requested_server_types == ["gateway"]


def test_import_persists_license_and_returns_authorized_status(tmp_path):
    authorized = build_info(t_start=1700000000, t_end=1700000000)
    license_manager, backend = make_manager(
        tmp_path,
        build_info(version_int=0),
        info_after_import=authorized,
    )

    status = license_manager.import_license(b"de ad be ef\n")

    assert status.authorized is True
    assert backend.imported_payloads == [b"\xde\xad\xbe\xef"]
    assert (tmp_path / "license.lic").read_bytes() == b"deadbeef"


@pytest.mark.parametrize("payload", [b"", b"  \n\t "])
def test_import_rejects_empty_file(tmp_path, payload):
    license_manager, _ = make_manager(tmp_path, build_info())
    with pytest.raises(ProductLicenseImportError, match="内容为空"):
        license_manager.import_license(payload)


def test_import_rejects_non_hex_content(tmp_path):
    license_manager, _ = make_manager(tmp_path, build_info())
    with pytest.raises(ProductLicenseImportError, match="十六进制"):
        license_manager.import_license(b"not-a-license")


def test_import_rejects_oversized_file(tmp_path):
    license_manager, _ = make_manager(tmp_path, build_info())
    with pytest.raises(ProductLicenseImportError, match="授权文件过大"):
        license_manager.import_license(b"a" * (MAX_LICENSE_FILE_CHARS + 1))


def test_import_wraps_native_import_failure(tmp_path):
    license_manager, _ = make_manager(tmp_path, build_info(), import_error=NativeLicenseError("bad response"))
    with pytest.raises(ProductLicenseImportError, match="导入失败"):
        license_manager.import_license(b"deadbeef")


def test_import_rejects_license_that_is_not_authorized(tmp_path):
    license_manager, _ = make_manager(
        tmp_path,
        build_info(version_int=0),
        info_after_import=build_info(version_int=0),
    )
    with pytest.raises(ProductLicenseImportError, match="授权文件无效"):
        license_manager.import_license(b"deadbeef")
    assert not (tmp_path / "license.lic").exists()


def test_activate_from_disk_imports_stored_license(tmp_path):
    authorized = build_info(t_start=1700000000, t_end=1700000000)
    first_manager, _ = make_manager(tmp_path, build_info(version_int=0), info_after_import=authorized)
    first_manager.import_license(b"deadbeef")

    second_manager, backend = make_manager(
        tmp_path,
        build_info(version_int=0),
        info_after_import=authorized,
    )
    status = second_manager.activate_from_disk()

    assert status.authorized is True
    assert backend.imported_payloads == [b"\xde\xad\xbe\xef"]


def test_activate_from_disk_without_license_is_unauthorized(tmp_path):
    license_manager, backend = make_manager(tmp_path, build_info(version_int=0))

    status = license_manager.activate_from_disk()

    assert status.state is ProductLicenseState.UNAUTHORIZED
    assert backend.imported_payloads == []


def test_activate_from_disk_ignores_corrupt_file(tmp_path):
    (tmp_path / "license.lic").write_bytes(b"garbage")
    license_manager, backend = make_manager(tmp_path, build_info(version_int=0))

    status = license_manager.activate_from_disk()

    assert status.state is ProductLicenseState.UNAUTHORIZED
    assert backend.imported_payloads == []


@pytest.mark.parametrize(
    ("raw_value", "expected"),
    [("1", True), ("true", True), ("TRUE", True), ("yes", True), ("false", False), ("0", False), ("off", False)],
)
def test_enforcement_enabled_parsing(monkeypatch, raw_value, expected):
    monkeypatch.setenv("LITELLM_PRODUCT_LICENSE_ENABLED", raw_value)
    assert is_enforcement_enabled() is expected


def test_enforcement_enabled_by_default(monkeypatch):
    monkeypatch.delenv("LITELLM_PRODUCT_LICENSE_ENABLED", raising=False)
    assert is_enforcement_enabled() is True
