#!/usr/bin/env bash
# 跟踪日志。用法: logs.sh [compose logs 参数...]  默认跟踪全部服务。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

if [[ $# -eq 0 ]]; then
  litellm_compose logs -f --tail=200
else
  litellm_compose logs -f --tail=200 "$@"
fi
