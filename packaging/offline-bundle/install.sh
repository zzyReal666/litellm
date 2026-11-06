#!/usr/bin/env bash
set -euo pipefail

PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${INSTALL_DIR:-/opt/litellm}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-litellm}"
LITELLM_PORT="${LITELLM_PORT:-4000}"
LITELLM_BIND="${LITELLM_BIND:-0.0.0.0}"
PROMETHEUS_PORT="${PROMETHEUS_PORT:-9090}"
POSTGRES_HOST_PORT="${POSTGRES_HOST_PORT:-5432}"
REDIS_HOST_PORT="${REDIS_HOST_PORT:-6379}"
HEADROOM_HOST_PORT="${HEADROOM_HOST_PORT:-8787}"
POSTGRES_DB="${POSTGRES_DB:-litellm}"
POSTGRES_USER="${POSTGRES_USER:-litellm}"
UI_USERNAME="${UI_USERNAME:-admin@sinocipher.local}"
UI_PASSWORD="${UI_PASSWORD:-}"
LITELLM_PRODUCT_NAME="${LITELLM_PRODUCT_NAME:-中安云科 AI 安全网关}"
LITELLM_PRODUCT_CODE="${LITELLM_PRODUCT_CODE:-SC-AIG}"
LITELLM_PRODUCT_TIMEZONE="${LITELLM_PRODUCT_TIMEZONE:-Asia/Shanghai}"
TZ="${TZ:-Asia/Shanghai}"
DEEPSEEK_API_KEY_INPUT="${DEEPSEEK_API_KEY:-}"
DEEPSEEK_API_KEY_2_INPUT="${DEEPSEEK_API_KEY_2:-}"
SKIP_IMAGES="${SKIP_IMAGES:-0}"
SEED_MODELS="${SEED_MODELS:-1}"
SETUP_COMPRESSION="${SETUP_COMPRESSION:-1}"
ASSUME_YES="${ASSUME_YES:-0}"
SKIP_DOCKER="${SKIP_DOCKER:-0}"
SKIP_ADMIN="${SKIP_ADMIN:-0}"
ADMIN_CREATED=0
ARGS_GIVEN=0

log() { printf '%s\n' "$*"; }
step() { printf '\n[%s] %s\n' "$1" "$2"; }
ok() { printf '    %s\n' "$*"; }
warn() { printf '警告: %s\n' "$*" >&2; }
die() { printf '错误: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
用法:
  ./install.sh                 交互式安装向导
  ./install.sh [选项]          按参数静默安装
  ./litellm <命令>             安装后日常运维

安装选项:
  --dir <目录>             安装目录，默认 /opt/litellm
  --port <端口>            LiteLLM 监听端口，默认 4000
  --bind <地址>            监听地址，默认 0.0.0.0
  --prometheus-port <端口> Prometheus 端口，默认 9090
  --postgres-port <端口>   Postgres 宿主机端口，默认 5432
  --redis-port <端口>      Redis 宿主机端口，默认 6379
  --headroom-port <端口>   提示词压缩服务宿主机端口，默认 8787
  --project-name <名称>    容器项目名，同机多套部署时区分，默认 litellm
  --ui-email <邮箱>        管理界面管理员邮箱，默认 admin@sinocipher.local
  --ui-password <密码>     管理界面密码，默认随机生成
  --deepseek-key <key>     DeepSeek API Key，写入 .env 并初始化模型
  --deepseek-key-2 <key>   第二组上游 Key，用于 flash/pro 双 deployment 分流
  --product-name <名称>    授权信息中展示的产品名，默认 中安云科 AI 安全网关
  --product-code <编码>    授权产品编码，默认 SC-AIG
  --skip-images            跳过镜像加载，镜像已在目标机
  --skip-docker            跳过 Docker 引擎安装（目标机已装 Docker）
  --skip-admin             跳过管理员账号创建（保留环境变量登录）
  --no-seed                不初始化模型，部署后到界面自行配置
  --no-compression         不创建提示词压缩护栏（headroom 服务仍会启动）
  --yes                    非交互确认
  -h, --help               显示帮助
EOF
}

