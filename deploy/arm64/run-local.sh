#!/usr/bin/env bash
# 在 Apple Silicon macOS 上直接用 Docker 跑 arm64 离线包，不安装 systemd 服务。
# 用法: ./run-local.sh [--port 4000] [--down]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT}"

LITELLM_PORT="${LITELLM_PORT:-4000}"
POSTGRES_HOST_PORT="${POSTGRES_HOST_PORT:-55432}"
REDIS_HOST_PORT="${REDIS_HOST_PORT:-56379}"
HEADROOM_HOST_PORT="${HEADROOM_HOST_PORT:-8787}"
PROMETHEUS_HOST_PORT="${PROMETHEUS_HOST_PORT:-9190}"

compose() {
  (cd "${ROOT}" && docker compose -f "${ROOT}/docker-compose.yml" "$@")
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port) LITELLM_PORT="$2"; shift 2 ;;
    --down)
      compose down --remove-orphans
      echo "已停止（数据保留在 ${ROOT}/data）"
      exit 0 ;;
    -h|--help) echo "用法: $0 [--port 4000] [--down]"; exit 0 ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "错误: 未安装 Docker（macOS 上可用 OrbStack 或 Docker Desktop）" >&2
  exit 1
fi
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "错误: 本脚本只用于 macOS 本机联调；Linux 目标机请用 ./install.sh" >&2
  exit 1
fi

LITELLM_VERSION="$(sed -n 's/.*image: litellm-zhcn:\(.*\)/\1/p' docker-compose.yml | head -1)"
HEADROOM_VERSION="$(sed -n 's/.*image: headroom-offline:\(.*\)/\1/p' docker-compose.yml | head -1)"

images_present() {
  local img
  for img in "litellm-zhcn:${LITELLM_VERSION}" "headroom-offline:${HEADROOM_VERSION}" postgres:16.4 redis:7.4.2-alpine prom/prometheus:v2.55.1 nginx:1.27-alpine; do
    docker image inspect "${img}" >/dev/null 2>&1 || return 1
  done
  return 0
}

if ! images_present; then
  if compgen -G "images/*.tar" >/dev/null; then
    echo "==> 加载镜像"
    for tar in images/*.tar; do
      echo "  docker load -i ${tar}"
      docker load -i "${tar}" >/dev/null
    done
  else
    echo "错误: 缺少镜像且 images/ 下没有 tar 文件" >&2
    exit 1
  fi
fi

for img in "litellm-zhcn:${LITELLM_VERSION}" "headroom-offline:${HEADROOM_VERSION}"; do
  arch="$(docker image inspect --format '{{.Architecture}}' "${img}" 2>/dev/null || echo unknown)"
  echo "镜像 ${img} 架构: ${arch}"
done

if [[ ! -f "${ROOT}/.env" ]]; then
  echo "==> 生成 .env（随机密钥）"
  pg_pw="$(openssl rand -hex 24)"
  cat > "${ROOT}/.env" <<EOF
COMPOSE_PROJECT_NAME=litellm-arm
POSTGRES_USER=litellm
POSTGRES_PASSWORD=${pg_pw}
POSTGRES_DB=litellm
DATABASE_URL=postgresql://litellm:${pg_pw}@db:5432/litellm
POSTGRES_HOST_PORT=${POSTGRES_HOST_PORT}
LITELLM_MASTER_KEY=sk-$(openssl rand -hex 24)
LITELLM_SALT_KEY=sk-$(openssl rand -hex 24)
LITELLM_BIND=127.0.0.1
LITELLM_PORT=${LITELLM_PORT}
PROMETHEUS_HOST_PORT=${PROMETHEUS_HOST_PORT}
REDIS_PASSWORD=$(openssl rand -hex 24)
REDIS_HOST_PORT=${REDIS_HOST_PORT}
HEADROOM_HOST_PORT=${HEADROOM_HOST_PORT}
HEADROOM_PROXY_TOKEN=$(openssl rand -hex 24)
UI_USERNAME=admin@sinocipher.local
UI_PASSWORD=Zayk$(openssl rand -hex 6)!A9
LITELLM_PRODUCT_LICENSE_ENABLED=true
LITELLM_PRODUCT_NAME="中安云科 AI 安全网关"
LITELLM_PRODUCT_CODE=SC-AIG
LITELLM_PRODUCT_TIMEZONE=Asia/Shanghai
TZ=Asia/Shanghai
DEEPSEEK_API_KEY=
DEEPSEEK_API_KEY_2=
ENABLE_HTTPS=0
EOF
  chmod 600 "${ROOT}/.env"
fi

mkdir -p data/postgres data/redis data/prometheus data/headroom data/license
if [[ -d data/license/license.zayk ]]; then
  rmdir data/license/license.zayk 2>/dev/null || { echo "错误: data/license/license.zayk 是非空目录，请先清理" >&2; exit 1; }
fi
[[ -f data/license/license.zayk ]] || : > data/license/license.zayk

echo "==> 启动服务"
compose up -d

echo "==> 等待就绪"
code=""
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${LITELLM_PORT}/health/readiness" || true)"
  [[ "${code}" == "200" ]] && break
  sleep 3
done
if [[ "${code}" != "200" ]]; then
  echo "错误: 就绪检查超时（HTTP ${code}），查看日志: docker compose logs -f litellm" >&2
  exit 1
fi

ui_password="$(sed -n 's/^UI_PASSWORD=//p' "${ROOT}/.env" | head -1)"
ui_username="$(sed -n 's/^UI_USERNAME=//p' "${ROOT}/.env" | head -1)"
master_key="$(sed -n 's/^LITELLM_MASTER_KEY=//p' "${ROOT}/.env" | head -1)"

cat <<EOF

就绪。管理界面: http://127.0.0.1:${LITELLM_PORT}/ui
管理账号: ${ui_username}
管理密码: ${ui_password}
主密钥:   ${master_key}

常用命令: docker compose ps | docker compose logs -f litellm | ./run-local.sh --down
首次打开会跳到授权激活页，导入签发的授权文件后才放行业务接口（当前 /v1/* 返回 403）
EOF
