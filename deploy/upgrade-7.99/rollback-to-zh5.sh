#!/usr/bin/env bash
# 7.99 回滚: v1.106.0-zh.7 -> v1.100.0-zh.5
# 默认完整回滚（恢复升级前的数据库备份，最稳，停机较长）。
# --fast  只切回旧镜像、不还原数据库（快，但旧代码跑在新结构上，写入行为需复查）。
# --auto  先试 --fast，旧镜像起不来或健康检查不过就自动转完整回滚（默认）。
set -euo pipefail

ROOT="/opt/litellm"
KIT="/opt/litellm-upgrade"
OLD_IMAGE="litellm-zhcn:v1.100.0-zh.5"
MODE="auto"
RESTORE_DB=1

usage() {
  echo "用法: $0 [--fast|--restore-db|--auto] [--backup-dir DIR]"
  echo "  --fast        仅切回旧镜像，不还原数据库"
  echo "  --restore-db  完整回滚：还原升级前数据库备份（默认）"
  echo "  --auto        先试 --fast，失败再完整回滚（默认）"
}

BACKUP_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fast) MODE="fast" ;;
    --restore-db) MODE="restore" ;;
    --auto) MODE="auto" ;;
    --backup-dir) BACKUP_DIR="$2"; shift ;;
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

log "== 1/7 定位回滚备份 =="
if [[ -z "${BACKUP_DIR}" ]]; then
  if [[ -f "${KIT}/state/upgrade-inflight.txt" ]]; then
    BACKUP_DIR="$(sed -n 's/^BACKUP_DIR=//p' "${KIT}/state/upgrade-inflight.txt" | head -1)"
  fi
  if [[ -z "${BACKUP_DIR}" && -f "${KIT}/backup/LATEST.txt" ]]; then
    BACKUP_DIR="$(sed -n 's/^BACKUP_DIR=//p' "${KIT}/backup/LATEST.txt" | head -1)"
  fi
fi
[[ -n "${BACKUP_DIR}" && -d "${BACKUP_DIR}" ]] || die "找不到数据库备份目录，请用 --backup-dir 指定"
PG_DUMP_DIR="$(find "${KIT}/backup" -maxdepth 1 -type d -name 'pg-pre-zh7-*' | sort | tail -1)"
[[ -n "${PG_DUMP_DIR}" && -f "${PG_DUMP_DIR}/toc.dat" ]] || die "数据库备份不完整"

INFLIGHT="${KIT}/state/rollback-files"
if [[ -f "${KIT}/state/upgrade-inflight.txt" ]]; then
  INFLIGHT="$(sed -n 's/^INFLIGHT=//p' "${KIT}/state/upgrade-inflight.txt" | head -1)"
fi
[[ -f "${INFLIGHT}/docker-compose.yml" && -f "${INFLIGHT}/.env" ]] || die "找不到升级现场备份 ${INFLIGHT}"
log "数据库备份=${PG_DUMP_DIR}"
log "现场文件=${INFLIGHT}"

docker image inspect "${OLD_IMAGE}" >/dev/null 2>&1 || die "回滚镜像缺失 ${OLD_IMAGE}"

log "== 2/7 停掉新版本服务 =="
"${COMPOSE}" -f "${ROOT}/docker-compose.yml" stop litellm headroom 2>/dev/null || true
docker rm -f litellm-headroom-1 >/dev/null 2>&1 || true
docker ps --format '{{.Names}}' | grep -q '^litellm-litellm-1$' && docker stop litellm-litellm-1 >/dev/null 2>&1 || true

log "== 3/7 还原部署文件 =="
cp -a "${INFLIGHT}/docker-compose.yml" "${ROOT}/docker-compose.yml"
cp -a "${INFLIGHT}/.env" "${ROOT}/.env"
chmod 600 "${ROOT}/.env"
if [[ -d "${INFLIGHT}/config" ]]; then
  mkdir -p "${ROOT}/config"
  cp -a "${INFLIGHT}/config/." "${ROOT}/config/"
fi
# 旧镜像在 7.99 上新建容器同样需要 seccomp 例外
python3 - <<'PY'
import io
p = "/opt/litellm/docker-compose.yml"
s = io.open(p, encoding="utf-8").read()
if "seccomp=unconfined" not in s:
    s = s.replace("    cap_add: [ALL]\n", "    cap_add: [ALL]\n    security_opt:\n      - seccomp=unconfined\n", 1)
    io.open(p, "w", encoding="utf-8").write(s)
PY
compose config -q || die "回滚 compose 校验失败"

fast_rollback() {
  log "== 4/7 [fast] 直接以旧镜像启动（不还原数据库）=="
  local upstart=$SECONDS
  compose up -d litellm || return 1
  wait_http "http://127.0.0.1:4000/health/liveliness" 200 240 "litellm(旧镜像)" || return 1
  wait_http "http://127.0.0.1:4000/health/readiness" 200 120 "litellm readiness" || return 1
  log "fast 回滚就绪，耗时 $((SECONDS - upstart)) 秒"
  return 0
}