port_in_use() {
  local port="$1"
  ss -lntH "sport = :${port}" 2>/dev/null | grep -q . && return 0
  return 1
}

ask() {
  local prompt="$1" default="$2" reply
  if [[ -n "${default}" ]]; then
    printf '    %s [%s]: ' "${prompt}" "${default}" >&2
  else
    printf '    %s: ' "${prompt}" >&2
  fi
  read -r reply || true
  printf '%s\n' "${reply:-${default}}"
}

ask_port() {
  local prompt="$1" default="$2" value
  while true; do
    value="$(ask "${prompt}" "${default}")"
    if [[ ! "${value}" =~ ^[0-9]+$ ]] || [[ "${value}" -lt 1 ]] || [[ "${value}" -gt 65535 ]]; then
      warn "端口必须是 1-65535 的数字"
      continue
    fi
    if port_in_use "${value}"; then
      warn "端口 ${value} 已被占用，请换一个"
      continue
    fi
    printf '%s\n' "${value}"
    return 0
  done
}

ask_yes_no() {
  local prompt="$1" default="$2" reply
  printf '    %s [%s]: ' "${prompt}" "${default}" >&2
  read -r reply || true
  reply="${reply:-${default}}"
  [[ "${reply}" =~ ^[Yy] ]]
}

gen_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 24
  else
    head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

ARGS_GIVEN="$#"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    --port) LITELLM_PORT="$2"; shift 2 ;;
    --bind) LITELLM_BIND="$2"; shift 2 ;;
    --prometheus-port) PROMETHEUS_PORT="$2"; shift 2 ;;
    --postgres-port) POSTGRES_HOST_PORT="$2"; shift 2 ;;
    --redis-port) REDIS_HOST_PORT="$2"; shift 2 ;;
    --headroom-port) HEADROOM_HOST_PORT="$2"; shift 2 ;;
    --project-name) COMPOSE_PROJECT_NAME="$2"; shift 2 ;;
    --ui-username|--ui-email) UI_USERNAME="$2"; shift 2 ;;
    --ui-password) UI_PASSWORD="$2"; shift 2 ;;
    --deepseek-key) DEEPSEEK_API_KEY_INPUT="$2"; shift 2 ;;
    --deepseek-key-2) DEEPSEEK_API_KEY_2_INPUT="$2"; shift 2 ;;
    --product-name) LITELLM_PRODUCT_NAME="$2"; shift 2 ;;
    --product-code) LITELLM_PRODUCT_CODE="$2"; shift 2 ;;
    --skip-images) SKIP_IMAGES=1; shift ;;
    --skip-docker) SKIP_DOCKER=1; shift ;;
    --skip-admin) SKIP_ADMIN=1; shift ;;
    --no-seed) SEED_MODELS=0; shift ;;
    --no-compression) SETUP_COMPRESSION=0; shift ;;
    --yes) ASSUME_YES=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "未知参数: $1（-h 查看帮助，不带参数执行进入交互式向导）" ;;
  esac
done

[[ "${EUID}" -eq 0 ]] || die "请使用 root 运行（需要操作 Docker 与安装目录）"

