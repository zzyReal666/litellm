#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT}/scripts/_lib.sh"
litellm_load_env

PORT="${LITELLM_PORT:-4000}"
BASE="http://127.0.0.1:${PORT}"

if [[ -z "${LITELLM_MASTER_KEY:-}" ]]; then
  echo "错误: .env 缺少 LITELLM_MASTER_KEY" >&2
  exit 1
fi
if [[ -z "${DEEPSEEK_API_KEY:-}" ]]; then
  echo "错误: .env 缺少 DEEPSEEK_API_KEY" >&2
  exit 1
fi

python3 - "${BASE}" "${LITELLM_MASTER_KEY}" "${DEEPSEEK_API_KEY}" "${DEEPSEEK_API_KEY_2:-}" <<'PY'
import json
import sys
import urllib.error
import urllib.request

base, master, key1, key2 = sys.argv[1:5]

off_peak = {
    "hours_utc": ["00:00-01:00", "04:00-06:00", "10:00-00:00"],
    "weekday_timezone": "Asia/Shanghai",
    "windows": [{"hours_utc": "00:00-00:00", "weekdays": [6, 7]}],
}

FLASH = {
    "input_cost_per_token": 2.0e-06,
    "output_cost_per_token": 8.0e-06,
    "cache_read_input_token_cost": 4.0e-08,
}
FLASH_OFF = {
    "input_cost_per_token": 1.0e-06,
    "output_cost_per_token": 4.0e-06,
    "cache_read_input_token_cost": 2.0e-08,
}
PRO = {
    "input_cost_per_token": 9.0e-06,
    "output_cost_per_token": 2.7e-05,
    "cache_read_input_token_cost": 3.0e-07,
}
PRO_OFF = {
    "input_cost_per_token": 4.5e-06,
    "output_cost_per_token": 1.35e-05,
    "cache_read_input_token_cost": 1.5e-07,
}

groups = [
    ("deepseek-v4-flash", "deepseek/deepseek-v4-flash", FLASH, FLASH_OFF, {}),
    ("deepseek-flash", "deepseek/deepseek-v4-flash", FLASH, FLASH_OFF, {}),
    ("deepseek-v4-pro", "deepseek/deepseek-v4-pro", PRO, PRO_OFF, {}),
    ("deepseek-v4-flash-vision-exp", "deepseek/deepseek-v4-flash-vision-exp", FLASH, FLASH_OFF, {"supports_vision": True}),
]


def call(method, path, payload=None):
    url = base + path
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + master)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode()
    return json.loads(body) if body else None


info = call("GET", "/model/info")
rows = info.get("data", []) if isinstance(info, dict) else (info or [])
existing = {
    row.get("model_name")
    for row in rows
    if isinstance(row, dict) and row.get("model_name")
}

created = 0
for name, upstream, price, off, extra_info in groups:
    keys = [k for k in (key1, key2) if k]
    if name == "deepseek-v4-flash-vision-exp":
        keys = keys[:1]
    for idx, key in enumerate(keys):
        suffix = "" if idx == 0 else "-key2"
        model_name = name if idx == 0 else f"{name}{suffix}"
        if model_name in existing:
            print(f"跳过已存在: {model_name}")
            continue
        info = dict(extra_info)
        info["off_peak_pricing"] = dict(off, **{k: v for k, v in off_peak.items()})
        payload = {
            "model_name": model_name,
            "litellm_params": dict(price, model=upstream, api_key=key),
            "model_info": info,
        }
        try:
            call("POST", "/model/new", payload)
            print(f"已创建: {model_name}")
            created += 1
        except urllib.error.HTTPError as exc:
            print(f"创建失败 {model_name}: HTTP {exc.code} {exc.read().decode()[:200]}")

print(f"完成，新建 {created} 个 deployment")
PY
