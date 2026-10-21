#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/litellm}"
PURGE=0
REMOVE_IMAGES=0
ASSUME_YES=0

log() { printf '%s\n' "$*"; }
warn() { printf '警告: %s\n' "$*" >&2; }
die() { printf '错误: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
用法: ./uninstall.sh [选项]

  默认        停止并移除容器，保留数据目录与镜像
  --purge     同时删除数据、.env 与备份（不可恢复）
  --remove-images  删除 Litellm、Postgres、Redis、Prometheus 镜像
  --yes       非交互确认
  -h, --help  显示帮助
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    --purge) PURGE=1; shift ;;
    --remove-images) REMOVE_IMAGES=1; shift ;;
    --yes) ASSUME_YES=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "未知参数: $1（-h 查看帮助）" ;;
  esac
done

[[ "${EUID}" -eq 0 ]] || die "请使用 root 运行"
cd "${INSTALL_DIR}" 2>/dev/null || die "安装目录不存在: ${INSTALL_DIR}"

source "${INSTALL_DIR}/scripts/_lib.sh"

if [[ "${PURGE}" -eq 1 && "${ASSUME_YES}" -eq 0 ]]; then
  read -r -p "将删除 ${INSTALL_DIR}/data 与 .env，确认继续？[y/N] " reply
  [[ "${reply}" == "y" || "${reply}" == "Y" ]] || die "已取消"
fi

log "==> 停止并移除容器"
if litellm_compose_is_available; then
  litellm_compose down --remove-orphans || warn "容器移除失败，可能已不存在"
fi

if [[ "${REMOVE_IMAGES}" -eq 1 ]]; then
  log "==> 删除镜像"
  docker rmi litellm-zhcn:v1.106.0-zh.1 postgres:16.4 redis:7.4.2-alpine prom/prometheus:v2.55.1 >/dev/null 2>&1 || true
fi

if [[ "${PURGE}" -eq 1 ]]; then
  log "==> 删除数据与配置"
  rm -rf "${INSTALL_DIR}/data" "${INSTALL_DIR}/.env" "${INSTALL_DIR}/images"
fi

log "已卸载（数据目录保留: $([[ "${PURGE}" -eq 1 ]] && echo 否 || echo 是)）"
