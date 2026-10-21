#!/usr/bin/env bash
# 逻辑备份 PostgreSQL（gzip）。保留最近 N 份（默认 14）。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"
litellm_load_env

: "${POSTGRES_USER:?请在 .env 中设置 POSTGRES_USER}"
: "${POSTGRES_DB:?请在 .env 中设置 POSTGRES_DB}"

KEEP_LAST="${KEEP_LAST:-14}"
mkdir -p "${ROOT}/backups"

ts="$(date +%Y%m%d_%H%M%S)"
out="${ROOT}/backups/pg_${ts}.sql.gz"

echo "==> 备份 -> ${out}"
litellm_compose exec -T db \
  pg_dump --clean --if-exists -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  | gzip >"${out}"

echo "==> 当前备份列表（最新在前）"
ls -1t "${ROOT}/backups"/pg_*.sql.gz 2>/dev/null | head || true

if [[ "${KEEP_LAST}" =~ ^[0-9]+$ ]] && [[ "${KEEP_LAST}" -gt 0 ]]; then
  mapfile -t all < <(ls -1t "${ROOT}/backups"/pg_*.sql.gz 2>/dev/null || true)
  if [[ "${#all[@]}" -gt "${KEEP_LAST}" ]]; then
    echo "==> 清理旧备份，仅保留最近 ${KEEP_LAST} 份"
    for ((i = KEEP_LAST; i < ${#all[@]}; i++)); do
      rm -f "${all[$i]}"
      echo "removed: ${all[$i]}"
    done
  fi
fi

echo "完成"
