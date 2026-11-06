# 中安云科 AI 安全网关 离线安装包（基于 LiteLLM 中文版）

版本：v1.106.0-zh.13，含 Docker 镜像、编排文件、一键安装与卸载脚本，目标机无需外网。

## 包内容

```
docker-compose.yml          litellm + headroom + postgres + redis + prometheus
.env.example                环境变量模板（安装脚本会自动生成 .env）
config/config.yaml          模型存 DB 模式的配置
prometheus.yml              指标采集配置
bin/docker-compose          独立的 compose 二进制，目标机无插件时使用
images/*.tar                全部镜像，docker load 即可
scripts/                    启动、停止、状态、日志、备份、恢复、初始化模型、启用压缩
install.sh                  安装向导（交互式）或参数化安装
litellm                     日常运维入口：启停、状态、日志、备份、卸载
uninstall.sh                一键卸载
```

`headroom` 是提示词压缩服务，镜像里已经预置压缩模型，目标机全程无需联网。

## 环境要求

Linux x86_64（systemd），root 权限，磁盘至少 20G，内存至少 6G。
安装包内含 Docker 26.0.1 引擎与 docker compose v2.29.7，目标机无需预装 Docker、无需外网，也不需要 Compose 插件。
如需使用目标机已有的 Docker，安装时加 --skip-docker。

## 安装

解压后用 root 执行安装脚本，不带参数即进入交互式向导：

```bash
tar xzf litellm-offline-v1.106.0-zh.13.tar.gz
cd litellm-offline-v1.106.0-zh.13
sudo ./install.sh
```

向导会依次询问并在有默认值时提示回车采用：

1. 安装目录（默认 `/opt/litellm`）与界面端口（默认 4000，被占用会提示更换）
2. 依赖端口（数据库、Redis、压缩服务，被占用会提示更换）
3. 管理界面用户名与密码，密码可自动生成也可自己设置
4. 上游模型 Key，留空则跳过模型初始化，装完在界面配置
5. 确认信息汇总
6. 执行安装，各阶段显示进度与耗时

安装完成后终端会打印访问地址、账号、密码和主密钥。

## 参数化安装

批量部署或脚本化场景可用参数跳过交互，全部参数见 `./install.sh -h`。常用组合：

```bash
sudo ./install.sh \
  --dir /opt/litellm \
  --port 4000 \
  --ui-username admin \
  --ui-password '自定义密码' \
  --deepseek-key sk-你的Key \
  --yes
```

可指定的参数包括安装目录、各类端口、项目名（同机多套部署时区分）、管理账号与密码、上游 Key、产品名与产品编码，以及跳过镜像加载、跳过 Docker 安装、跳过模型初始化、跳过压缩护栏等开关。

## 运维命令

安装目录下的 `litellm` 是统一运维入口：

```bash
cd /opt/litellm
./litellm status          查看服务状态与存活探针
./litellm start           启动全部服务
./litellm stop            停止全部服务
./litellm restart         重启全部服务
./litellm logs            查看网关日志
./litellm logs -f         持续跟踪日志
./litellm logs db         查看数据库日志
./litellm backup          备份数据库
./litellm restore <文件>   从备份恢复
./litellm info            显示访问地址与账号
./litellm version         显示版本
./litellm uninstall       卸载
```

首次打开管理界面会跳转到授权激活页，点“下载授权申请码”交给厂商签发，
再把签发的授权文件上传即可解锁。授权导入前健康检查可用，业务接口会返回 403。

已有 `.env` 时安装脚本会沿用其中的密码和密钥，不会重置数据。

安装后初始化模型也可以单独执行：

```bash
sudo /opt/litellm/scripts/seed-models.sh
```

## 提示词压缩（headroom）

安装包自带 headroom 压缩服务，`install.sh` 会在服务就绪后自动创建一条
`headroom-compression` 护栏并默认对所有请求生效，无需再手工配置。

- 服务只绑定 `127.0.0.1:8787`，仅本机可访问，供 litellm 容器调用
- 端口冲突时在 `.env` 里改 `HEADROOM_HOST_PORT`
- 服务之间用 `HEADROOM_PROXY_TOKEN` 鉴权，令牌由安装脚本随机生成，写在 `.env`
- 压缩服务异常时放行原请求（`fail_open`），不会影响正常流量
- 关闭压缩：`sudo /opt/litellm/scripts/setup-compression.sh` 只负责创建；如需停用，
  在管理界面「护栏」页把该护栏删除，或给 litellm 服务加 `--no-compression` 重装