if [[ "${ARGS_GIVEN}" -eq 0 ]] && [[ "${ASSUME_YES}" -eq 0 ]]; then
  log "=============================================="
  log " 中安云科 AI 安全网关 安装向导"
  log "=============================================="
  log "  直接回车使用方括号中的默认值，Ctrl+C 退出"

  step "1/6" "安装目录与端口"
  INSTALL_DIR="$(ask "安装目录" "${INSTALL_DIR}")"
  if [[ -d "${INSTALL_DIR}" ]] && [[ -f "${INSTALL_DIR}/.env" ]]; then
    warn "目录 ${INSTALL_DIR} 下已有部署，继续将复用现有配置与数据"
    ask_yes_no "确认继续？" "n" || { log "已取消"; exit 0; }
  fi
  LITELLM_PORT="$(ask_port "管理界面端口" "${LITELLM_PORT}")"
  PROMETHEUS_PORT="$(ask_port "监控指标端口" "${PROMETHEUS_PORT}")"
  ok "安装目录 ${INSTALL_DIR}，界面端口 ${LITELLM_PORT}，监控端口 ${PROMETHEUS_PORT}"

  step "2/6" "依赖端口"
  log "  这三个端口只监听本机回环地址，供容器内部服务使用"
  POSTGRES_HOST_PORT="$(ask_port "数据库宿主机端口" "${POSTGRES_HOST_PORT}")"
  REDIS_HOST_PORT="$(ask_port "Redis 宿主机端口" "${REDIS_HOST_PORT}")"
  HEADROOM_HOST_PORT="$(ask_port "压缩服务宿主机端口" "${HEADROOM_HOST_PORT}")"
  ok "数据库 ${POSTGRES_HOST_PORT}，Redis ${REDIS_HOST_PORT}，压缩服务 ${HEADROOM_HOST_PORT}"

  step "3/6" "管理员账号"
  while true; do
    UI_USERNAME="$(ask "管理员邮箱（登录用户名）" "${UI_USERNAME}")"
    case "${UI_USERNAME}" in
      *@*.*) break ;;
      *) warn "请填写邮箱格式，例如 admin@example.com" ;;
    esac
  done
  if ask_yes_no "自动生成随机密码？" "y"; then
    UI_PASSWORD="${UI_PASSWORD:-$(gen_secret)}"
    ok "已生成随机密码，安装结束后显示"
  else
    while true; do
      UI_PASSWORD="$(ask "设置管理界面密码（至少 12 位）" "")"
      [[ ${#UI_PASSWORD} -ge 12 ]] && break
      warn "密码至少 12 位（系统密码策略要求）"
    done
    ok "已设置自定义密码"
  fi

  step "4/6" "上游模型 Key"
  log "  留空可跳过模型初始化，装完在管理界面配置模型"
  DEEPSEEK_API_KEY_INPUT="$(ask "DeepSeek API Key" "${DEEPSEEK_API_KEY_INPUT}")"
  if [[ -n "${DEEPSEEK_API_KEY_INPUT}" ]]; then
    DEEPSEEK_API_KEY_2_INPUT="$(ask "第二组 DeepSeek API Key（可选，用于分流）" "${DEEPSEEK_API_KEY_2_INPUT}")"
    ok "安装后将自动创建 deepseek-flash、deepseek-v4-pro 等模型分组"
  else
    ok "跳过模型初始化"
  fi

  step "5/6" "安装确认"
  log "  安装目录     ${INSTALL_DIR}"
  log "  管理界面     http://<本机IP>:${LITELLM_PORT}/ui"
  log "  管理账号     ${UI_USERNAME}"
  log "  监控指标     http://<本机IP>:${PROMETHEUS_PORT}"
  log "  加载镜像     $([[ "${SKIP_IMAGES}" -eq 1 ]] && echo 跳过 || echo 从安装包加载)"
  log "  初始化模型   $([[ -n "${DEEPSEEK_API_KEY_INPUT}" ]] && echo 是 || echo 否)"
  log "  提示词压缩   $([[ "${SETUP_COMPRESSION}" -eq 1 ]] && echo 启用 || echo 跳过)"
  ask_yes_no "开始安装？" "y" || { log "已取消"; exit 0; }
  ASSUME_YES=1
  log ""
  log "开始执行安装，共 10 个步骤"
fi

log ""
TOTAL_STEPS=10
STEP_NO=0
TTY=0
[[ -t 1 ]] && TTY=1
STEP_BEGIN=0

begin_step() {
  STEP_NO=$((STEP_NO + 1))
  STEP_BEGIN="$(date +%s)"
  printf '\n[%d/%d] %s\n' "${STEP_NO}" "${TOTAL_STEPS}" "$1"
}

step_ok() {
  printf '    完成，用时 %s 秒%s\n' "$(( $(date +%s) - STEP_BEGIN ))" "${1:+，$1}"
}

bar() {
  local label="$1" cur="$2" total="$3" width=28 pct filled i out=""
  (( total > 0 )) || total=1
  pct=$(( cur * 100 / total ))
  (( pct > 100 )) && pct=100
  filled=$(( pct * width / 100 ))
  for ((i = 0; i < width; i++)); do
    if (( i < filled )); then out+="#"; else out+="-"; fi
  done
  if (( TTY )); then
    printf '\r    [%s] %3d%% %s' "${out}" "${pct}" "${label}"
  else
    printf '    %3d%% %s\n' "${pct}" "${label}"
  fi
}

bar_end() {
  if (( TTY )); then
    printf '\n'
  fi
  return 0
}

load_with_progress() {
  local cmd=("$@") out rc spin='-\|/'
  local idx=0 begin elapsed
  begin="$(date +%s)"
  "${cmd[@]}" > /tmp/litellm_step.$$ 2>&1 &
  local pid=$!
  while kill -0 "${pid}" 2>/dev/null; do
    elapsed=$(( $(date +%s) - begin ))
    idx=$(( (idx + 1) % 4 ))
    if (( TTY )); then
      printf '\r    处理中 %s 已用 %s 秒' "${spin:idx:1}" "${elapsed}"
    elif (( elapsed > 0 && elapsed % 15 == 0 )); then
      printf '    处理中，已用 %s 秒\n' "${elapsed}"
    fi
    sleep 1
  done
  wait "${pid}" || rc=$?
  (( TTY )) && printf '\r                                    \r'
  if (( ${rc:-0} != 0 )); then
    cat /tmp/litellm_step.$$ >&2
    rm -f /tmp/litellm_step.$$
    return 1
  fi
  rm -f /tmp/litellm_step.$$
  return 0
}

images_present() {
  local missing=0 img
  for img in litellm-zhcn:v1.106.0-zh.16 headroom-offline:v1.106.0-zh.7 postgres:16.4 redis:7.4.2-alpine prom/prometheus:v2.55.1; do
    docker image inspect "${img}" >/dev/null 2>&1 || missing=1
  done
  return "${missing}"
}

begin_step "环境预检"
[[ "${EUID}" -eq 0 ]] || die "请使用 root 运行"
if [[ "${SKIP_DOCKER}" -eq 0 ]] && ! command -v docker >/dev/null 2>&1; then
  [[ -d /run/systemd/system ]] || die "目标机未使用 systemd，无法自动安装 Docker"
fi
avail_mb="$(df -Pk / | awk 'NR==2 {print int($4/1024)}')"
(( avail_mb > 8000 )) || warn "根分区可用空间约 ${avail_mb} MiB，建议至少 8 GiB"
mem_mb="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)"
(( mem_mb > 3000 )) || warn "内存约 ${mem_mb} MiB，建议至少 4 GiB"
step_ok

begin_step "Docker 引擎"
if command -v docker >/dev/null 2>&1; then
  printf '    已安装 %s，跳过\n' "$(docker --version 2>/dev/null | head -1)"
else
  [[ -x "${PKG_DIR}/scripts/install-docker.sh" ]] || die "未安装 Docker，且包内缺少 vendor/docker"
  printf '    未检测到 Docker，安装包内 %s\n' "docker-26.0.1"
  load_with_progress bash "${PKG_DIR}/scripts/install-docker.sh" || die "Docker 离线安装失败"
fi
step_ok

begin_step "Docker Compose"
cd "${PKG_DIR}"
source "${PKG_DIR}/scripts/_lib.sh"
litellm_compose_is_available || die "未找到 Docker Compose"
printf '    可用：%s\n' "$(litellm_compose version 2>/dev/null | head -1 || echo 内置二进制)"
step_ok

begin_step "复制安装文件"
if [[ "${PKG_DIR}" != "${INSTALL_DIR}" ]]; then
  mkdir -p "${INSTALL_DIR}"
  copy_items=(docker-compose.yml prometheus.yml scripts bin vendor .env.example install.sh uninstall.sh litellm)
  total_files=0
  for item in "${copy_items[@]}"; do [[ -e "${PKG_DIR}/${item}" ]] && total_files=$((total_files + 1)); done
  done_files=0
  for item in "${copy_items[@]}"; do
    if [[ -e "${PKG_DIR}/${item}" ]]; then
      bar "复制 ${item}" "${done_files}" "${total_files}"
      cp -a "${PKG_DIR}/${item}" "${INSTALL_DIR}/"
      done_files=$((done_files + 1))
    fi
  done
  mkdir -p "${INSTALL_DIR}/config" "${INSTALL_DIR}/assets" "${INSTALL_DIR}/images"
  [[ -f "${INSTALL_DIR}/config/config.yaml" ]] || cp -a "${PKG_DIR}/config/config.yaml" "${INSTALL_DIR}/config/config.yaml"
  for asset in logo.png favicon.png README-安装说明.md; do
    if [[ ! -f "${INSTALL_DIR}/${asset}" && -f "${PKG_DIR}/${asset}" ]]; then
      cp -a "${PKG_DIR}/${asset}" "${INSTALL_DIR}/${asset}"
    fi
  done
  bar "复制完成" "${total_files}" "${total_files}"
  bar_end
else
  printf '    安装包即安装目录，跳过复制\n'
fi
step_ok

begin_step "加载镜像"
if images_present; then
  printf '    5 个镜像已在本机，跳过加载\n'
else
  shopt -s nullglob
  tars=("${PKG_DIR}/images"/*.tar)
  if [[ ${#tars[@]} -eq 0 ]]; then
    die "未找到 ${PKG_DIR}/images/*.tar，安装包不完整"
  fi
  idx=0
  for f in "${tars[@]}"; do
    idx=$((idx + 1))
    name="$(basename "${f}")"
    size="$(du -h "${f}" 2>/dev/null | cut -f1)"
    bar "[${idx}/${#tars[@]}] 加载 ${name} (${size})" "${idx}" "${#tars[@]}"
    if ! load_with_progress docker load -i "${f}"; then
      die "镜像加载失败：${name}"
    fi
  done
  bar_end
  printf '    已加载 %d 个镜像\n' "${#tars[@]}"
fi
step_ok

begin_step "生成配置"
cd "${INSTALL_DIR}"
env_file_valid() {
  local f="$1"
  [[ -s "${f}" ]] || return 1
  grep -q '^LITELLM_MASTER_KEY=sk-' "${f}" || return 1
  grep -q '^POSTGRES_PASSWORD=.' "${f}" || return 1
  grep -q '^DATABASE_URL=postgresql://' "${f}" || return 1
  return 0
}

if [[ -f "${INSTALL_DIR}/.env" ]] && env_file_valid "${INSTALL_DIR}/.env"; then
  printf '    已存在有效 .env，沿用现有配置\n'
  set -a
  source "${INSTALL_DIR}/.env"
  set +a
else
  if [[ -f "${INSTALL_DIR}/.env" ]]; then
    backup="${INSTALL_DIR}/.env.broken.$(date +%Y%m%d_%H%M%S)"
    mv "${INSTALL_DIR}/.env" "${backup}"
    warn "现有 .env 不完整，已备份到 ${backup} 并重新生成"
  fi
  POSTGRES_PASSWORD="$(gen_secret)"
  LITELLM_MASTER_KEY="sk-$(gen_secret)"
  LITELLM_SALT_KEY="sk-$(gen_secret)"
  REDIS_PASSWORD="$(gen_secret)"
  HEADROOM_PROXY_TOKEN="$(gen_secret)"
  UI_PASSWORD="${UI_PASSWORD:-$(gen_secret)}"
  cat > "${INSTALL_DIR}/.env" <<EOF
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
POSTGRES_HOST_PORT=${POSTGRES_HOST_PORT}
LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
LITELLM_SALT_KEY=${LITELLM_SALT_KEY}
LITELLM_BIND=${LITELLM_BIND}
LITELLM_PORT=${LITELLM_PORT}
PROMETHEUS_HOST_PORT=${PROMETHEUS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_HOST_PORT=${REDIS_HOST_PORT}
HEADROOM_HOST_PORT=${HEADROOM_HOST_PORT}
HEADROOM_PROXY_TOKEN=${HEADROOM_PROXY_TOKEN}
UI_USERNAME="${UI_USERNAME}"
UI_PASSWORD="${UI_PASSWORD}"
LITELLM_PRODUCT_LICENSE_ENABLED=true
LITELLM_PRODUCT_NAME="${LITELLM_PRODUCT_NAME}"
LITELLM_PRODUCT_CODE="${LITELLM_PRODUCT_CODE}"
LITELLM_PRODUCT_TIMEZONE="${LITELLM_PRODUCT_TIMEZONE}"
TZ="${TZ:-Asia/Shanghai}"
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY_INPUT}
DEEPSEEK_API_KEY_2=${DEEPSEEK_API_KEY_2_INPUT}
EOF
  chmod 600 "${INSTALL_DIR}/.env"
  printf '    已生成 .env，主密钥、数据库密码、管理员密码均为随机值，安装结束显示\n'
fi

mkdir -p data/postgres data/redis data/prometheus data/headroom data/license backups
[ -f data/license/license.zayk ] || : > data/license/license.zayk
if [[ -d data/postgres ]] && [[ -z "$(ls -A data/postgres 2>/dev/null || true)" ]]; then
  chown -R 999:999 data/postgres
fi
if [[ -d data/redis ]] && [[ -z "$(ls -A data/redis 2>/dev/null || true)" ]]; then
  chown -R 999:999 data/redis
fi
step_ok

begin_step "启动服务"
bash "${INSTALL_DIR}/scripts/preflight.sh" > /tmp/litellm_preflight.$$ 2>&1 || {
  cat /tmp/litellm_preflight.$$ >&2
  rm -f /tmp/litellm_preflight.$$
  die "启动前检查未通过"
}
rm -f /tmp/litellm_preflight.$$
if ! load_with_progress bash "${INSTALL_DIR}/scripts/start.sh"; then
  die "服务启动失败，排查：${INSTALL_DIR}/litellm logs"
fi
running=0
for _ in $(seq 1 30); do
  running="$(docker ps --filter "label=com.docker.compose.project=${COMPOSE_PROJECT_NAME}" --format '{{.Names}}' 2>/dev/null | wc -l)"
  bar "容器已启动 ${running}/5" "${running}" 5
  (( running >= 5 )) && break
  sleep 2
done
bar_end
step_ok

begin_step "等待服务就绪"
code=""
begin="$(date +%s)"
estimate=150
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${LITELLM_PORT}/health/readiness" || true)"
  elapsed=$(( $(date +%s) - begin ))
  [[ "${code}" == "200" ]] && break
  bar "等待网关响应，已用 ${elapsed} 秒" "${elapsed}" "${estimate}"
  sleep 3
done
bar_end
if [[ "${code}" != "200" ]]; then
  printf '\n'
  bash "${INSTALL_DIR}/scripts/logs.sh" 2>/dev/null | tail -25 || true
  die "就绪检查超时（HTTP ${code}），排查：${INSTALL_DIR}/litellm logs"
fi
step_ok

begin_step "创建管理员账号"
disable_env_login() {
  local cfg="${INSTALL_DIR}/config/config.yaml"
  if grep -q "disable_env_credential_login" "${cfg}"; then
    sed -i 's/disable_env_credential_login: .*/disable_env_credential_login: true/' "${cfg}"
  elif grep -q "^general_settings:" "${cfg}"; then
    sed -i '/^general_settings:/a\  disable_env_credential_login: true' "${cfg}"
  else
    printf '\ngeneral_settings:\n  disable_env_credential_login: true\n' >> "${cfg}"
  fi
}

admin_exists() {
  local mk code
  mk="$(grep '^LITELLM_MASTER_KEY=' "${INSTALL_DIR}/.env" | cut -d= -f2- | tr -d '"')"
  curl -s "http://127.0.0.1:${LITELLM_PORT}/user/list" -H "Authorization: Bearer ${mk}" 2>/dev/null \
    | grep -qiF "\"${UI_USERNAME}\""
}

if [[ "${SKIP_ADMIN}" -eq 1 ]]; then
  printf '    已跳过（--skip-admin），环境变量登录保持启用\n'
else
  # 先用环境变量账号登录一次，确保代理管理员身份行存在，后续邀请才能建立
  curl -s -o /dev/null -X POST "http://127.0.0.1:${LITELLM_PORT}/login" \
    -d "username=${UI_USERNAME}&password=${UI_PASSWORD}" 2>/dev/null || true
fi

if [[ "${SKIP_ADMIN}" -eq 1 ]]; then
  :
elif admin_exists; then
  printf '    管理员 %s 已存在，跳过创建\n' "${UI_USERNAME}"
  ADMIN_CREATED=1
  disable_env_login
  bash "${INSTALL_DIR}/scripts/restart.sh" litellm >/dev/null 2>&1 || true
  for _ in $(seq 1 40); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${LITELLM_PORT}/health/readiness" || true)"
    [[ "${code}" == "200" ]] && break
    sleep 4
  done
  printf '    环境变量登录已关闭\n'
elif bash "${INSTALL_DIR}/scripts/create-ui-admin.sh" "${UI_USERNAME}" "${UI_PASSWORD}" --disable-env-login 2>/tmp/litellm_admin.err; then
  printf '    账号 %s 已创建并验证登录\n' "${UI_USERNAME}"
  ADMIN_CREATED=1
  printf '    环境变量登录已关闭\n'
else
  warn "管理员账号创建失败，环境变量登录保持启用作为兜底"
  warn "排查后重新执行：${INSTALL_DIR}/litellm create-admin"
  sed -n '1,4p' /tmp/litellm_admin.err >&2 2>/dev/null || true
fi
rm -f /tmp/litellm_admin.err
step_ok

begin_step "授权检查"
license_authorized() {
  local body
  body="$(curl -s "http://127.0.0.1:${LITELLM_PORT}/product/license/info" 2>/dev/null || true)"
  printf '%s' "${body}" | grep -q '"auth_state":"authorized"'
}

post_install_needed=0
if license_authorized; then
  printf '    已授权，继续配置依赖项\n'
  bash "${INSTALL_DIR}/scripts/enable-coordination-redis.sh" || warn "coordination Redis 未配置"
  if [[ "${SEED_MODELS}" -eq 1 && -n "${DEEPSEEK_API_KEY_INPUT}" ]]; then
    bash "${INSTALL_DIR}/scripts/seed-models.sh" || warn "模型初始化未全部成功"
  fi
  if [[ "${SETUP_COMPRESSION}" -eq 1 ]]; then
    bash "${INSTALL_DIR}/scripts/setup-compression.sh" || warn "压缩护栏未创建"
  fi
else
  printf '    产品尚未授权，先跳过预算 Redis、模型初始化和压缩护栏\n'
  post_install_needed=1
fi
step_ok

set -a
source "${INSTALL_DIR}/.env"
set +a

host_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
[[ -n "${host_ip}" ]] || host_ip="<本机IP>"

printf '\n'
log "=============================================="
log " 安装完成，共 ${TOTAL_STEPS} 步"
log "=============================================="
log "  管理界面   http://${host_ip}:${LITELLM_PORT}/ui"
log "  管理账号   ${UI_USERNAME}"
log "  管理密码   ${UI_PASSWORD}"
if [[ "${SKIP_ADMIN}" -eq 0 ]]; then
  if [[ "${ADMIN_CREATED}" -eq 1 ]]; then
    log "  登录方式   使用上述邮箱与密码登录，环境变量登录已关闭"
  else
    log "  登录方式   管理员账号未建成，环境变量登录保持启用，仍可用上述邮箱密码登录"
  fi
fi
log "  主密钥     ${LITELLM_MASTER_KEY}"
log "  安装目录   ${INSTALL_DIR}"
if [[ "${post_install_needed}" -eq 1 ]]; then
  log ""
  log "  首次使用需导入授权文件："
  log "  1. 打开界面会自动跳转到授权激活页"
  log "  2. 点“下载授权申请码”，把文件交给厂商签发"
  log "  3. 上传签发的授权文件解锁"
  log "  4. 执行 ${INSTALL_DIR}/litellm post-install 初始化模型与压缩护栏"
fi
log ""
log "  日常运维   ${INSTALL_DIR}/litellm status"
log "             ${INSTALL_DIR}/litellm logs"
log "=============================================="
