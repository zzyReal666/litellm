from __future__ import annotations

import hashlib
import os
import platform
import re
import shutil
import subprocess
from pathlib import Path
from typing import Final

MACHINE_ID_PATHS: Final = ("/etc/machine-id", "/var/lib/dbus/machine-id")
LINUX_DMI_PATHS: Final = (
    "/sys/class/dmi/id/board_serial",
    "/sys/class/dmi/id/product_serial",
    "/sys/class/dmi/id/product_uuid",
)
MACOS_PLATFORM_KEYS: Final = ("IOPlatformSerialNumber", "IOPlatformUUID")
SERIAL_GROUP_SIZE: Final = 4
SERIAL_GROUPS: Final = 4


def _read_text(path: str) -> str | None:
    try:
        content: Final = Path(path).read_text(encoding="utf-8", errors="replace").strip()
    except OSError:
        return None
    return content or None


def _run_command(command: tuple[str, ...]) -> str | None:
    executable: Final = shutil.which(command[0])
    if executable is None:
        return None
    try:
        completed: Final = subprocess.run(
            (executable, *command[1:]),
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    output: Final = completed.stdout.strip()
    return output or None


def _cpuinfo_serial() -> str | None:
    text: Final = _read_text("/proc/cpuinfo")
    if text is None:
        return None
    for line in text.splitlines():
        key, separator, value = line.partition(":")
        if separator and key.strip().lower() == "serial" and value.strip():
            return value.strip()
    return None


def _linux_components() -> tuple[str, ...]:
    cpu_serial: Final = _cpuinfo_serial()
    board_values: Final = tuple(
        board_value for path in LINUX_DMI_PATHS if (board_value := _read_text(path)) is not None
    )
    machine_ids: Final = tuple(machine_id for path in MACHINE_ID_PATHS if (machine_id := _read_text(path)) is not None)
    return tuple(component for component in (cpu_serial, *board_values, *machine_ids) if component)


def _macos_components() -> tuple[str, ...]:
    ioreg: Final = _run_command(("ioreg", "-rd1", "-c", "IOPlatformExpertDevice"))
    if ioreg is None:
        return ()
    values: Final = tuple(
        match.group(1)
        for key in MACOS_PLATFORM_KEYS
        if (match := re.search(rf'"{key}"\s*=\s*"([^"]+)"', ioreg)) is not None
    )
    return tuple(component for component in values if component)


def _windows_components() -> tuple[str, ...]:
    commands: Final = (
        ("powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_Processor).ProcessorId"),
        ("powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_BaseBoard).SerialNumber"),
        ("powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_ComputerSystemProduct).UUID"),
    )
    values: Final = tuple(output for command in commands if (output := _run_command(command)) is not None)
    return values


def _platform_components(system: str) -> tuple[str, ...]:
    if system == "Linux":
        return _linux_components()
    if system == "Darwin":
        return _macos_components()
    if system == "Windows":
        return _windows_components()
    return ()


def machine_components() -> tuple[str, ...]:
    system: Final = platform.system()
    components: Final = _platform_components(system)
    if components:
        return components
    return tuple(
        component
        for component in (platform.node().strip(), platform.machine().strip(), platform.system().strip())
        if component
    )


def machine_fingerprint() -> str:
    payload: Final = "\n".join(machine_components()).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def format_serial(digest_hex: str) -> str:
    grouped: Final = "-".join(
        digest_hex[index : index + SERIAL_GROUP_SIZE].upper()
        for index in range(0, SERIAL_GROUP_SIZE * SERIAL_GROUPS, SERIAL_GROUP_SIZE)
    )
    return grouped


def product_serial_number(fingerprint: str | None = None) -> str:
    override: Final = os.getenv("LITELLM_PRODUCT_SERIAL", "").strip()
    if override:
        return override
    return format_serial(fingerprint or machine_fingerprint())