检查与排障：

```bash
curl -s http://127.0.0.1:8787/livez          # 存活探针
docker logs litellm-headroom-1 --tail 50     # 压缩服务日志
# 单独启用护栏（幂等，已存在则跳过）
sudo /opt/litellm/scripts/setup-compression.sh
```

压缩省下的 token 会在管理界面「成本优化 → 总览」里作为 compression savings 展示。

注意压缩只作用于对话历史：系统消息、最后一条用户消息、以及 assistant 消息按
LiteLLM 的压缩策略受保护、保持原文，避免改写当前指令或模型自己的输出。所以单轮
请求没有可压缩内容，不会产生节省；多轮会话和带工具结果的请求才是主要受益场景。
验证时看这两处即可：

```bash
docker logs litellm-litellm-1 --tail 100 | grep "Headroom: compressed"
# 或管理界面 成本优化 → 总览，看 compression_saved_tokens
```

## 日常运维

```bash
/opt/litellm/scripts/status.sh     查看状态与存活探针
/opt/litellm/scripts/logs.sh       跟踪日志
/opt/litellm/scripts/restart.sh    重启
/opt/litellm/scripts/stop.sh       停止容器
/opt/litellm/scripts/stop.sh --down 停止并移除容器
/opt/litellm/scripts/backup-db.sh  备份数据库
/opt/litellm/scripts/restore-db.sh 恢复数据库
```

## 卸载

```bash
sudo ./uninstall.sh                  停止并移除容器，保留数据与镜像
sudo ./uninstall.sh --purge          同时删除 data 与 .env
sudo ./uninstall.sh --remove-images  同时删除全部镜像
```

## 模型与价格

初始化脚本会创建下列模型分组，价格按人民币计价（每 token）：

| 分组 | 输入 | 输出 | 缓存命中 |
| --- | --- | --- | --- |
| deepseek-v4-flash | 2.0e-06 | 8.0e-06 | 4.0e-08 |
| deepseek-flash（别名） | 2.0e-06 | 8.0e-06 | 4.0e-08 |
| deepseek-v4-pro | 9.0e-06 | 2.7e-05 | 3.0e-07 |
| deepseek-v4-flash-vision-exp | 2.0e-06 | 8.0e-06 | 4.0e-08 |

空闲时段半价，时间段按北京时间：工作日 18:00 到次日 09:00、12:00 到 14:00，周六周日全天。配置文件里的 `hours_utc` 使用 UTC 时间，`weekday_timezone` 为 `Asia/Shanghai`。

## 预算计数与 coordination Redis

安装脚本启动服务后会执行 `scripts/enable-coordination-redis.sh`，把 Litellm 的花费计数器接到内置 Redis 上。这一步不能省：没有 Redis 时，预算计数器重新播种会叠加数据库金额，鉴权侧花费会翻倍，用户额度还没用完就可能收到 429。脚本是幂等的，重复执行会直接跳过。手工执行方式：

```bash
sudo /opt/litellm/scripts/enable-coordination-redis.sh
```

从旧版本升级（数据库保留）时，配置保存在数据库里会自动沿用，脚本检测到已生效会跳过。如果换用全新的数据库，需要重新执行一次。

## 自定义 Logo

管理界面的 Logo 和浏览器标签图标使用 `assets/` 目录下的文件，打包时已内置：

```text
assets/logo.png      界面左上角 Logo（600x202）
assets/favicon.png   浏览器标签图标（128x128）
```

替换方式：把新图片覆盖这两个文件，然后执行 `bash /opt/litellm/scripts/restart.sh litellm` 重建容器即可生效。图片路径通过 docker-compose 的环境变量 `UI_LOGO_PATH` 和 `LITELLM_FAVICON_URL` 指定，目录以只读方式挂载到容器 `/app/assets`。

## 同机多实例

同一台机器上部署多套时，指定不同的项目名和端口即可，容器名、网络、数据目录互不干扰：

