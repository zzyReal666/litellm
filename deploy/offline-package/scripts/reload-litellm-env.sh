#!/usr/bin/env bash
# 修改 .env 中的 UI_USERNAME / UI_PASSWORD / LITELLM_MASTER_KEY 等后，必须重建 litellm 容器才会注入新环境变量。
# docker compose restart litellm 不会重读 .env。
# 使用 --no-deps 避免误重建 PostgreSQL。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"

litellm_compose up -d --no-deps --force-recreate litellm
echo "已强制重建 litellm。约 30–60 秒后探活: curl -fsS http://127.0.0.1:4000/health/liveliness"
