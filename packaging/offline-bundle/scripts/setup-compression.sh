#!/usr/bin/env bash
# 幂等地创建指向内置 headroom 服务的提示词压缩护栏。
# 用法: setup-compression.sh
set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"
litellm_load_env

PORT="${LITELLM_PORT:-4000}"
BASE="http://127.0.0.1:${PORT}"
HEADROOM_PORT="${HEADROOM_HOST_PORT:-8787}"
HEADROOM_BASE="http://127.0.0.1:${HEADROOM_PORT}"
GUARDRAIL_NAME="${HEADROOM_GUARDRAIL_NAME:-headroom-compression}"
# 护栏跑在 litellm 容器里，走 compose 网络的服务名，不是宿主的 127.0.0.1
GUARDRAIL_API_BASE="${HEADROOM_GUARDRAIL_API_BASE:-http://headroom:8787}"
GUARDRAIL_API_KEY="${HEADROOM_PROXY_TOKEN:-}"

if [[ -z "${LITELLM_MASTER_KEY:-}" ]]; then
  echo "错误: .env 缺少 LITELLM_MASTER_KEY" >&2
  exit 1
fi

ready=0
for _ in $(seq 1 40); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "${HEADROOM_BASE}/livez" || true)"
  if [[ "${code}" == "200" ]]; then
    ready=1
    break
  fi
  sleep 3
done
if [[ "${ready}" -ne 1 ]]; then
  echo "警告: headroom 未就绪（${HEADROOM_BASE}/livez 无响应），跳过压缩护栏创建" >&2
  exit 0
fi

python3 - "${BASE}" "${LITELLM_MASTER_KEY}" "${GUARDRAIL_NAME}" "${GUARDRAIL_API_BASE}" "${GUARDRAIL_API_KEY}" <<'PY'
import json
import sys
import urllib.error
import urllib.request

base, master, name, api_base, api_key = sys.argv[1:6]


def call(method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(base + path, data=data, method=method)
    req.add_header("Authorization", "Bearer " + master)
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode()
    return json.loads(body) if body else None


rows = (call("GET", "/v2/guardrails/list") or {}).get("guardrails") or []
for row in rows:
    params = row.get("litellm_params") or {}
    if str(params.get("guardrail", "")).lower() == "headroom":
        print("已存在 headroom 护栏: " + str(row.get("guardrail_name")))
        sys.exit(0)

payload = {
    "guardrail": {
        "guardrail_name": name,
        "litellm_params": {
            "guardrail": "headroom",
            "mode": "pre_call",
            "api_base": api_base,
            "api_key": api_key,
            "default_on": True,
            # 压缩服务异常时放行原请求，避免影响正常流量
            "unreachable_fallback": "fail_open",
        },
    }
}
try:
    call("POST", "/guardrails", payload)
    print("已创建 headroom 护栏: " + name + " -> " + api_base)
except urllib.error.HTTPError as exc:
    print("创建失败: HTTP " + str(exc.code) + " " + exc.read().decode()[:300])
    sys.exit(1)
PY
