#!/usr/bin/env bash
# 停止服务。用法: stop.sh [--down]
#   默认: docker compose stop（保留容器）
#   --down: docker compose down（移除容器与默认网络，不删 bind 数据目录）
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

if [[ "${1:-}" == "--down" ]]; then
  litellm_compose down
else
  litellm_compose stop
fi
