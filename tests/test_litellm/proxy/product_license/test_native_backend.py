from __future__ import annotations

import pytest

from litellm.proxy.product_license.native_backend import (
    LICENSE_INFO_MIN_SIZE,
    LibLicenseBackend,
    NativeLicenseError,
    decode_fixed_string,
    parse_license_info,
    resolve_library_path,
)
from tests.test_litellm.proxy.product_license._product_license_test_utils import build_info, encode_info


def test_parse_license_info_roundtrip():
    info = build_info(t_start=1700000000, t_end=1800000000, reserved1="abc", reserved2="xyz")
    parsed = parse_license_info(encode_info(info))
    assert parsed == info


def test_parse_license_info_strips_nul_padding():
    parsed = parse_license_info(encode_info(build_info(server_type="abc", user_desc="x")))
    assert parsed.server_type == "abc"
    assert parsed.user_desc == "x"


def test_parse_license_info_rejects_short_payload():
    with pytest.raises(NativeLicenseError, match="授权信息长度不足"):
        parse_license_info(b"\x00" * (LICENSE_INFO_MIN_SIZE - 1))


def test_parse_license_info_clamps_reserved_lengths():
    raw = bytearray(encode_info(build_info(reserved1="ab")))
    raw[124:128] = (999).to_bytes(4, "little", signed=True)
    parsed = parse_license_info(bytes(raw))
    assert parsed.reserved1 == "ab"


def test_decode_fixed_string_handles_invalid_utf8():
    assert decode_fixed_string(b"ok\x00rest") == "ok"
    assert decode_fixed_string(b"\xff\xfe") == "\ufffd\ufffd"


def test_resolve_library_path_rejects_missing_env_target(tmp_path, monkeypatch):
    missing = tmp_path / "nope.so"
    monkeypatch.setenv("LITELLM_PRODUCT_LICENSE_LIB", str(missing))
    resolved, error = resolve_library_path()
    assert resolved is None
    assert "不存在" in error


def test_resolve_library_path_accepts_existing_env_target(tmp_path, monkeypatch):
    library = tmp_path / "liblicense.so"
    library.write_bytes(b"")
    monkeypatch.setenv("LITELLM_PRODUCT_LICENSE_LIB", str(library))
    resolved, error = resolve_library_path()
    assert resolved == str(library)
    assert error == ""


def test_lib_license_backend_reports_unavailable_reason(tmp_path):
    backend = LibLicenseBackend(library_path=str(tmp_path / "missing.so"))
    assert backend.available is False
    assert "不存在" in backend.unavailable_reason
