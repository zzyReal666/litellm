# 7.99 升级到 v1.106.0-zh.7（含 headroom 压缩服务）

## 现状与目标

- 当前部署：`litellm-zhcn:v1.100.0-zh.5`，LiteLLM 1.100.0，库内 161 条迁移，Postgres 16.4
- 目标版本：`litellm-zhcn:v1.106.0-zh.7` + `headroom-offline:v1.106.0-zh.7`
- 数据库：36G，其中 `LiteLLM_SpendLogs` 表 36G（堆 1G，索引 128M，其余是 TOAST）
- 主机：Kylin V10，内核 4.19，Docker 26.0.1，无 compose 插件（用 `/opt/litellm/bin/docker-compose`），磁盘为机械盘
- 现有规模：7 个模型、196 个密钥、7 个团队、约 35 万条 spend log

## 已经准备好的东西

全部在 `/opt/litellm-upgrade/`：

```
pkg/litellm-offline-v1.106.0-zh.7.tar.gz   离线包（1.2G，sha256 见 pkg.sha256）
images/                                    已 docker load 完成的两个新镜像
backup/pg-pre-zh7-<ts>/                   升级前 pg_dump（目录格式，-j4 -Z1）
backup/files-<ts>/                         .env、compose、config、scripts 快照
backup/schema-pre-zh7.sql                  仅结构，演练迁移用
backup/prisma-migrations-data.sql          迁移记录表数据，演练迁移用
backup/baseline.txt                        升级前的模型/密钥/团队/迁移数量基线
compose/docker-compose.zh7.yml             升级用 compose（见“已知问题”）
compose/docker-compose.rollback.yml        回滚用 compose
scripts/upgrade-to-zh7.sh                  升级脚本
scripts/rollback-to-zh5.sh                 回滚脚本
state/                                     升级/回滚运行状态
```

镜像已经 `docker load` 完成，升级窗口里不需要再导镜像。

## 演练结果（不影响生产库）

在 `litellm_migtest` 临时库上用 1.100 的真实结构 + 迁移记录做过完整演练：

- 新镜像执行迁移：52 条待应用迁移全部成功，161 -> 213 条，表 89 -> 109 张
- 新镜像对着迁移后的库启动：`readiness=200`、`/ui/` 返回 200（22KB 中文界面）、日志无报错，启动约 100 秒
- 两条 spend log 索引（`LiteLLM_SpendLogs_api_key_startTime_idx`、`LiteLLM_SpendLogs_litellm_call_id_idx`）由迁移脚本并发创建，演练中秒级完成；生产上只扫 1G 堆，预计各 1-2 分钟
- 演练库已删除

预计停机窗口 **3-6 分钟**（迁移 + 索引 + 启动）。

## 升级步骤

建议在低峰期执行，先确认 4000 端口当前正常：

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4000/health/readiness
```

然后一条命令：

```bash
bash /opt/litellm-upgrade/scripts/upgrade-to-zh7.sh
```

脚本会依次：校验备份和镜像 -> 记录现场 -> 替换 compose/脚本/assets -> 补 `.env` 两个 headroom 键 -> 只重建 litellm 与 headroom（db、redis、prometheus 不动）-> 等就绪 -> 创建压缩护栏 -> 校验模型/密钥数量 -> 真实模型调用冒烟 -> 写状态文件。任何一步失败会打印回滚命令，`AUTO_ROLLBACK=1` 时自动回滚。

升级过程可以另开窗口观察：

```bash
/opt/litellm/bin/docker-compose -f /opt/litellm/docker-compose.yml logs -f litellm | grep -E "migration|index|Uvicorn|Application startup"
```

升级后验证清单：

- `curl -s http://127.0.0.1:4000/health/readiness` 返回 200
- `http://192.168.7.99:4000/ui/` 能打开且是中文界面
- 模型、密钥、团队数量与备份基线一致
- 管理界面「护栏」里能看到 `headroom-compression`，「成本优化 -> 总览」出现 compression savings
- 真实调用一次，确认 spend log 正常写入
- `docker logs litellm-headroom-1` 无报错

## 回滚

回滚只影响 litellm/headroom，db、redis、prometheus 不动。

```bash
# 完整回滚（默认，恢复升级前数据库备份，精确还原，停机 20-40 分钟）
bash /opt/litellm-upgrade/scripts/rollback-to-zh5.sh --restore-db

# 快速回滚（只切回旧镜像，1-3 分钟；旧代码跑在新结构上，需要尽快补做完整回滚）
bash /opt/litellm-upgrade/scripts/rollback-to-zh5.sh --fast

# 自动：先试快速回滚，起不来再走完整回滚
bash /opt/litellm-upgrade/scripts/rollback-to-zh5.sh --auto
```

建议触发回滚的情况：迁移报错、启动超过 10 分钟不就绪、readiness/UI 异常、模型或密钥数量对不上、真实调用连续失败、出现大量 5xx。

注意：完整回滚恢复到 pg_dump 那个时点，dump 之后写入的 spend log 会丢失。dump 拍摄于 2026-10-23 16:34，实际升级前可以重拍一份更近的备份（同一条 pg_dump 命令，见下面“重拍备份”）。

## 已知问题与注意事项

**1. 这台机器的 Docker 新建容器必须带 `seccomp=unconfined`**

主机是 Docker 26.0.1 配 Kylin 自带的 `docker-runc 1.0.0-rc3`，新建容器会报 `OCI runtime create failed: starting container process caused "permission denied"`，加 `--security-opt seccomp=unconfined` 可以正常创建，已有容器重启不受影响。所以升级和回滚用的 compose 都预置了这条例外。这是主机环境问题，不是镜像问题，建议后续安排升级 docker-runc 或换成配套的 Docker 版本，之后可以去掉这条例外。

**2. 只重建 litellm 和 headroom**

升级脚本用 `up -d litellm headroom`，不碰 db、redis、prometheus。如果哪天这些容器需要重建，同样会遇到上面的 seccomp 问题，需要给它们也加例外。

**3. headroom 首次启动**

镜像里已经预置压缩模型，断网也能用，端口只绑 `127.0.0.1:8787`，用 `.env` 里新生成的 `HEADROOM_PROXY_TOKEN` 鉴权。压缩只作用于对话历史（系统消息、最后一条用户消息、assistant 消息按 LiteLLM 策略保留原文），单轮请求不会有压缩收益。

**4. 未演练的部分**

数据库备份的完整性用 `pg_restore -l` 和抽样表还原验证过，但“完整还原 36G 库”没有在副本上跑过（磁盘空间不够）。所以完整回滚的耗时是估算值，第一次真用会偏保守。

## 重拍备份（可选）

如果担心 dump 太旧，可以在升级前重跑一次，命令：

```bash
cd /opt/litellm && source .env
TS=$(date +%Y%m%d-%H%M%S)
docker run --rm --security-opt seccomp=unconfined --network container:litellm_db \
  -e PGPASSWORD="$POSTGRES_PASSWORD" -v /opt/litellm-upgrade/backup:/dump postgres:16.4 \
  pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fd -j4 -Z1 -f "/dump/pg-pre-zh7-$TS"
printf 'BACKUP_DIR=/opt/litellm-upgrade/backup/pg-pre-zh7-%s\n' "$TS" > /opt/litellm-upgrade/backup/LATEST.txt
```

机械盘上大约 25-35 分钟，期间服务正常，不需要停机。
