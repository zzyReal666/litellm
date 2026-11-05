#!/usr/bin/env bash
# 可选：批量替换 docker-compose.yml 中的镜像标签（升级离线包时使用）。
# 用法: LITELLM_TAG=v1.83.0-stable POSTGRES_TAG=16.5 PROM_TAG=v2.55.2 bash scripts/update-compose-refs.sh
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

compose="${ROOT}/docker-compose.yml"
cp -a "${compose}" "${compose}.bak.$(date +%Y%m%d%H%M%S)"

: "${LITELLM_TAG:?设置 LITELLM_TAG=例如 v1.83.0-stable}"
: "${POSTGRES_TAG:?设置 POSTGRES_TAG=例如 16.5}"
: "${PROM_TAG:?设置 PROM_TAG=例如 v2.55.2}"

sed -i \
  -e "s|image: ghcr.io/berriai/litellm:.*|image: ghcr.io/berriai/litellm:${LITELLM_TAG}|" \
  -e "s|image: postgres:.*|image: postgres:${POSTGRES_TAG}|" \
  -e "s|image: prom/prometheus:.*|image: prom/prometheus:${PROM_TAG}|" \
  "${compose}"

echo "已更新 ${compose}，请同步修改 IMAGES.env 与 VERSIONS.txt，并在联网机重新 export-images.sh。"
