#!/usr/bin/env bash
set -euo pipefail

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${INSTALL_DIR:-${SELF_DIR}}"
PURGE=0
REMOVE_IMAGES=0
REMOVE_ALL=0
ASSUME_YES=0
BACKUP_DIR="${BACKUP_DIR:-/root/litellm_backups}"

log() { printf '%s\n' "$*"; }
warn() { printf '警告: %s\n' "$*" >&2; }
die() { printf '错误: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
用法: ./uninstall.sh [选项]

  默认             停止并移除容器，保留数据、.env 与镜像
  --purge          额外删除数据目录与 .env（不可恢复）
  --remove-images  删除网关与依赖镜像
  --all            彻底清理：等同 --purge --remove-images 并删除整个安装目录
  --dir <目录>     安装目录，默认 /opt/litellm
  --yes            非交互确认
  -h, --help       显示帮助

示例:
  ./uninstall.sh                 只停服务，数据保留
  ./uninstall.sh --purge         清空数据，保留安装目录
  ./uninstall.sh --all --yes     完全卸载，机器回到未安装状态
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    --purge) PURGE=1; shift ;;
    --remove-images) REMOVE_IMAGES=1; shift ;;
    --all) PURGE=1; REMOVE_IMAGES=1; REMOVE_ALL=1; shift ;;
    --yes) ASSUME_YES=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "未知参数: $1（-h 查看帮助）" ;;
  esac
done

[[ "${EUID}" -eq 0 ]] || die "请使用 root 运行"
[[ -d "${INSTALL_DIR}" ]] || die "安装目录不存在: ${INSTALL_DIR}"

if [[ "${REMOVE_ALL}" -eq 1 && "${LITELLM_UNINSTALL_REEXEC:-0}" != "1" ]]; then
  tmp_script="$(mktemp /tmp/litellm-uninstall.XXXXXX.sh)"
  cp "${BASH_SOURCE[0]}" "${tmp_script}"
  exec env LITELLM_UNINSTALL_REEXEC=1 INSTALL_DIR="${INSTALL_DIR}" BACKUP_DIR="${BACKUP_DIR}" \
    bash "${tmp_script}" --all $( [[ "${ASSUME_YES}" -eq 1 ]] && printf '%s' "--yes" )
fi

if [[ "${ASSUME_YES}" -eq 0 && "${PURGE}" -eq 1 ]]; then
  if [[ "${REMOVE_ALL}" -eq 1 ]]; then
    printf '将停止服务、删除全部数据镜像与安装目录 %s，确认继续？[y/N] ' "${INSTALL_DIR}"
  else
    printf '将停止服务并删除 %s/data 与 .env，确认继续？[y/N] ' "${INSTALL_DIR}"
  fi
  read -r reply || true
  case "${reply}" in
    y|Y) ;;
    *) die "已取消" ;;
  esac
fi

cd "${INSTALL_DIR}"
source "${INSTALL_DIR}/scripts/_lib.sh"

log "==> 停止并移除容器"
if litellm_compose_is_available; then
  litellm_compose down --remove-orphans -v || warn "容器移除失败，可能已不存在"
else
  warn "未找到 Docker Compose，跳过容器清理"
fi

if [[ "${PURGE}" -eq 1 && -f "${INSTALL_DIR}/.env" ]]; then
  mkdir -p "${BACKUP_DIR}"
  backup_file="${BACKUP_DIR}/env.$(date +%Y%m%d_%H%M%S).bak"
  cp -a "${INSTALL_DIR}/.env" "${backup_file}"
  log "    已备份 .env 到 ${backup_file}"
fi

if [[ "${REMOVE_IMAGES}" -eq 1 ]]; then
  log "==> 删除镜像"
  for img in litellm-zhcn:v1.106.0-zh.13 headroom-offline:v1.106.0-zh.7 \
             postgres:16.4 redis:7.4.2-alpine prom/prometheus:v2.55.1; do
    if docker rmi "${img}" >/dev/null 2>&1; then
      printf '    已删除 %s\n' "${img}"
    fi
  done
fi

if [[ "${PURGE}" -eq 1 ]]; then
  log "==> 删除数据与配置"
  rm -rf "${INSTALL_DIR}/data" "${INSTALL_DIR}/.env" "${INSTALL_DIR}/images" "${INSTALL_DIR}/backups"
fi

if [[ "${REMOVE_ALL}" -eq 1 ]]; then
  log "==> 删除安装目录 ${INSTALL_DIR}"
  cd /
  rm -rf "${INSTALL_DIR}"
  rm -f "${BASH_SOURCE[0]}"
  log ""
  log "卸载完成，机器已回到未安装状态"
  log "重新安装：解压安装包后执行 sudo ./install.sh"
  exit 0
fi

log ""
log "已卸载"
if [[ "${PURGE}" -eq 1 ]]; then
  log "数据已清空，安装目录保留：${INSTALL_DIR}"
else
  log "数据与配置保留在 ${INSTALL_DIR}，重新启动：${INSTALL_DIR}/litellm start"
fi
