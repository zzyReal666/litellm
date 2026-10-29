from __future__ import annotations

from litellm.proxy.product_license import fingerprint


def test_format_serial_groups_and_uppercases():
    assert fingerprint.format_serial("0123456789abcdef") == "0123-4567-89AB-CDEF"


def test_product_serial_number_uses_fingerprint(monkeypatch):
    monkeypatch.delenv("LITELLM_PRODUCT_SERIAL", raising=False)
    assert fingerprint.product_serial_number("0123456789abcdef") == "0123-4567-89AB-CDEF"


def test_product_serial_number_env_override(monkeypatch):
    monkeypatch.setenv("LITELLM_PRODUCT_SERIAL", "ZC-2026-0001")
    assert fingerprint.product_serial_number("0123456789abcdef") == "ZC-2026-0001"


def test_machine_fingerprint_is_stable_hex_digest():
    first = fingerprint.machine_fingerprint()
    second = fingerprint.machine_fingerprint()
    assert first == second
    assert len(first) == 64
    assert int(first, 16) >= 0
