#!/usr/bin/env bash
# 被同目录脚本 source：自动定位部署根目录（例如 /opt/litellm）。

_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${_LIB_DIR}/.." && pwd)"
export ROOT

litellm_load_env() {
  if [[ -f "${ROOT}/.env" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "${ROOT}/.env"
    set +a
  fi
}

litellm_compose_is_available() {
  if [[ -n "${LITELLM_COMPOSE_EXE:-}" && -x "${LITELLM_COMPOSE_EXE}" ]]; then
    return 0
  fi
  if [[ -x "${ROOT}/bin/docker-compose" ]]; then
    return 0
  fi
  if docker compose version >/dev/null 2>&1; then
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

litellm_compose() {
  local run=()
  if [[ -n "${LITELLM_COMPOSE_EXE:-}" && -x "${LITELLM_COMPOSE_EXE}" ]]; then
    run=("${LITELLM_COMPOSE_EXE}")
  elif [[ -x "${ROOT}/bin/docker-compose" ]]; then
    run=("${ROOT}/bin/docker-compose")
  elif docker compose version >/dev/null 2>&1; then
    run=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    run=(docker-compose)
  else
    echo "error: 未找到 Docker Compose。" >&2
    echo "离线：将官方发布的 docker-compose-linux-x86_64 上传到 ${ROOT}/bin/docker-compose 并 chmod +x；或设置 LITELLM_COMPOSE_EXE 指向该二进制。" >&2
    echo "联网打包机：bash packaging/download-compose-for-bundle.sh" >&2
    return 127
  fi
  (cd "$ROOT" && "${run[@]}" -f "${ROOT}/docker-compose.yml" "$@")
}
