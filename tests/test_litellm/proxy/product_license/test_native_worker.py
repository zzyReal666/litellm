from __future__ import annotations

import io

from litellm.proxy.product_license import native_worker
from litellm.proxy.product_license.native_backend import NativeLicenseError
from tests.test_litellm.proxy.product_license._product_license_test_utils import (
    FakeNativeLicenseBackend,
    build_info,
)


def test_request_command_prints_hex(capsys):
    backend = FakeNativeLicenseBackend(build_info(), request=b"\x01\x02\xab")

    exit_code = native_worker.main(("request", "--server-type", "gateway"), backend=backend)

    captured = capsys.readouterr()
    assert exit_code == 0
    assert captured.out.strip() == "0102ab"
    assert backend.requested_server_types == ["gateway"]


def test_request_command_uses_default_server_type(capsys):
    backend = FakeNativeLicenseBackend(build_info(), request=b"\xaa")

    exit_code = native_worker.main(("request",), backend=backend)

    assert exit_code == 0
    assert capsys.readouterr().out.strip() == "aa"
    assert backend.requested_server_types == [native_worker.DEFAULT_SERVER_TYPE]


def test_import_command_reads_hex_from_stdin(monkeypatch, capsys):
    backend = FakeNativeLicenseBackend(build_info())
    monkeypatch.setattr("sys.stdin", io.StringIO("de ad be ef\n"))

    exit_code = native_worker.main(("import",), backend=backend)

    assert exit_code == 0
    assert backend.imported_payloads == [b"\xde\xad\xbe\xef"]
    assert capsys.readouterr().out.strip() == "ok"


def test_import_command_reports_native_error(monkeypatch, capsys):
    backend = FakeNativeLicenseBackend(build_info(), import_error=NativeLicenseError("bad license"))
    monkeypatch.setattr("sys.stdin", io.StringIO("deadbeef"))

    exit_code = native_worker.main(("import",), backend=backend)

    captured = capsys.readouterr()
    assert exit_code == 1
    assert "bad license" in captured.err


def test_import_command_rejects_invalid_hex(monkeypatch, capsys):
    backend = FakeNativeLicenseBackend(build_info())
    monkeypatch.setattr("sys.stdin", io.StringIO("not-hex"))

    exit_code = native_worker.main(("import",), backend=backend)

    assert exit_code == 1
    assert backend.imported_payloads == []
    assert capsys.readouterr().err.strip() != ""
