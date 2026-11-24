#!/usr/bin/env bash
# 构建 linux/arm64 镜像并组装 ARM 离线安装包（脚本/配置沿用现有 x86 包）。
# 用法示例:
#   ./build-bundle.sh --package ../offline-package --headroom-cache /tmp/headroom-cache
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "${HERE}/../.." && pwd)"

VERSION="v1.106.0-zh.28"
HEADROOM_TAG="v1.106.0-zh.7"
PACKAGE_DIR=""
HEADROOM_CACHE=""
OUT_DIR="${REPO}/dist"
SKIP_LITELLM=0
SKIP_HEADROOM=0
MAKE_TAR=1
VENDOR_DOCKER_TGZ=""
COMPOSE_BIN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --package) PACKAGE_DIR="$2"; shift 2 ;;
    --version) VERSION="$2"; shift 2 ;;
    --headroom-tag) HEADROOM_TAG="$2"; shift 2 ;;
    --headroom-cache) HEADROOM_CACHE="$2"; shift 2 ;;
    --out) OUT_DIR="$2"; shift 2 ;;
    --skip-litellm) SKIP_LITELLM=1; shift ;;
    --skip-headroom) SKIP_HEADROOM=1; shift ;;
    --no-tar) MAKE_TAR=0; shift ;;
    --vendor-docker-tgz) VENDOR_DOCKER_TGZ="$2"; shift 2 ;;
    --compose-bin) COMPOSE_BIN="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,4p' "${BASH_SOURCE[0]}" | sed 's/^# //'
      exit 0 ;;
    *) echo "未知参数: $1" >&2; exit 2 ;;
  esac
done

[[ -n "${PACKAGE_DIR}" ]] || { echo "缺少 --package（现有离线包目录，用于复用脚本与配置）" >&2; exit 2; }
[[ -d "${PACKAGE_DIR}" ]] || { echo "目录不存在: ${PACKAGE_DIR}" >&2; exit 2; }
if [[ "${SKIP_HEADROOM}" -eq 0 && -z "${HEADROOM_CACHE}" ]]; then
  echo "缺少 --headroom-cache（含 root/.cache/huggingface 的目录，可从现有 x86 headroom 镜像层解出）" >&2
  exit 2
fi

elf_machine() {
  od -An -tx1 -j18 -N2 "$1" | tr -d ' \n'
}

require_aarch64_elf() {
  local path="$1" label="$2" machine
  [[ -f "${path}" ]] || { echo "${label} 不存在: ${path}" >&2; exit 2; }
  machine="$(elf_machine "${path}" 2>/dev/null || true)"
  [[ "${machine}" == "b700" ]] || {
    echo "${label} 不是 aarch64 ELF（e_machine=${machine:-unknown}，aarch64 应为 b7 00）: ${path}" >&2
    exit 2
  }
}

require_aarch64_docker_tgz() {
  local tgz="$1" machine tmp
  [[ -f "${tgz}" ]] || { echo "vendor docker 静态包不存在: ${tgz}" >&2; exit 2; }
  tmp="$(mktemp -d)"
  tar -xzf "${tgz}" -C "${tmp}" 2>/dev/null || { rm -rf "${tmp}"; echo "无法解开 docker 静态包: ${tgz}" >&2; exit 2; }
  if [[ -f "${tmp}/docker/docker" ]]; then
    machine="$(elf_machine "${tmp}/docker/docker")"
  elif [[ -f "${tmp}/docker" ]]; then
    machine="$(elf_machine "${tmp}/docker")"
  else
    machine="missing"
  fi
  rm -rf "${tmp}"
  [[ "${machine}" == "b700" ]] || {
    echo "vendor docker 静态包内的 docker 不是 aarch64 ELF（e_machine=${machine:-unknown}）: ${tgz}" >&2
    exit 2
  }
}

[[ -n "${VENDOR_DOCKER_TGZ}" ]] && require_aarch64_docker_tgz "${VENDOR_DOCKER_TGZ}"
[[ -n "${COMPOSE_BIN}" ]] && require_aarch64_elf "${COMPOSE_BIN}" "docker-compose 二进制"

BUILD_DIR="${OUT_DIR}/litellm-offline-${VERSION}-arm64"
DEPS=(postgres:16.4 redis:7.4.2-alpine nginx:1.27-alpine prom/prometheus:v2.55.1)

require_arm() {
  local arch
  arch="$(docker image inspect --format '{{.Architecture}}' "$1" 2>/dev/null || echo missing)"
  [[ "${arch}" == "arm64" ]] || { echo "镜像 $1 架构为 ${arch}，不是 arm64" >&2; exit 1; }
}

