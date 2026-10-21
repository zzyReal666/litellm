#!/usr/bin/env bash
set -euo pipefail

PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${INSTALL_DIR:-/opt/litellm}"
LITELLM_PORT="${LITELLM_PORT:-4000}"
LITELLM_BIND="${LITELLM_BIND:-0.0.0.0}"
PROMETHEUS_PORT="${PROMETHEUS_PORT:-9090}"
POSTGRES_DB="${POSTGRES_DB:-litellm}"
POSTGRES_USER="${POSTGRES_USER:-litellm}"
UI_USERNAME="${UI_USERNAME:-admin}"
DEEPSEEK_API_KEY_INPUT="${DEEPSEEK_API_KEY:-}"
DEEPSEEK_API_KEY_2_INPUT="${DEEPSEEK_API_KEY_2:-}"
SKIP_IMAGES=0
SEED_MODELS=1
ASSUME_YES=0

log() { printf '%s\n' "$*"; }
warn() { printf '警告: %s\n' "$*" >&2; }
die() { printf '错误: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
用法: ./install.sh [选项]

  --dir <目录>             安装目录，默认 /opt/litellm
  --port <端口>            LiteLLM 监听端口，默认 4000
  --bind <地址>            监听地址，默认 0.0.0.0
  --prometheus-port <端口> Prometheus 端口，默认 9090
  --ui-username <用户名>   管理界面用户名，默认 admin
  --deepseek-key <key>     DeepSeek API Key，写入 .env 并初始化模型
  --deepseek-key-2 <key>   第二组上游 Key，用于 flash/pro 双 deployment 分流
  --skip-images            跳过 docker load，镜像已在目标机
  --no-seed                不初始化模型，部署后到界面自行配置
  --yes                    非交互确认
  -h, --help               显示帮助
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    --port) LITELLM_PORT="$2"; shift 2 ;;
    --bind) LITELLM_BIND="$2"; shift 2 ;;
    --prometheus-port) PROMETHEUS_PORT="$2"; shift 2 ;;
    --ui-username) UI_USERNAME="$2"; shift 2 ;;
    --deepseek-key) DEEPSEEK_API_KEY_INPUT="$2"; shift 2 ;;
    --deepseek-key-2) DEEPSEEK_API_KEY_2_INPUT="$2"; shift 2 ;;
    --skip-images) SKIP_IMAGES=1; shift ;;
    --no-seed) SEED_MODELS=0; shift ;;
    --yes) ASSUME_YES=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "未知参数: $1（-h 查看帮助）" ;;
  esac
done

[[ "${EUID}" -eq 0 ]] || die "请使用 root 运行（需要操作 Docker 与 /opt 目录）"
command -v docker >/dev/null 2>&1 || die "未安装 Docker"

if [[ "${PKG_DIR}" != "${INSTALL_DIR}" ]]; then
  log "==> 安装到 ${INSTALL_DIR}"
  mkdir -p "${INSTALL_DIR}"
  for item in docker-compose.yml prometheus.yml config scripts bin images .env.example install.sh uninstall.sh README-安装说明.md; do
    [[ -e "${PKG_DIR}/${item}" ]] && cp -a "${PKG_DIR}/${item}" "${INSTALL_DIR}/"
  done
fi

cd "${INSTALL_DIR}"
source "${INSTALL_DIR}/scripts/_lib.sh"

litellm_compose_is_available || die "未找到 Docker Compose，请确认 bin/docker-compose 存在且可执行"

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 24
  else
    head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

if [[ -f "${INSTALL_DIR}/.env" ]]; then
  log "==> 已存在 .env，沿用现有配置"
else
  log "==> 生成 .env"
  POSTGRES_PASSWORD="$(gen_secret)"
  LITELLM_MASTER_KEY="sk-$(gen_secret)"
  LITELLM_SALT_KEY="sk-$(gen_secret)"
  REDIS_PASSWORD="$(gen_secret)"
  UI_PASSWORD="${UI_PASSWORD:-$(gen_secret)}"
  cat > "${INSTALL_DIR}/.env" <<EOF
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
POSTGRES_HOST_PORT=5432
LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
LITELLM_SALT_KEY=${LITELLM_SALT_KEY}
LITELLM_BIND=${LITELLM_BIND}
PROMETHEUS_HOST_PORT=${PROMETHEUS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_HOST_PORT=6379
UI_USERNAME=${UI_USERNAME}
UI_PASSWORD=${UI_PASSWORD}
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY_INPUT}
DEEPSEEK_API_KEY_2=${DEEPSEEK_API_KEY_2_INPUT}
EOF
  chmod 600 "${INSTALL_DIR}/.env"
fi

mkdir -p data/postgres data/redis data/prometheus backups
if [[ -d data/postgres ]] && [[ -z "$(ls -A data/postgres 2>/dev/null || true)" ]]; then
  chown -R 999:999 data/postgres
fi
if [[ -d data/redis ]] && [[ -z "$(ls -A data/redis 2>/dev/null || true)" ]]; then
  chown -R 999:999 data/redis
fi

if [[ "${SKIP_IMAGES}" -eq 0 ]]; then
  log "==> 加载镜像"
  bash "${INSTALL_DIR}/scripts/load-images.sh"
else
  log "==> 跳过镜像加载"
fi

log "==> 启动服务"
bash "${INSTALL_DIR}/scripts/preflight.sh"
if ! bash "${INSTALL_DIR}/scripts/start.sh"; then
  die "服务启动失败，查看日志: ${INSTALL_DIR}/scripts/logs.sh"
fi

log "==> 等待 Litellm 就绪"
code=""
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${LITELLM_PORT}/health/readiness" || true)"
  [[ "${code}" == "200" ]] && break
  sleep 5
done
[[ "${code}" == "200" ]] || die "就绪检查超时（HTTP ${code}），查看日志: ${INSTALL_DIR}/scripts/logs.sh"

log "==> 配置 coordination Redis（保证预算花费计数准确）"
bash "${INSTALL_DIR}/scripts/enable-coordination-redis.sh" || warn "coordination Redis 未配置，预算计数可能不准确"

if [[ "${SEED_MODELS}" -eq 1 ]]; then
  if [[ -n "${DEEPSEEK_API_KEY_INPUT}" ]]; then
    log "==> 初始化 DeepSeek 模型"
    bash "${INSTALL_DIR}/scripts/seed-models.sh" || warn "模型初始化未全部成功，可到界面手动配置"
  else
    warn "未提供 --deepseek-key，跳过模型初始化，部署后请到界面配置模型"
  fi
fi

set -a
source "${INSTALL_DIR}/.env"
set +a

log ""
log "部署完成"
log "  管理界面   http://<本机IP>:${LITELLM_PORT}/ui"
log "  用户名     ${UI_USERNAME}"
log "  密码       ${UI_PASSWORD}"
log "  主密钥     ${LITELLM_MASTER_KEY}（仅本文件可见，请妥善保存）"
log "  安装目录   ${INSTALL_DIR}"
log "  查看状态   ${INSTALL_DIR}/scripts/status.sh"
log "  查看日志   ${INSTALL_DIR}/scripts/logs.sh"
