"""Isolated native license worker.

`liblicense.so` is a 2022 vendor library and can crash the process when an
invalid license response is imported after a request code was generated. Both
mutating operations therefore run in this short-lived subprocess; only the
read-only license info query stays in the proxy process.
"""

from __future__ import annotations

import argparse
import binascii
import sys
from collections.abc import Sequence
from typing import Final

from litellm.proxy.product_license.native_backend import (
    DEFAULT_SERVER_TYPE,
    LibLicenseBackend,
    NativeLicenseBackend,
    NativeLicenseError,
)


def _build_parser() -> argparse.ArgumentParser:
    parser: Final = argparse.ArgumentParser(description="product license worker")
    commands: Final = parser.add_subparsers(dest="command", required=True)
    request_parser: Final = commands.add_parser("request")
    request_parser.add_argument("--server-type", default=DEFAULT_SERVER_TYPE)
    commands.add_parser("import")
    return parser


def _string_attribute(namespace: argparse.Namespace, name: str, default: str) -> str:
    value: Final = getattr(namespace, name, default)  # pyright: ignore[reportAny]  # argparse attributes are untyped
    return value if isinstance(value, str) else default


def main(argv: Sequence[str] | None = None, backend: NativeLicenseBackend | None = None) -> int:
    arguments: Final = _build_parser().parse_args(argv)
    license_backend: Final = backend if backend is not None else LibLicenseBackend()
    command: Final = _string_attribute(arguments, "command", "")
    try:
        if command == "request":
            server_type: Final = _string_attribute(arguments, "server_type", DEFAULT_SERVER_TYPE)
            request_bytes: Final = license_backend.generate_request(server_type)
            print(binascii.hexlify(request_bytes).decode("ascii"))
            return 0
        license_text: Final = "".join(sys.stdin.read().split())
        license_bytes: Final = binascii.unhexlify(license_text)
        license_backend.import_license(license_bytes)
    except (NativeLicenseError, binascii.Error, ValueError, OSError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print("ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
