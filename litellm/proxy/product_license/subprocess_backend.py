"""Native license backend that isolates mutating calls in a subprocess."""

from __future__ import annotations

import binascii
import os
import subprocess
import sys
from collections.abc import Mapping
from types import MappingProxyType
from typing import Final

from litellm.proxy.product_license.native_backend import (
    DEFAULT_SERVER_TYPE,
    LibLicenseBackend,
    NativeLicenseError,
    NativeLicenseUnavailableError,
)
from litellm.proxy.product_license.types import NativeLicenseInfo

WORKER_MODULE: Final = "litellm.proxy.product_license.native_worker"
WORKER_TIMEOUT_SECONDS: Final = 60


class SubprocessLicenseBackend:
    def __init__(self, library_path: str | None = None) -> None:
        self._reader: Final = LibLicenseBackend(library_path)

    @property
    def available(self) -> bool:
        return self._reader.available

    @property
    def unavailable_reason(self) -> str:
        return self._reader.unavailable_reason

    def get_license_info(self) -> NativeLicenseInfo:
        return self._reader.get_license_info()

    def generate_request(self, server_type: str = DEFAULT_SERVER_TYPE) -> bytes:
        request_hex: Final = self._run_worker(("request", "--server-type", server_type))
        try:
            return binascii.unhexlify(request_hex)
        except (binascii.Error, ValueError) as exc:
            raise NativeLicenseError(f"授权申请码格式错误: {exc}") from exc

    def import_license(self, license_bytes: bytes) -> None:
        payload: Final = bytes(license_bytes)
        if not payload:
            raise NativeLicenseError("授权文件内容为空")
        self._run_worker(("import",), stdin=binascii.hexlify(payload).decode("ascii"))

    def _run_worker(self, arguments: tuple[str, ...], stdin: str | None = None) -> str:
        command: Final = (sys.executable, "-m", WORKER_MODULE, *arguments)
        try:
            completed: Final = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=WORKER_TIMEOUT_SECONDS,
                input=stdin,
                check=False,
                env=self._worker_env(),
            )
        except (OSError, subprocess.SubprocessError) as exc:
            raise NativeLicenseUnavailableError(f"授权子进程执行失败: {exc}") from exc
        if completed.returncode < 0:
            raise NativeLicenseError(f"授权组件异常退出(signal {-completed.returncode})")
        if completed.returncode != 0:
            detail: Final = completed.stderr.strip() or completed.stdout.strip()
            raise NativeLicenseError(f"授权操作失败: {detail or f'exit code {completed.returncode}'}")
        return completed.stdout.strip()

    @staticmethod
    def _worker_env() -> Mapping[str, str]:
        return MappingProxyType({**os.environ, "LITELLM_LOCAL_MODEL_COST_MAP": "True"})
