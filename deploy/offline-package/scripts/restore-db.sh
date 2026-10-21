#!/usr/bin/env bash
# 从 gzip 的 pg_dump 恢复数据库（危险操作）。
# 用法: CONFIRM=YES bash restore-db.sh /opt/litellm/backups/pg_YYYYMMDD_HHMMSS.sql.gz
#
# 说明：备份由 backup-db.sh 使用 --clean --if-exists 生成，恢复时会删除/重建对象。
# 恢复期间会短暂停止 litellm 服务。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"
litellm_load_env

: "${POSTGRES_USER:?请在 .env 中设置 POSTGRES_USER}"
: "${POSTGRES_DB:?请在 .env 中设置 POSTGRES_DB}"

if [[ "${CONFIRM:-}" != "YES" ]]; then
  echo "error: 为防止误操作，请使用: CONFIRM=YES $0 <备份.sql.gz>" >&2
  exit 1
fi

bak="${1:-}"
if [[ -z "${bak}" ]] || [[ ! -f "${bak}" ]]; then
  echo "error: 请指定存在的备份文件路径（.sql.gz）" >&2
  exit 1
fi

echo "==> 停止 litellm（保留 db）"
litellm_compose stop litellm

echo "==> 恢复 ${bak} -> db:${POSTGRES_DB}"
gunzip -c "${bak}" | litellm_compose exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"

echo "==> 启动 litellm"
litellm_compose start litellm

echo "完成。建议执行 scripts/status.sh 验证。"
