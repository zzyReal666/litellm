#!/usr/bin/env bash
# 7.99 回滚: v1.106.0-zh.8 -> v1.100.0-zh.5
# 只切换镜像与部署文件，不动数据库（升级迁移均为新增表/新增列，旧镜像已验证可在新结构上运行）。
# 数据全部保留，升级后写入的 spend log 与配置不会丢失。
set -euo pipefail

ROOT="/opt/litellm"
KIT="/opt/litellm-upgrade"
OLD_IMAGE="litellm-zhcn:v1.100.0-zh.5"
BACKUP_ROOT="${KIT}/backup"
INFLIGHT=""

usage() {
  echo "用法: $0 [--inflight-dir DIR]"
  echo "  --inflight-dir  指定升级时记录的现场目录（默认读 state/upgrade-inflight.txt）"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --inflight-dir) INFLIGHT="$2"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
http_code() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null || true; }
wait_http() {
  local url="$1" want="$2" limit="$3" name="$4" code=""
  local deadline=$((SECONDS + limit))
  while (( SECONDS < deadline )); do
    code="$(http_code "${url}")"
    [[ "${code}" == "${want}" ]] && return 0
    sleep 3
  done
  printf '等待 %s 就绪超时（最后 HTTP %s）\n' "${name}" "${code}" >&2
  return 1
}

[[ "${EUID}" -eq 0 ]] || die "需要 root 权限"
cd "${ROOT}"
COMPOSE="${ROOT}/bin/docker-compose"
[[ -x "${COMPOSE}" ]] || die "找不到 ${COMPOSE}"
compose() { "${COMPOSE}" -f "${ROOT}/docker-compose.yml" "$@"; }

log "== 1/6 定位升级现场 =="
if [[ -z "${INFLIGHT}" && -f "${KIT}/state/upgrade-inflight.txt" ]]; then
  INFLIGHT="$(sed -n 's/^INFLIGHT=//p' "${KIT}/state/upgrade-inflight.txt" | head -1)"
fi
[[ -n "${INFLIGHT}" && -f "${INFLIGHT}/docker-compose.yml" && -f "${INFLIGHT}/.env" ]] || die "找不到升级现场备份，请用 --inflight-dir 指定"
docker image inspect "${OLD_IMAGE}" >/dev/null 2>&1 || die "回滚镜像缺失 ${OLD_IMAGE}"
log "现场目录: ${INFLIGHT}"

log "== 2/6 停掉新版本 =="
"${COMPOSE}" -f "${ROOT}/docker-compose.yml" stop litellm headroom 2>/dev/null || true
docker rm -f litellm-headroom-1 >/dev/null 2>&1 || true
docker ps --format '{{.Names}}' | grep -q '^litellm-litellm-1$' && docker stop litellm-litellm-1 >/dev/null 2>&1 || true

log "== 3/6 还原部署文件 =="
cp -a "${INFLIGHT}/docker-compose.yml" "${ROOT}/docker-compose.yml"
cp -a "${INFLIGHT}/.env" "${ROOT}/.env"
chmod 600 "${ROOT}/.env"
if [[ -d "${INFLIGHT}/config" ]]; then
  mkdir -p "${ROOT}/config"
  cp -a "${INFLIGHT}/config/." "${ROOT}/config/"
fi
python3 - <<'PY'
import io
p = "/opt/litellm/docker-compose.yml"
s = io.open(p, encoding="utf-8").read()
if "seccomp=unconfined" not in s:
    lines = s.split("\n")
    out = []
    for i, line in enumerate(lines):
        out.append(line)
        if line.strip() == "cap_add: [ALL]":
            nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if nxt != "security_opt:":
                indent = line[: len(line) - len(line.lstrip())]
                out.append(indent + "security_opt:")
                out.append(indent + "  - seccomp=unconfined")
    io.open(p, "w", encoding="utf-8").write("\n".join(out))
PY
compose config -q || die "回滚 compose 校验失败"

log "== 4/6 启动旧版本 =="
UPSTART=$(date +%s)
compose up -d litellm || die "旧版本启动失败"
wait_http "http://127.0.0.1:4000/health/liveliness" 200 300 "litellm(旧镜像)" || die "旧镜像未就绪"
wait_http "http://127.0.0.1:4000/health/readiness" 200 180 "litellm readiness" || die "旧镜像 readiness 未就绪"
UPEND=$(date +%s)
log "旧版本已启动，耗时 $((UPEND - UPSTART)) 秒"

log "== 5/6 验证 =="
set -a
source "${ROOT}/.env"
set +a
READINESS="$(http_code http://127.0.0.1:4000/health/readiness)"
UI_CODE="$(http_code http://127.0.0.1:4000/ui/)"
MODEL_COUNT="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select count(*) from "LiteLLM_ProxyModelTable";')"
KEY_COUNT="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select count(*) from "LiteLLM_VerificationToken";')"
log "readiness=${READINESS} ui=${UI_CODE} 模型=${MODEL_COUNT} 密钥=${KEY_COUNT}"

BASELINE_FILE="$(ls -t "${BACKUP_ROOT}"/files-*/baseline.txt 2>/dev/null | head -1)"
if [[ -n "${BASELINE_FILE}" ]]; then
  BASE_MODELS="$(sed -n 's/^models=//p' "${BASELINE_FILE}")"
  BASE_KEYS="$(sed -n 's/^keys=//p' "${BASELINE_FILE}")"
  [[ -z "${BASE_MODELS}" || "${MODEL_COUNT}" == "${BASE_MODELS}" ]] || log "警告: 模型数与基线 ${BASE_MODELS} 不一致"
  [[ -z "${BASE_KEYS}" || "${KEY_COUNT}" == "${BASE_KEYS}" ]] || log "警告: 密钥数与基线 ${BASE_KEYS} 不一致"
fi
[[ "${READINESS}" == "200" ]] || die "回滚后 readiness 异常"
[[ "${UI_CODE}" == "200" ]] || die "回滚后 UI 异常"

log "== 6/6 写入回滚状态 =="
printf 'rolled_back_at=%s\nimage=%s\ninflight=%s\nreadiness=%s\nui=%s\nmodels=%s\nkeys=%s\n' \
  "$(date +%FT%T)" "${OLD_IMAGE}" "${INFLIGHT}" "${READINESS}" "${UI_CODE}" "${MODEL_COUNT}" "${KEY_COUNT}" \
  > "${KIT}/state/last-rollback.txt"
cat "${KIT}/state/last-rollback.txt"
printf '\n回滚完成。当前部署: %s\n' "${OLD_IMAGE}"
