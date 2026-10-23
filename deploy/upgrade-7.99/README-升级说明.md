# 7.99 升级到 v1.106.0-zh.7（含 headroom 压缩服务）

## 升级结果（2026-10-23 18:11）

已按本文件流程完成升级，摘要：

```
old_image=litellm-zhcn:v1.100.0-zh.5
new_image=litellm-zhcn:v1.106.0-zh.7
headroom_image=headroom-offline:v1.106.0-zh.7
downtime_seconds=88
readiness=200
ui=200
models=7
keys=196
migrations=213
guardrail_created=1
smoke_http=200
```

- 迁移 161 -> 213 条，2 条 spend log 索引由迁移脚本并发创建完成
- 真实模型调用返回 200，spend log 正常写入
- 多轮对话验证压缩生效（headroom 收到压缩请求，prompt_tokens 明显下降）
- db 容器在升级前已用带 `seccomp=unconfined` 的配置重建过一次，升级脚本未再动它
- redis 因 compose 配置变化被重建，健康

## 现状

- 目标版本：`litellm-zhcn:v1.106.0-zh.7` + `headroom-offline:v1.106.0-zh.7`
- 数据库：36G，其中 `LiteLLM_SpendLogs` 36G（堆 1G，索引 128M，其余是 TOAST）
- 主机：Kylin V10，内核 4.19，Docker 26.0.1，无 compose 插件（用 `/opt/litellm/bin/docker-compose`），机械盘
- 规模：7 个模型、196 个密钥、7 个团队、约 35 万条 spend log

## 准备好的内容（/opt/litellm-upgrade）

```
pkg/litellm-offline-v1.106.0-zh.7.tar.gz   离线包（1.2G，sha256 见 pkg.sha256）
backup/cfg-pre-zh7-<ts>/                  配置类数据备份（目录格式，18M，排除大表 SpendLogs）
backup/schema-pre-zh7.sql                 升级前完整结构快照
backup/prisma-migrations-data.sql          迁移记录表数据
backup/files-<ts>/                        .env、compose、config、scripts、基线数量快照
compose/docker-compose.zh7.yml             升级用 compose（含 seccomp 例外）
compose/docker-compose.rollback.yml        回滚用 compose
scripts/upgrade-to-zh7.sh                  升级脚本（已执行）
scripts/rollback-to-zh5.sh                 回滚脚本
state/current-upgrade.txt                  升级结果
state/upgrade-inflight.txt                 升级现场目录指针
images/                                    两个新镜像，已 docker load
```

镜像已 `docker load` 完成，升级窗口内不需要再导镜像。

## 为什么没有做全量数据库备份

最初按全量 `pg_dump` 准备，实测不可行：

- 库 36G，但 spend log 的 TOAST 内容解压后逻辑数据约 88G；`pg_dump -j4 -Z1` 跑到 15G 时进度约 57%，推算最终 dump 20G 以上
- 根分区可用空间 29G，机械盘上按 1-2MB/s 增长，全量 dump 预计 2.5 小时以上，且随时可能写满磁盘
- 因此改为：配置类数据备份（模型、密钥、团队、预算、护栏、设置等，18M）+ 结构快照 + 部署文件快照

对应的回滚策略改为**镜像切换**，不还原数据库。

## 回滚（数据不丢）

```bash
bash /opt/litellm-upgrade/scripts/rollback-to-zh5.sh
```

脚本只做：停 litellm/headroom -> 还原升级前的 compose/.env/config（自动补 seccomp 例外）-> 用 zh.5 镜像启动 -> 校验 readiness/UI/模型/密钥数量。耗时约 1-3 分钟，升级后写入的 spend log 和配置全部保留。

可行性依据（升级前演练）：把 1.100 的真实结构恢复到临时库，用新镜像迁移到 213 条后，再用旧镜像 zh.5 启动，结果正常：`161 migrations found in prisma/migrations / No pending migrations to apply`，`readiness=200`、`/ui/` 200、应用正常启动。升级本身的 52 条迁移全部是新增表/新增列，没有删列、改类型或数据改写，旧代码可以跑在新结构上。

## 已知问题

**1. 这台机器的 Docker 新建容器必须带 `seccomp=unconfined`**

Docker 26.0.1 配 Kylin 自带的 `docker-runc 1.0.0-rc3`，新建容器会报 `OCI runtime create failed: starting container process caused "permission denied"`，加 `--security-opt seccomp=unconfined` 正常。所有 compose 文件都预置了这条例外（litellm、headroom、db、redis、prometheus）。建议后续升级 docker-runc 或换成配套的 Docker 版本，之后可以去掉。

**2. budget_alerts 报 Missing SLACK_WEBHOOK_URL**

litellm 日志里会周期性出现 `budget_alerts` 的 ValueError，缺少 Slack webhook 配置。升级前就存在，与本次升级无关。如果不需要 Slack 告警，可以在管理界面关掉预算告警或补上 webhook。

**3. headroom 压缩只作用于对话历史**

系统消息、最后一条用户消息、assistant 消息按 LiteLLM 策略保留原文；单轮请求不会有压缩收益，多轮和带工具结果的请求才是主要场景。

## 升级后核验清单

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4000/health/readiness
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8787/livez
docker ps --format '{{.Names}} {{.Image}} {{.Status}}'
docker exec litellm_db psql -U $POSTGRES_USER -d $POSTGRES_DB -At -c 'select count(*) from "LiteLLM_ProxyModelTable";'
```

管理界面「护栏」应能看到 `headroom-compression`，「成本优化 -> 总览」会出现 compression savings。
