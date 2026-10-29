from __future__ import annotations

import subprocess

import pytest

from litellm.proxy.product_license import subprocess_backend as module
from litellm.proxy.product_license.native_backend import (
    NativeLicenseError,
    NativeLicenseUnavailableError,
)
from litellm.proxy.product_license.subprocess_backend import SubprocessLicenseBackend


def completed_process(returncode: int = 0, stdout: str = "", stderr: str = "") -> subprocess.CompletedProcess:
    return subprocess.CompletedProcess(("cmd",), returncode, stdout, stderr)


def test_generate_request_decodes_worker_hex(monkeypatch):
    captured = {}

    def fake_run(command, **kwargs):
        captured["command"] = command
        captured["kwargs"] = kwargs
        return completed_process(stdout="0102ab\n")

    monkeypatch.setattr(module.subprocess, "run", fake_run)
    backend = SubprocessLicenseBackend(library_path="/nonexistent/liblicense.so")

    assert backend.generate_request("svc") == b"\x01\x02\xab"
    assert captured["command"] == (
        module.sys.executable,
        "-m",
        module.WORKER_MODULE,
        "request",
        "--server-type",
        "svc",
    )
    assert captured["kwargs"]["env"]["LITELLM_LOCAL_MODEL_COST_MAP"] == "True"


def test_import_sends_hex_payload_via_stdin(monkeypatch):
    captured = {}

    def fake_run(command, **kwargs):
        captured["command"] = command
        captured["kwargs"] = kwargs
        return completed_process(stdout="ok\n")

    monkeypatch.setattr(module.subprocess, "run", fake_run)
    backend = SubprocessLicenseBackend(library_path="/nonexistent/liblicense.so")

    backend.import_license(b"\xde\xad\xbe\xef")

    assert captured["command"][3:] == ("import",)
    assert captured["kwargs"]["input"] == "deadbeef"


def test_worker_error_is_raised_with_stderr(monkeypatch):
    monkeypatch.setattr(
        module.subprocess,
        "run",
        lambda *args, **kwargs: completed_process(returncode=1, stderr="invalid license response"),
    )
    backend = SubprocessLicenseBackend(library_path="/nonexistent/liblicense.so")

    with pytest.raises(NativeLicenseError, match="invalid license response"):
        backend.import_license(b"\xde\xad\xbe\xef")


def test_worker_crash_is_reported_as_signal(monkeypatch):
    monkeypatch.setattr(
        module.subprocess,
        "run",
        lambda *args, **kwargs: completed_process(returncode=-11),
    )
    backend = SubprocessLicenseBackend(library_path="/nonexistent/liblicense.so")

    with pytest.raises(NativeLicenseError, match="signal 11"):
        backend.generate_request("svc")


def test_worker_timeout_is_reported(monkeypatch):
    def fake_run(command, **kwargs):
        raise subprocess.TimeoutExpired(command, timeout=module.WORKER_TIMEOUT_SECONDS)

    monkeypatch.setattr(module.subprocess, "run", fake_run)
    backend = SubprocessLicenseBackend(library_path="/nonexistent/liblicense.so")

    with pytest.raises(NativeLicenseUnavailableError, match="子进程执行失败"):
        backend.import_license(b"\xde\xad\xbe\xef")


def test_generate_request_rejects_non_hex_worker_output(monkeypatch):
    monkeypatch.setattr(
        module.subprocess,
        "run",
        lambda *args, **kwargs: completed_process(stdout="not hex\n"),
    )
    backend = SubprocessLicenseBackend(library_path="/nonexistent/liblicense.so")

    with pytest.raises(NativeLicenseError, match="申请码格式错误"):
        backend.generate_request("svc")


def test_import_rejects_empty_payload(tmp_path):
    backend = SubprocessLicenseBackend(library_path=str(tmp_path / "missing.so"))

    with pytest.raises(NativeLicenseError, match="内容为空"):
        backend.import_license(b"")


def test_availability_delegates_to_native_reader(tmp_path):
    backend = SubprocessLicenseBackend(library_path=str(tmp_path / "missing.so"))

    assert backend.available is False
    assert "不存在" in backend.unavailable_reason
