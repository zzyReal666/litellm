#!/usr/bin/env bash
# 配置 coordination Redis 并重启 Litellm 生效。
# 未配置时预算花费计数器没有 Redis 后端，重新播种会叠加数据库金额，
# 导致鉴权侧花费翻倍、用户在额度未用尽时被 429 拦截。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT}/scripts/_lib.sh"
litellm_load_env

PORT="${LITELLM_PORT:-4000}"
BASE="http://127.0.0.1:${PORT}"
AUTH="Authorization: Bearer ${LITELLM_MASTER_KEY}"

if [[ -z "${REDIS_PASSWORD:-}" ]]; then
  echo "skip: .env 未配置 REDIS_PASSWORD，跳过 coordination Redis" >&2
  exit 0
fi

source_now="$(curl -s "${BASE}/coordination_redis/settings" -H "${AUTH}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin).get('source') or '')" 2>/dev/null || true)"
if [[ "${source_now}" == "coordination_redis" ]]; then
  echo "ok: coordination Redis 已生效，无需重复配置"
  exit 0
fi

SETTINGS='{"settings":{"host":"redis","port":6379,"password":"os.environ/REDIS_PASSWORD"}}'

test_out="$(curl -s -X POST "${BASE}/coordination_redis/settings/test" \
  -H "${AUTH}" -H "Content-Type: application/json" -d "${SETTINGS}")"
status="$(echo "${test_out}" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status') or '')" 2>/dev/null || true)"
if [[ "${status}" != "healthy" ]]; then
  echo "错误: coordination Redis 连接测试失败: ${test_out}" >&2
  exit 1
fi

curl -s -o /dev/null -X POST "${BASE}/coordination_redis/settings" \
  -H "${AUTH}" -H "Content-Type: application/json" -d "${SETTINGS}"

echo "==> 已保存 coordination Redis 配置，重启 Litellm 生效"
bash "${ROOT}/scripts/restart.sh" litellm >/dev/null

code=""
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/health/readiness" || true)"
  [[ "${code}" == "200" ]] && break
  sleep 3
done
[[ "${code}" == "200" ]] || { echo "错误: 重启后未就绪（HTTP ${code}）" >&2; exit 1; }
echo "ok: coordination Redis 已启用"
