#!/usr/bin/env bash
# 7.99: litellm-zhcn:v1.100.0-zh.5 -> v1.106.0-zh.7（含 headroom 压缩服务）
# 升级前镜像、配置备份、演练均预置在 /opt/litellm-upgrade。回滚用 rollback-to-zh5.sh。
set -euo pipefail

ROOT="/opt/litellm"
KIT="/opt/litellm-upgrade"
PKG="${KIT}/pkg/litellm-offline-v1.106.0-zh.7.tar.gz"
COMPOSE_SRC="${KIT}/compose/docker-compose.zh7.yml"
NEW_IMAGE="litellm-zhcn:v1.106.0-zh.7"
HEADROOM_IMAGE="headroom-offline:v1.106.0-zh.7"
OLD_IMAGE="litellm-zhcn:v1.100.0-zh.5"
BACKUP_ROOT="${KIT}/backup"
AUTO_ROLLBACK="${AUTO_ROLLBACK:-0}"
WAIT_STARTUP_SECONDS="${WAIT_STARTUP_SECONDS:-900}"
WAIT_HEADROOM_SECONDS="${WAIT_HEADROOM_SECONDS:-300}"

CHECK_ONLY=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check) CHECK_ONLY=1 ;;
    -h|--help) echo "用法: $0 [--check]"; echo "  --check  只做前置校验，不改动部署"; exit 0 ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
  shift
done

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

[[ "${EUID}" -eq 0 ]] || die "需要 root 权限"
[[ -f "${PKG}" ]] || die "找不到离线包 ${PKG}"
[[ -f "${COMPOSE_SRC}" ]] || die "找不到预置 compose ${COMPOSE_SRC}"

cd "${ROOT}"
set -a
source "${ROOT}/.env"
set +a

COMPOSE="${ROOT}/bin/docker-compose"
[[ -x "${COMPOSE}" ]] || die "找不到 ${COMPOSE}"
compose() { "${COMPOSE}" -f "${ROOT}/docker-compose.yml" "$@"; }
http_code() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null || true; }
wait_http() {
  local url="$1" want="$2" limit="$3" name="$4" code=""
  local deadline=$((SECONDS + limit))
  while (( SECONDS < deadline )); do
    code="$(http_code "${url}")"
    [[ "${code}" == "${want}" ]] && return 0
    sleep 3
  done
  printf '等待 %s 就绪超时（最后 HTTP %s），URL=%s\n' "${name}" "${code}" "${url}" >&2
  return 1
}

log "== 1/8 校验前置条件 =="
if [[ -f "${KIT}/pkg.sha256" ]]; then
  ( cd "${KIT}/pkg" && sha256sum -c "${KIT}/pkg.sha256" ) || die "离线包校验和不匹配"
  log "离线包校验和通过"
fi

[[ -f "${BACKUP_ROOT}/CFG_LATEST.txt" ]] || die "缺少配置备份清单 ${BACKUP_ROOT}/CFG_LATEST.txt"
CFG_DIR="$(sed -n 's/^CFG_DUMP_DIR=//p' "${BACKUP_ROOT}/CFG_LATEST.txt" | head -1)"
[[ -n "${CFG_DIR}" && -f "${CFG_DIR}/toc.dat" ]] || die "配置备份不完整"
docker run --rm --security-opt seccomp=unconfined -v "${CFG_DIR}:/dump:ro" postgres:16.4 \
  pg_restore -l /dump >/dev/null 2>&1 || die "配置备份不可读（pg_restore -l 失败）"
[[ -f "${BACKUP_ROOT}/schema-pre-zh7.sql" ]] || die "缺少升级前结构快照"
log "配置备份: $(basename "${CFG_DIR}") ($(du -sh "${CFG_DIR}" | cut -f1))"

for img in "${NEW_IMAGE}" "${HEADROOM_IMAGE}" "${OLD_IMAGE}"; do
  docker image inspect "${img}" >/dev/null 2>&1 || die "镜像缺失 ${img}"
