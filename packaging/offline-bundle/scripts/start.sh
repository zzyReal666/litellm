#!/usr/bin/env bash
# 启动全部服务（docker compose up -d）。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"
litellm_load_env

if ! litellm_compose up -d; then
  echo "---- compose ps ----"
  litellm_compose ps -a || true
  echo "---- litellm logs (tail) ----"
  litellm_compose logs --tail=80 litellm || true
  echo "---- db logs (tail) ----"
  litellm_compose logs --tail=80 db || true
  exit 1
fi

litellm_compose ps
