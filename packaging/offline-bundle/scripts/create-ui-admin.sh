#!/usr/bin/env bash
# 创建独立密码的代理管理员账号，可选关闭环境变量登录。
# 用法: create-ui-admin.sh <邮箱> [密码] [--disable-env-login]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT}/scripts/_lib.sh"
litellm_load_env

EMAIL="${1:-}"
PASSWORD="${2:-}"
DISABLE_ENV_LOGIN=0
for arg in "$@"; do
  [[ "${arg}" == "--disable-env-login" ]] && DISABLE_ENV_LOGIN=1
done

if [[ -z "${EMAIL}" || "${EMAIL}" == "--disable-env-login" ]]; then
  echo "用法: $0 <邮箱> [密码] [--disable-env-login]" >&2
  echo "未提供密码时会随机生成并打印" >&2
  exit 1
fi
if [[ "${PASSWORD}" == "--disable-env-login" || -z "${PASSWORD}" ]]; then
  PASSWORD="LiteLLM-$(openssl rand -hex 6)!"
fi
[[ -n "${LITELLM_MASTER_KEY:-}" ]] || { echo "错误: .env 缺少 LITELLM_MASTER_KEY" >&2; exit 1; }

PORT="${LITELLM_PORT:-4000}"
BASE="http://127.0.0.1:${PORT}"
AUTH="Authorization: Bearer ${LITELLM_MASTER_KEY}"
JSON="Content-Type: application/json"

py() { python3 -c "$1"; }

EXISTING_ID="$(curl -s "${BASE}/user/list" -H "${AUTH}" | py "
import json,sys
users = json.load(sys.stdin).get('users', [])
for u in users:
    if (u.get('user_email') or '').lower() == '${EMAIL}'.lower():
        print(u.get('user_id') or ''); print('HAS_PASSWORD' if u.get('password') else 'NO_PASSWORD'); break
")"
EXISTING_UID="$(printf '%s' "${EXISTING_ID}" | head -1)"
EXISTING_PW="$(printf '%s' "${EXISTING_ID}" | sed -n '2p')"
SKIP_PROVISION=0
if [[ "${EXISTING_PW}" == "HAS_PASSWORD" ]]; then
  echo "ok: 用户 ${EMAIL} 已存在且已设置密码，跳过创建"
  SKIP_PROVISION=1
fi

if [[ "${SKIP_PROVISION}" -eq 0 ]]; then
echo "==> 创建管理员用户 ${EMAIL}"
if [[ -n "${EXISTING_UID}" ]]; then
  USER_ID="${EXISTING_UID}"
  echo "==> 用户 ${EMAIL} 已存在但未设置密码，直接补设密码"
else
  USER_NEW_RESP="$(curl -s -X POST "${BASE}/user/new" -H "${AUTH}" -H "${JSON}" \
    -d "{\"user_email\":\"${EMAIL}\",\"user_role\":\"proxy_admin\",\"auto_create_key\":false}")"
  USER_ID="$(printf '%s' "${USER_NEW_RESP}" | py "import json,sys
try:
    print(json.load(sys.stdin).get('user_id') or '')
except Exception:
    print('')")"
  if [[ -z "${USER_ID}" ]]; then
    echo "错误: 创建用户失败，接口返回: ${USER_NEW_RESP}" >&2
    exit 1
  fi
fi

echo "==> 生成邀请并设置密码"
INVITATION_ID="$(curl -s -X POST "${BASE}/invitation/new" -H "${AUTH}" -H "${JSON}" \
  -d "{\"user_id\":\"${USER_ID}\"}" | py "import json,sys; print(json.load(sys.stdin)['id'])")"

ONBOARDING_JWT="$(curl -s "${BASE}/onboarding/get_token?invite_link=${INVITATION_ID}" | py "
import base64, json, sys
token = json.load(sys.stdin)['token']
payload = token.split('.')[1]
payload += '=' * (-len(payload) % 4)
print(json.loads(base64.urlsafe_b64decode(payload))['key'])
")"

CLAIM_CODE="$(curl -s -o /tmp/claim_resp.$$ -w "%{http_code}" -X POST "${BASE}/onboarding/claim_token" \
  -H "Authorization: Bearer ${ONBOARDING_JWT}" -H "${JSON}" \
  -d "{\"invitation_link\":\"${INVITATION_ID}\",\"user_id\":\"${USER_ID}\",\"password\":\"${PASSWORD}\"}")"
if [[ "${CLAIM_CODE}" != "200" ]]; then
  echo "错误: 设置密码失败 (HTTP ${CLAIM_CODE})" >&2
  cat /tmp/claim_resp.$$ >&2
  rm -f /tmp/claim_resp.$$
  echo "提示: 密码策略要求至少 12 位" >&2
  exit 1
fi
rm -f /tmp/claim_resp.$$

LOGIN_CODE="$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE}/v2/login" -H "${JSON}" \
  -d "{\"username\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
if [[ "${LOGIN_CODE}" != "200" ]]; then
  echo "错误: 新账号登录验证失败 (HTTP ${LOGIN_CODE})" >&2
  exit 1
fi
echo "ok: 账号已创建且登录验证通过"
fi

if [[ "${DISABLE_ENV_LOGIN}" -eq 1 ]]; then
  CONFIG="${ROOT}/config/config.yaml"
  cp "${CONFIG}" "${CONFIG}.bak.$(date +%Y%m%d%H%M%S)"
  if grep -q "disable_env_credential_login" "${CONFIG}"; then
    sed -i 's/disable_env_credential_login: .*/disable_env_credential_login: true/' "${CONFIG}"
  else
    python3 - "${CONFIG}" <<'PY'
import io, sys
path = sys.argv[1]
text = io.open(path, encoding="utf-8").read()
if "general_settings:" in text:
    text = text.replace("general_settings:\n", "general_settings:\n  disable_env_credential_login: true\n", 1)
else:
    text += "\ngeneral_settings:\n  disable_env_credential_login: true\n"
io.open(path, "w", encoding="utf-8").write(text)
PY
  fi
  echo "==> 关闭环境变量登录并重启"
  bash "${ROOT}/scripts/restart.sh" litellm >/dev/null
  for _ in $(seq 1 40); do
    code="$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/health/readiness" || true)"
    [[ "${code}" == "200" ]] && break
    sleep 4
  done
  [[ "${code}" == "200" ]] || { echo "错误: 重启后未就绪" >&2; exit 1; }
  echo "ok: 环境变量登录已关闭"
fi

echo ""
echo "登录信息"
echo "  地址     http://<本机IP>:${PORT}/ui"
echo "  用户名   ${EMAIL}"
echo "  密码     ${PASSWORD}"
echo "  提示     首次登录后建议在用户详情里重置为自己的密码"