done
log "新镜像与回滚镜像均就绪"

AVAIL_KB="$(df -Pk / | awk 'NR==2 {print $4}')"
(( AVAIL_KB > 3 * 1024 * 1024 )) || die "根分区可用空间不足 3G（当前 $((AVAIL_KB / 1024))M）"

log "== 2/8 记录升级现场 =="
INFLIGHT="${KIT}/state/$(date +%Y%m%d-%H%M%S)"
mkdir -p "${INFLIGHT}"
cp -a docker-compose.yml .env "${INFLIGHT}/"
cp -a config "${INFLIGHT}/config"
chmod 600 "${INFLIGHT}/.env"
printf 'CFG_DIR=%s\nINFLIGHT=%s\n' "${CFG_DIR}" "${INFLIGHT}" > "${KIT}/state/upgrade-inflight.txt"
log "现场文件: ${INFLIGHT}"

if [[ "${CHECK_ONLY}" == "1" ]]; then
  log "检查通过，未做任何改动。执行不带 --check 的命令开始升级"
  exit 0
fi

log "== 3/8 更新 compose、脚本、静态资源 =="
cp -a "${COMPOSE_SRC}" docker-compose.yml
rm -rf "${KIT}/pkg-extract"
mkdir -p "${KIT}/pkg-extract"
tar xzf "${PKG}" -C "${KIT}/pkg-extract" --strip-components=1 \
  'litellm-offline-v1.106.0-zh.7/scripts' 'litellm-offline-v1.106.0-zh.7/assets'
mkdir -p scripts assets data/headroom
cp -a "${KIT}/pkg-extract/scripts/." scripts/
cp -a "${KIT}/pkg-extract/assets/." assets/
rm -rf "${KIT}/pkg-extract"

log "== 4/8 补充 .env 新配置 =="
chmod 600 .env
grep -q '^HEADROOM_HOST_PORT=' .env || echo 'HEADROOM_HOST_PORT=8787' >> .env
grep -q '^HEADROOM_PROXY_TOKEN=' .env || echo "HEADROOM_PROXY_TOKEN=$(openssl rand -hex 24)" >> .env
set +a
source .env
set -a
log "HEADROOM_HOST_PORT=${HEADROOM_HOST_PORT} HEADROOM_PROXY_TOKEN=已设置"

log "== 5/8 校验 compose =="
compose config -q || die "compose 校验失败"

fail_and_rollback() {
  local reason="$1"
  printf '\n升级失败: %s\n' "${reason}" >&2
  printf '回滚命令: bash %s/scripts/rollback-to-zh5.sh\n' "${KIT}" >&2
  if [[ "${AUTO_ROLLBACK}" == "1" ]]; then
    log "AUTO_ROLLBACK=1，开始自动回滚"
    bash "${KIT}/scripts/rollback-to-zh5.sh" || printf '自动回滚也失败，请人工介入\n' >&2
  fi
  exit 1
}

log "== 6/8 重建 litellm 并启动 headroom（开始停机窗口）=="
UPSTART=$(date +%s)
compose up -d litellm headroom || fail_and_rollback "容器启动命令失败"

if ! wait_http "http://127.0.0.1:4000/health/liveliness" 200 "${WAIT_STARTUP_SECONDS}" "litellm"; then
  compose logs --tail=80 litellm || true
  fail_and_rollback "litellm 未在 ${WAIT_STARTUP_SECONDS}s 内就绪"
fi
if ! wait_http "http://127.0.0.1:8787/livez" 200 "${WAIT_HEADROOM_SECONDS}" "headroom"; then
  compose logs --tail=40 headroom || true
  fail_and_rollback "headroom 未在 ${WAIT_HEADROOM_SECONDS}s 内就绪"
fi
UPEND=$(date +%s)
log "服务已启动，停机窗口约 $((UPEND - UPSTART)) 秒"

