#!/usr/bin/env bash
# 启动前检查：Docker、compose、目录、磁盘、关键文件。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

MIN_FREE_MB="${MIN_FREE_MB:-5000}"

fail=0

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: 缺少命令: $1" >&2
    fail=1
  fi
}

need_cmd docker
if ! litellm_compose_is_available; then
  echo "error: 未检测到 Docker Compose（docker compose / docker-compose / ${ROOT}/bin/docker-compose）。" >&2
  echo "      目标机无外网时，请将 compose 二进制放到 ${ROOT}/bin/docker-compose（见 bin/README.txt）。" >&2
  fail=1
fi

if [[ ! -f "${ROOT}/.env" ]]; then
  echo "error: 缺少 ${ROOT}/.env（请复制 .env.example 并 chmod 600）" >&2
  fail=1
fi

if [[ ! -f "${ROOT}/config/config.yaml" ]]; then
  echo "error: 缺少 ${ROOT}/config/config.yaml" >&2
  fail=1
fi

for d in data/postgres data/prometheus data/headroom backups images; do
  if [[ ! -d "${ROOT}/${d}" ]]; then
    echo "warn: 目录不存在，将创建 ${ROOT}/${d}"
    mkdir -p "${ROOT}/${d}"
  fi
done

# Prometheus 官方镜像默认以 nobody 写 TSDB；bind mount 需属主可写，否则容器会反复重启。
if [[ -d "${ROOT}/data/prometheus" ]]; then
  _nobody_uid="$(id -u nobody 2>/dev/null || echo 65534)"
  _nobody_gid="$(id -g nobody 2>/dev/null || echo 65534)"
  if chown -R "${_nobody_uid}:${_nobody_gid}" "${ROOT}/data/prometheus" 2>/dev/null; then
    echo "ok: chown data/prometheus -> ${_nobody_uid}:${_nobody_gid}"
  else
    echo "warn: 无法 chown data/prometheus 为 nobody，若 prometheus 反复重启请手动修复权限" >&2
  fi
fi

# headroom 镜像以 nonroot(1000:1000) 运行，bind mount 的 ~/.headroom 需属主可写。
if [[ -d "${ROOT}/data/headroom" ]]; then
  if chown -R 1000:1000 "${ROOT}/data/headroom" 2>/dev/null; then
    echo "ok: chown data/headroom -> 1000:1000"
  else
    echo "warn: 无法 chown data/headroom 为 1000:1000，若 headroom 反复重启请手动修复权限" >&2
  fi
fi

avail_kb="$(df -Pk "${ROOT}/data" | awk 'NR==2 {print $4}')"
avail_mb=$((avail_kb / 1024))
if [[ "${avail_mb}" -lt "${MIN_FREE_MB}" ]]; then
  echo "warn: ${ROOT}/data 可用空间约 ${avail_mb} MiB，低于建议 ${MIN_FREE_MB} MiB" >&2
fi

if [[ -d "${ROOT}/data/postgres" ]] && [[ -n "$(ls -A "${ROOT}/data/postgres" 2>/dev/null || true)" ]]; then
  if [[ ! -f "${ROOT}/data/postgres/PG_VERSION" ]]; then
    echo "error: ${ROOT}/data/postgres 非空但不是有效 PGDATA（缺少 PG_VERSION）。请清空该目录或换用全新数据目录。" >&2
    fail=1
  fi
fi

if [[ "${fail}" -ne 0 ]]; then
  exit 1
fi

echo "preflight ok: ROOT=${ROOT}"