full_rollback() {
  local upstart=$SECONDS
  set -a
  source "${ROOT}/.env"
  set +a
  log "== 4/7 [restore] 还原数据库（预计 20-40 分钟，视磁盘与数据量）=="
  docker exec litellm_db psql -U "${POSTGRES_USER}" -d postgres -q -c \
    "select pg_terminate_backend(pid) from pg_stat_activity where datname='${POSTGRES_DB}' and pid <> pg_backend_pid();" >/dev/null 2>&1 || true
  docker exec litellm_db psql -U "${POSTGRES_USER}" -d postgres -q -c "drop database if exists \"${POSTGRES_DB}\";"
  docker exec litellm_db psql -U "${POSTGRES_USER}" -d postgres -q -c "create database \"${POSTGRES_DB}\" owner \"${POSTGRES_USER}\";"
  log "数据库已重建，开始 pg_restore"
  docker run --rm --security-opt seccomp=unconfined --network container:litellm_db \
    -e PGPASSWORD="${POSTGRES_PASSWORD}" \
    -v "${PG_DUMP_DIR}:/dump:ro" \
    postgres:16.4 \
    pg_restore -h 127.0.0.1 -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -j4 --exit-on-error /dump
  log "数据库还原完成"
  log "== 5/7 启动旧版本 =="
  compose up -d litellm || return 1
  wait_http "http://127.0.0.1:4000/health/liveliness" 200 240 "litellm(旧镜像)" || return 1
  wait_http "http://127.0.0.1:4000/health/readiness" 200 120 "litellm readiness" || return 1
  log "完整回滚就绪，耗时 $((SECONDS - upstart)) 秒"
  return 0
}

log "== 当前模式: ${MODE} =="
if [[ "${MODE}" == "fast" ]]; then
  fast_rollback || die "fast 回滚失败，请执行: $0 --restore-db"
elif [[ "${MODE}" == "restore" ]]; then
  full_rollback || die "完整回滚失败，请人工介入"
else
  if fast_rollback; then
    log "警告: 当前为旧代码 + 新数据库结构。请尽快在低峰期执行完整回滚: $0 --restore-db"
  else
    log "fast 回滚不可用，转完整回滚"
    full_rollback || die "完整回滚失败，请人工介入"
  fi
fi

log "== 6/7 验证 =="
set -a
source "${ROOT}/.env"
set +a
READINESS="$(http_code http://127.0.0.1:4000/health/readiness)"
UI_CODE="$(http_code http://127.0.0.1:4000/ui/)"
MODEL_COUNT="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select count(*) from "LiteLLM_ProxyModelTable";')"
KEY_COUNT="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select count(*) from "LiteLLM_VerificationToken";')"
MIG_COUNT="$(docker exec litellm_db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -At -c 'select count(*) from _prisma_migrations;')"
log "readiness=${READINESS} ui=${UI_CODE} 模型=${MODEL_COUNT} 密钥=${KEY_COUNT} 迁移=${MIG_COUNT}"

BASELINE_FILE="$(find "${KIT}/backup" -maxdepth 2 -name baseline.txt | sort | tail -1)"
if [[ -n "${BASELINE_FILE}" ]]; then
  BASE_MODELS="$(sed -n 's/^models=//p' "${BASELINE_FILE}")"
  BASE_KEYS="$(sed -n 's/^keys=//p' "${BASELINE_FILE}")"
  BASE_MIGS="$(sed -n 's/^migrations=//p' "${BASELINE_FILE}")"
  [[ -z "${BASE_MODELS}" || "${MODEL_COUNT}" == "${BASE_MODELS}" ]] || log "警告: 模型数与基线 ${BASE_MODELS} 不一致"
  [[ -z "${BASE_KEYS}" || "${KEY_COUNT}" == "${BASE_KEYS}" ]] || log "警告: 密钥数与基线 ${BASE_KEYS} 不一致"
  [[ -z "${BASE_MIGS}" || "${MIG_COUNT}" == "${BASE_MIGS}" ]] || log "警告: 迁移数与基线 ${BASE_MIGS} 不一致（fast 模式下属预期）"
fi

log "== 7/7 写入回滚状态 =="
printf 'rolled_back_at=%s\nimage=%s\nmode=%s\nreadiness=%s\nui=%s\nmodels=%s\nkeys=%s\nmigrations=%s\n' \
  "$(date +%FT%T)" "${OLD_IMAGE}" "${MODE}" "${READINESS}" "${UI_CODE}" "${MODEL_COUNT}" "${KEY_COUNT}" "${MIG_COUNT}" \
  > "${KIT}/state/last-rollback.txt"
cat "${KIT}/state/last-rollback.txt"
printf '\n回滚完成。当前部署: %s\n' "${OLD_IMAGE}"