log "== 7/8 验证与护栏 =="
bash scripts/setup-compression.sh || log "压缩护栏创建失败，可稍后手动执行 scripts/setup-compression.sh"

READINESS="$(http_code http://127.0.0.1:4000/health/readiness)"
UI_CODE="$(http_code http://127.0.0.1:4000/ui/)"
[[ "${READINESS}" == "200" ]] || fail_and_rollback "readiness=${READINESS}"
[[ "${UI_CODE}" == "200" ]] || fail_and_rollback "UI=${UI_CODE}"

MODEL_COUNT="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select count(*) from "LiteLLM_ProxyModelTable";')"
KEY_COUNT="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select count(*) from "LiteLLM_VerificationToken";')"
MIG_COUNT="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select count(*) from _prisma_migrations;')"
log "模型=${MODEL_COUNT} 密钥=${KEY_COUNT} 迁移=${MIG_COUNT}"

BASELINE_FILE="$(ls -t "${BACKUP_ROOT}"/files-*/baseline.txt 2>/dev/null | head -1)"
if [[ -n "${BASELINE_FILE}" ]]; then
  BASE_MODELS="$(sed -n 's/^models=//p' "${BASELINE_FILE}")"
  BASE_KEYS="$(sed -n 's/^keys=//p' "${BASELINE_FILE}")"
  [[ -z "${BASE_MODELS}" || "${MODEL_COUNT}" == "${BASE_MODELS}" ]] || fail_and_rollback "模型数与基线 ${BASE_MODELS} 不一致"
  [[ -z "${BASE_KEYS}" || "${KEY_COUNT}" == "${BASE_KEYS}" ]] || fail_and_rollback "密钥数与基线 ${BASE_KEYS} 不一致"
fi

MODEL_NAME="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select model_name from "LiteLLM_ProxyModelTable" order by model_name limit 1;')"
SMOKE_CODE="skipped"
if [[ -n "${MODEL_NAME}" && -n "${LITELLM_MASTER_KEY:-}" ]]; then
  SMOKE_CODE="$(curl -s -o /tmp/upgrade-smoke.json -w '%{http_code}' --max-time 120 \
    -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" -H 'Content-Type: application/json' \
    -X POST http://127.0.0.1:4000/v1/chat/completions \
    -d "{\"model\":\"${MODEL_NAME}\",\"messages\":[{\"role\":\"user\",\"content\":\"回复 ok 即可\"}],\"max_tokens\":8}" || true)"
  log "烟雾测试 model=${MODEL_NAME} HTTP=${SMOKE_CODE}"
  [[ "${SMOKE_CODE}" == "200" ]] || fail_and_rollback "真实模型调用失败 HTTP=${SMOKE_CODE}"
fi

GUARDRAIL_OK=0
if curl -s -H "Authorization: Bearer ${LITELLM_MASTER_KEY}" http://127.0.0.1:4000/v2/guardrails/list 2>/dev/null | grep -q 'headroom-compression'; then
  GUARDRAIL_OK=1
fi
log "压缩护栏已创建=${GUARDRAIL_OK}"

log "== 8/8 写入升级状态 =="
cat > "${KIT}/state/current-upgrade.txt" <<EOF
upgraded_at=$(date +%FT%T)
old_image=${OLD_IMAGE}
new_image=${NEW_IMAGE}
headroom_image=${HEADROOM_IMAGE}
cfg_backup=${CFG_DIR}
inflight_dir=${INFLIGHT}
downtime_seconds=$((UPEND - UPSTART))
readiness=${READINESS}
ui=${UI_CODE}
models=${MODEL_COUNT}
keys=${KEY_COUNT}
migrations=${MIG_COUNT}
guardrail_created=${GUARDRAIL_OK}
smoke_http=${SMOKE_CODE}
EOF

printf '\n升级完成。摘要:\n'
cat "${KIT}/state/current-upgrade.txt"
printf '\n回滚命令（若后续发现问题）:\n  bash %s/scripts/rollback-to-zh5.sh\n' "${KIT}"