if [[ "${SKIP_LITELLM}" -eq 0 ]]; then
  echo "==> 构建 litellm-zhcn:${VERSION} (linux/arm64)"
  docker buildx build --platform linux/arm64 --load \
    -t "litellm-zhcn:${VERSION}" \
    --build-arg "LITELLM_RELEASE_TAG=${VERSION}" \
    "${REPO}"
fi
require_arm "litellm-zhcn:${VERSION}"

if [[ "${SKIP_HEADROOM}" -eq 0 ]]; then
  echo "==> 构建 headroom-offline:${HEADROOM_TAG} (linux/arm64)"
  ctx="$(mktemp -d)"
  trap 'rm -rf "${ctx}"' EXIT
  cp -a "${HEADROOM_CACHE}/root" "${ctx}/"
  rm -f "${ctx}/root/.cache/.wh..wh..opq"
  cat > "${ctx}/Dockerfile" <<'EOF'
FROM ghcr.io/headroomlabs-ai/headroom:latest
USER root
COPY root/.cache/huggingface /root/.cache/huggingface
EOF
  docker buildx build --platform linux/arm64 --load -t "headroom-offline:${HEADROOM_TAG}" "${ctx}"
fi
require_arm "headroom-offline:${HEADROOM_TAG}"

echo "==> 拉取 arm64 依赖镜像"
for img in "${DEPS[@]}"; do
  docker pull --platform linux/arm64 "${img}"
done

echo "==> 组装 ${BUILD_DIR}"
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}/images" "${BUILD_DIR}/bin" "${BUILD_DIR}/certs" "${BUILD_DIR}/data"
for item in docker-compose.yml prometheus.yml .env.example uninstall.sh litellm install.sh scripts config assets README-安装说明.md; do
  [[ -e "${PACKAGE_DIR}/${item}" ]] && cp -a "${PACKAGE_DIR}/${item}" "${BUILD_DIR}/"
done
cp -a "${HERE}/run-local.sh" "${BUILD_DIR}/run-local.sh"
chmod +x "${BUILD_DIR}/run-local.sh"

install_vendor_docker() {
  local tgz="$1"
  mkdir -p "${BUILD_DIR}/vendor/docker"
  cp -a "${tgz}" "${BUILD_DIR}/vendor/docker/docker-26.0.1.tgz"
  for f in docker.service daemon.json; do
    [[ -f "${PACKAGE_DIR}/vendor/docker/${f}" ]] && cp -a "${PACKAGE_DIR}/vendor/docker/${f}" "${BUILD_DIR}/vendor/docker/${f}"
  done
}

install_compose_bin() {
  local bin="$1"
  mkdir -p "${BUILD_DIR}/bin"
  cp -a "${bin}" "${BUILD_DIR}/bin/docker-compose"
  chmod 755 "${BUILD_DIR}/bin/docker-compose"
}

if [[ -n "${VENDOR_DOCKER_TGZ}" ]]; then
  install_vendor_docker "${VENDOR_DOCKER_TGZ}"
else
  echo "提示: 未提供 --vendor-docker-tgz，目标机没装 Docker 时 install.sh 会拒绝自动安装（需手工准备 Docker）" >&2
fi

if [[ -n "${COMPOSE_BIN}" ]]; then
  install_compose_bin "${COMPOSE_BIN}"
else
  echo "提示: 未提供 --compose-bin，目标机没有 compose 插件时需要自行放置 bin/docker-compose" >&2
fi

sed -i '' 's/Linux x86_64/Linux aarch64 (ARM64)/' "${BUILD_DIR}/README-安装说明.md" 2>/dev/null || true
sed -i '' 's/docker-compose-linux-x86_64/docker-compose-linux-aarch64/' "${BUILD_DIR}/scripts/_lib.sh" 2>/dev/null || true

echo "==> 导出镜像"
docker save -o "${BUILD_DIR}/images/litellm-zhcn-${VERSION}.tar" "litellm-zhcn:${VERSION}"
docker save -o "${BUILD_DIR}/images/headroom-offline-${HEADROOM_TAG}.tar" "headroom-offline:${HEADROOM_TAG}"
docker save -o "${BUILD_DIR}/images/postgres-16.4.tar" postgres:16.4
docker save -o "${BUILD_DIR}/images/redis-7.4.2-alpine.tar" redis:7.4.2-alpine
docker save -o "${BUILD_DIR}/images/nginx-1.27-alpine.tar" nginx:1.27-alpine
docker save -o "${BUILD_DIR}/images/prometheus-v2.55.1.tar" prom/prometheus:v2.55.1

if [[ "${MAKE_TAR}" -eq 1 ]]; then
  echo "==> 打包"
  (cd "${OUT_DIR}" && tar -czf "$(basename "${BUILD_DIR}").tar.gz" "$(basename "${BUILD_DIR}")")
  echo "完成: ${OUT_DIR}/$(basename "${BUILD_DIR}").tar.gz"
else
  echo "完成: ${BUILD_DIR}"
fi
