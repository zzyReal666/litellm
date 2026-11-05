#!/usr/bin/env bash
# 离线安装 Docker 引擎与 compose 插件（仅当目标机未安装 Docker 时使用）。
# 用法: install-docker.sh [--force] [--dry-run]
# 依赖: vendor/docker/docker-26.0.1.tgz（官方静态二进制包），bin/docker-compose（compose v2 静态二进制）
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR="${ROOT_DIR}/vendor/docker"
TGZ="${VENDOR}/docker-26.0.1.tgz"
COMPOSE_BIN="${ROOT_DIR}/bin/docker-compose"
INSTALL_BIN_DIR="${INSTALL_BIN_DIR:-/usr/bin}"
DOCKER_ETC_DIR="${DOCKER_ETC_DIR:-/etc/docker}"
SYSTEMD_UNIT_DIR="${SYSTEMD_UNIT_DIR:-/etc/systemd/system}"
SKIP_SYSTEMD="${SKIP_SYSTEMD:-0}"
FORCE=0
DRY_RUN="${DRY_RUN:-0}"

for arg in "$@"; do
  case "${arg}" in
    --force) FORCE=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) echo "用法: $0 [--force] [--dry-run]"; exit 0 ;;
    *) echo "未知参数: ${arg}" >&2; exit 2 ;;
  esac
done

log() { printf '%s\n' "$*"; }
warn() { printf '警告: %s\n' "$*" >&2; }
die() { printf '错误: %s\n' "$*" >&2; exit 1; }
run() {
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    printf '[dry-run] %s\n' "$*"
  else
    "$@"
  fi
}

docker_version_ok() {
  command -v docker >/dev/null 2>&1 || return 1
  local v
  v="$(docker version --format '{{.Server.Version}}' 2>/dev/null || true)"
  [[ -n "${v}" ]] || return 1
  local major="${v%%.*}"
  [[ "${major}" =~ ^[0-9]+$ ]] && [[ "${major}" -ge 20 ]]
}

if command -v docker >/dev/null 2>&1 && [[ "${FORCE}" -eq 0 ]]; then
  if ! docker_version_ok; then
    log "检测到 docker 命令但 daemon 不可用，尝试启动已有服务"
    run systemctl start docker >/dev/null 2>&1 || true
    sleep 2
  fi
  if docker_version_ok; then
    log "已检测到可用 Docker（$(docker version --format '{{.Server.Version}}' 2>/dev/null)），跳过安装"
    exit 0
  fi
  log "已有 docker 命令但仍不可用，继续执行安装/修复流程"
fi

[[ "${EUID}" -eq 0 ]] || die "请使用 root 运行"
[[ -f "${TGZ}" ]] || die "缺少 ${TGZ}"
[[ -x "${COMPOSE_BIN}" ]] || die "缺少 ${COMPOSE_BIN}（compose 二进制）"

if [[ "${SKIP_SYSTEMD}" -eq 0 ]] && [[ ! -d /run/systemd/system ]]; then
  die "目标机未使用 systemd，无法自动配置 Docker 服务，请手动安装 Docker 后重试"
fi

if ! command -v systemctl >/dev/null 2>&1; then
  die "未找到 systemctl，请手动安装 Docker 后重试"
fi

log "==> 解压 Docker 静态二进制"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT
tar -xzf "${TGZ}" -C "${tmp_dir}"
src="${tmp_dir}/docker"
[[ -d "${src}" ]] || die "Docker 包结构异常：缺少 docker/ 目录"

log "==> 安装二进制到 ${INSTALL_BIN_DIR}"
run install -d -m 755 "${INSTALL_BIN_DIR}"
for bin in docker dockerd containerd containerd-shim-runc-v2 ctr docker-init docker-proxy runc; do
  [[ -f "${src}/${bin}" ]] || { warn "缺少 ${bin}，跳过"; continue; }
  if [[ -e "${INSTALL_BIN_DIR}/${bin}" && "${FORCE}" -eq 0 && "${bin}" != "docker" ]]; then
    warn "${INSTALL_BIN_DIR}/${bin} 已存在，保留现有文件（如需覆盖请加 --force）"
    continue
  fi
  run install -m 755 "${src}/${bin}" "${INSTALL_BIN_DIR}/${bin}"
done

log "==> 配置 systemd 服务"
run install -d -m 755 "${DOCKER_ETC_DIR}"
if [[ ! -f "${DOCKER_ETC_DIR}/daemon.json" ]]; then
  run cp -a "${VENDOR}/daemon.json" "${DOCKER_ETC_DIR}/daemon.json"
  log "已写入 ${DOCKER_ETC_DIR}/daemon.json"
else
  log "${DOCKER_ETC_DIR}/daemon.json 已存在，保留现有配置"
fi
if [[ "${SKIP_SYSTEMD}" -eq 1 ]]; then
  log "SKIP_SYSTEMD=1，跳过 systemd 单元安装与启动"
else
  run install -d -m 755 "${SYSTEMD_UNIT_DIR}"
  if [[ ! -f "${SYSTEMD_UNIT_DIR}/docker.service" ]]; then
    run cp -a "${VENDOR}/docker.service" "${SYSTEMD_UNIT_DIR}/docker.service"
    log "已写入 ${SYSTEMD_UNIT_DIR}/docker.service"
  else
    log "${SYSTEMD_UNIT_DIR}/docker.service 已存在，保留现有配置"
  fi
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    printf '[dry-run] systemctl daemon-reload\n[dry-run] systemctl enable docker\n[dry-run] systemctl start docker\n'
  else
    run systemctl daemon-reload
    systemctl enable docker >/dev/null 2>&1 || true
    run systemctl start docker
  fi
fi

if [[ "${DRY_RUN}" -eq 0 && "${SKIP_SYSTEMD}" -eq 0 ]]; then
  log "==> 等待 Docker 就绪"
  ok=0
  for _ in $(seq 1 30); do
    if docker info >/dev/null 2>&1; then ok=1; break; fi
    sleep 2
  done
  if [[ "${ok}" -ne 1 ]]; then
    systemctl status docker --no-pager -l | tail -20 >&2 || true
    die "Docker 启动失败，请查看 journalctl -u docker"
  fi
  log "Docker 已启动：$(docker version --format '{{.Server.Version}}')"
fi

log "==> 安装 docker compose 插件"
for dir in /usr/libexec/docker/cli-plugins /usr/local/lib/docker/cli-plugins; do
  run install -d -m 755 "${dir}"
  run install -m 755 "${COMPOSE_BIN}" "${dir}/docker-compose"
done

if [[ "${DRY_RUN}" -eq 0 && "${SKIP_SYSTEMD}" -eq 0 ]]; then
  if docker compose version >/dev/null 2>&1; then
    log "compose 插件可用：$(docker compose version)"
  else
    warn "docker compose 插件校验失败，安装包内的 bin/docker-compose 仍可直接使用"
  fi
fi

if ! getent group docker >/dev/null 2>&1; then
  run groupadd -r docker || true
fi

log "Docker 离线安装完成"