==> 安装到 /opt/litellm-b
==> 生成 .env
==> 加载镜像
==> docker load -i /opt/litellm-b/images/headroom-offline-v1.106.0-zh.7.tar
Loaded image: headroom-offline:v1.106.0-zh.7
==> docker load -i /opt/litellm-b/images/litellm-zhcn-v1.106.0-zh.13.tar
Loaded image: litellm-zhcn:v1.106.0-zh.13
==> docker load -i /opt/litellm-b/images/postgres-16.4.tar
Loaded image: postgres:16.4
==> docker load -i /opt/litellm-b/images/prometheus-v2.55.1.tar
Loaded image: prom/prometheus:v2.55.1
==> docker load -i /opt/litellm-b/images/redis-7.4.2-alpine.tar
Loaded image: redis:7.4.2-alpine
==> 已加载镜像列表（请与 docker-compose.yml 中 image 字段核对）
REPOSITORY                                                          TAG                            IMAGE ID       SIZE
litellm-zhcn                                                        v1.101.0-license-test-sc-aig   3c2e4b43dc98   1.58GB
litellm-zhcn                                                        v1.101.0-license-test          b1a80cf7128c   1.58GB
litellm-zhcn                                                        v1.106.0-zh.13                 14a714523904   1.51GB
litellm-zhcn                                                        v1.106.0-zh.11                 4219490f1492   1.51GB
litellm-zhcn                                                        v1.106.0-zh.10                 12ffcb3d4897   1.51GB
litellm-zhcn                                                        v1.106.0-zh.9                  1f72c992f4e1   1.49GB
litellm-zhcn                                                        v1.106.0-zh.8                  e5c4f6f74ee0   1.47GB
<none>                                                              <none>                         c1fb6e9d9d58   1.47GB
headroom-offline                                                    v1.106.0-zh.7                  200fd83e3a0b   1.27GB
litellm-zhcn                                                        v1.106.0-zh.7                  eac0ac37e824   1.47GB
<none>                                                              <none>                         5604e8fd8102   1.47GB
litellm-zhcn                                                        v1.106.0-zh.1                  c76637bd14ba   1.45GB
<none>                                                              <none>                         859500623e8c   6.27GB
<none>                                                              <none>                         5e1c47b8a651   131MB
<none>                                                              <none>                         6dc05a9c7b14   6.27GB
<none>                                                              <none>                         f1c2518967e8   2.97GB
<none>                                                              <none>                         ce1d0f3606a0   663MB
ghcr.io/headroomlabs-ai/headroom                                    latest                         17ef7765e687   671MB
cgr.dev/chainguard/wolfi-base                                       <none>                         071774ea60a7   16.7MB
registry.gitlab.com/gitlab-org/gitlab-runner/gitlab-runner-helper   x86_64-9cbf0074                c346e671eac5   101MB
registry.gitlab.com/gitlab-org/gitlab-runner/gitlab-runner-helper   x86_64-v19.3.0                 c346e671eac5   101MB
zerotrust-frontend                                                  latest                         2994e00833e5   63.9MB
zerotrust-backend                                                   latest                         3aaf76b1c830   285MB
<none>                                                              <none>                         533697c6ecd3   65.5MB
<none>                                                              <none>                         b97550bc364c   285MB
ziti-quickstart-amd64                                               latest                         d004cd30ed30   248MB
keycloak-local                                                      26.1.4                         4a2f8120b513   371MB
openziti/zac                                                        latest                         24deec8cfb4f   754MB
docker.m.daocloud.io/library/busybox                                latest                         c6348fa86ba0   4.45MB
==> 启动服务
ok: chown data/prometheus -> 65534:65534
ok: chown data/headroom -> 1000:1000
preflight ok: ROOT=/opt/litellm-b
---- compose ps ----
NAME                     IMAGE                            COMMAND                  SERVICE      CREATED         STATUS                                     PORTS
litellm-b-headroom-1     headroom-offline:v1.106.0-zh.7   "headroom proxy"         headroom     9 seconds ago   Created                                    
litellm-b-litellm-1      litellm-zhcn:v1.106.0-zh.13      "docker/prod_entrypo…"   litellm      7 seconds ago   Created                                    
litellm-b-prometheus-1   prom/prometheus:v2.55.1          "/bin/prometheus --c…"   prometheus   9 seconds ago   Up Less than a second                      0.0.0.0:9190->9090/tcp, [::]:9190->9090/tcp
litellm-b_db             postgres:16.4                    "docker-entrypoint.s…"   db           9 seconds ago   Up Less than a second (health: starting)   127.0.0.1:55432->5432/tcp
litellm-b_redis          redis:7.4.2-alpine               "docker-entrypoint.s…"   redis        9 seconds ago   Created                                    
---- litellm logs (tail) ----
---- db logs (tail) ----

