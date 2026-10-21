#!/usr/bin/env bash
# 查看 compose 状态与 LiteLLM 存活探针（宿主机 curl）。
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_lib.sh"
litellm_load_env

litellm_compose ps -a

echo ""
echo "==> 宿主机探活 http://127.0.0.1:4000/health/liveliness"
if curl -fsS "http://127.0.0.1:4000/health/liveliness" >/dev/null; then
  echo "ok: liveliness"
else
  echo "fail: 无法访问 127.0.0.1:4000（容器未就绪或未映射到本机）" >&2
  echo "---- litellm 最近日志 ----"
  litellm_compose logs --tail=40 litellm || true
  exit 1
fi
