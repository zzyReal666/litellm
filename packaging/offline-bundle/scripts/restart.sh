#!/usr/bin/env bash
# 重启。用法: restart.sh [服务名...]  无参数则重启全部。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

if [[ $# -eq 0 ]]; then
  litellm_compose restart
else
  litellm_compose restart "$@"
fi