## 升级与回滚

- 升级：停止服务，替换安装包里的镜像 tar 与 docker-compose.yml，执行 ==> docker load -i /root/pkgbuild/litellm-offline-v1.106.0-zh.13/images/headroom-offline-v1.106.0-zh.7.tar
Loaded image: headroom-offline:v1.106.0-zh.7
==> docker load -i /root/pkgbuild/litellm-offline-v1.106.0-zh.13/images/litellm-zhcn-v1.106.0-zh.13.tar
Loaded image: litellm-zhcn:v1.106.0-zh.13
==> docker load -i /root/pkgbuild/litellm-offline-v1.106.0-zh.13/images/postgres-16.4.tar
Loaded image: postgres:16.4
==> docker load -i /root/pkgbuild/litellm-offline-v1.106.0-zh.13/images/prometheus-v2.55.1.tar
Loaded image: prom/prometheus:v2.55.1
==> docker load -i /root/pkgbuild/litellm-offline-v1.106.0-zh.13/images/redis-7.4.2-alpine.tar
Loaded image: redis:7.4.2-alpine
==> 已加载镜像列表（请与 docker-compose.yml 中 image 字段核对）
REPOSITORY                                                          TAG                            IMAGE ID       SIZE
litellm-zhcn                                                        v1.101.0-license-test-sc-aig   3c2e4b43dc98   1.58GB
litellm-zhcn                                                        v1.101.0-license-test          b1a80cf7128c   1.58GB
litellm-zhcn                                                        v1.106.0-zh.13                 14a714523904   1.51GB
litellm-zhcn                                                        v1.106.0-zh.11                 4219490f1492   1.51GB
litellm-zhcn                                                        v1.106.0-zh.10                 12ffcb3d4897   1.51GB
litellm-zhcn                                                        v1.106.0-zh.9                  1f72c992f4e1   1.49GB
litellm-zhcn                                                        v1.106.0-zh.8                  e5c4f6f74ee0   1.47GB
<none>                                                              <none>                         c1fb6e9d9d58   1.47GB
headroom-offline                                                    v1.106.0-zh.7                  200fd83e3a0b   1.27GB
litellm-zhcn                                                        v1.106.0-zh.7                  eac0ac37e824   1.47GB
<none>                                                              <none>                         5604e8fd8102   1.47GB
litellm-zhcn                                                        v1.106.0-zh.1                  c76637bd14ba   1.45GB
<none>                                                              <none>                         859500623e8c   6.27GB
<none>                                                              <none>                         5e1c47b8a651   131MB
<none>                                                              <none>                         6dc05a9c7b14   6.27GB
<none>                                                              <none>                         f1c2518967e8   2.97GB
<none>                                                              <none>                         ce1d0f3606a0   663MB
ghcr.io/headroomlabs-ai/headroom                                    latest                         17ef7765e687   671MB
cgr.dev/chainguard/wolfi-base                                       <none>                         071774ea60a7   16.7MB
registry.gitlab.com/gitlab-org/gitlab-runner/gitlab-runner-helper   x86_64-9cbf0074                c346e671eac5   101MB
registry.gitlab.com/gitlab-org/gitlab-runner/gitlab-runner-helper   x86_64-v19.3.0                 c346e671eac5   101MB
zerotrust-frontend                                                  latest                         2994e00833e5   63.9MB
zerotrust-backend                                                   latest                         3aaf76b1c830   285MB
<none>                                                              <none>                         533697c6ecd3   65.5MB
<none>                                                              <none>                         b97550bc364c   285MB
ziti-quickstart-amd64                                               latest                         d004cd30ed30   248MB
keycloak-local                                                      26.1.4                         4a2f8120b513   371MB
openziti/zac                                                        latest                         24deec8cfb4f   754MB
docker.m.daocloud.io/library/busybox                                latest                         c6348fa86ba0   4.45MB 后 ---- compose ps ----
---- litellm logs (tail) ----
---- db logs (tail) ----
- 回滚：把 docker-compose.yml 里的 image 标签改回旧版本（镜像需仍在 REPOSITORY                                                          TAG                            IMAGE ID       CREATED         SIZE
litellm-zhcn                                                        v1.101.0-license-test-sc-aig   3c2e4b43dc98   5 hours ago     1.58GB
litellm-zhcn                                                        v1.101.0-license-test          b1a80cf7128c   3 days ago      1.58GB
litellm-zhcn                                                        v1.106.0-zh.13                 14a714523904   7 days ago      1.51GB
litellm-zhcn                                                        v1.106.0-zh.11                 4219490f1492   7 days ago      1.51GB
litellm-zhcn                                                        v1.106.0-zh.10                 12ffcb3d4897   8 days ago      1.51GB
litellm-zhcn                                                        v1.106.0-zh.9                  1f72c992f4e1   8 days ago      1.49GB
litellm-zhcn                                                        v1.106.0-zh.8                  e5c4f6f74ee0   8 days ago      1.47GB
<none>                                                              <none>                         c1fb6e9d9d58   8 days ago      1.47GB
headroom-offline                                                    v1.106.0-zh.7                  200fd83e3a0b   11 days ago     1.27GB
litellm-zhcn                                                        v1.106.0-zh.7                  eac0ac37e824   11 days ago     1.47GB
<none>                                                              <none>                         5604e8fd8102   11 days ago     1.47GB
litellm-zhcn                                                        v1.106.0-zh.1                  c76637bd14ba   13 days ago     1.45GB
<none>                                                              <none>                         859500623e8c   13 days ago     6.27GB
<none>                                                              <none>                         5e1c47b8a651   13 days ago     131MB
<none>                                                              <none>                         6dc05a9c7b14   13 days ago     6.27GB
<none>                                                              <none>                         f1c2518967e8   13 days ago     2.97GB
<none>                                                              <none>                         ce1d0f3606a0   13 days ago     663MB
ghcr.io/headroomlabs-ai/headroom                                    latest                         17ef7765e687   2 weeks ago     671MB
cgr.dev/chainguard/wolfi-base                                       <none>                         071774ea60a7   6 weeks ago     16.7MB
registry.gitlab.com/gitlab-org/gitlab-runner/gitlab-runner-helper   x86_64-9cbf0074                c346e671eac5   2 months ago    101MB
registry.gitlab.com/gitlab-org/gitlab-runner/gitlab-runner-helper   x86_64-v19.3.0                 c346e671eac5   2 months ago    101MB
zerotrust-frontend                                                  latest                         2994e00833e5   3 months ago    63.9MB
zerotrust-backend                                                   latest                         3aaf76b1c830   3 months ago    285MB
<none>                                                              <none>                         533697c6ecd3   3 months ago    65.5MB
<none>                                                              <none>                         b97550bc364c   3 months ago    285MB
ziti-quickstart-amd64                                               latest                         d004cd30ed30   3 months ago    248MB
keycloak-local                                                      26.1.4                         4a2f8120b513   3 months ago    371MB
openziti/zac                                                        latest                         24deec8cfb4f   4 months ago    754MB
docker.m.daocloud.io/library/busybox                                latest                         c6348fa86ba0   5 months ago    4.45MB
docker.m.daocloud.io/library/alpine                                 3.20                           bf8527eb54c3   6 months ago    7.81MB
ghcr.io/astral-sh/uv                                                <none>                         cb2ad5e30ff0   6 months ago    58.5MB
redis                                                               7.4.2-alpine                   8f5c54441eb9   22 months ago   41.4MB
prom/prometheus                                                     v2.55.1                        899b369f202e   24 months ago   290MB
postgres                                                            16.4                           6b14e73a48cf   2 years ago     432MB
docker.m.daocloud.io/rancher/mirrored-pause                         3.6                            6270bb605e12   5 years ago     683kB 中）后重启
- 数据在 ，升级前建议先 

## 内置 Docker 说明

目标机没有 Docker 时，`install.sh` 会自动执行 `scripts/install-docker.sh`：

- 使用 `vendor/docker/docker-26.0.1.tgz`（Docker 官方静态二进制包，x86_64）安装 docker、dockerd、containerd、runc 等到 `/usr/bin`
- 写入 `/etc/systemd/system/docker.service` 与 `/etc/docker/daemon.json`（systemd cgroup、overlay2、日志 100M×3），随后 enable 并启动服务
- 把包内 `bin/docker-compose` 注册为 CLI 插件，安装后 `docker compose version` 可用
- 已有 `/etc/docker/daemon.json` 或 docker.service 时保留原文件，不覆盖

目标机要求：x86_64、systemd、内核 3.10 以上（麒麟 V10、CentOS 7+、Ubuntu 18.04+ 均可）。
若目标机缺少 `iptables`、`systemd` 或内核不支持 overlay2，脚本会报错并提示手工处理。
