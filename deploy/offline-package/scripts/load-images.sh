#!/usr/bin/env bash
# 加载 /opt/litellm/images/*.tar 到本机 Docker（离线机执行）。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

shopt -s nullglob
files=("${ROOT}/images"/*.tar)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "error: 未找到 ${ROOT}/images/*.tar" >&2
  exit 1
fi

for f in "${files[@]}"; do
  echo "==> docker load -i ${f}"
  docker load -i "${f}"
done

echo "==> 已加载镜像列表（请与 docker-compose.yml 中 image 字段核对）"
docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}' | head -n 30
