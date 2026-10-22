# LiteLLM 中文版离线安装包

版本：v1.106.0-zh.1，含 Docker 镜像、编排文件、一键安装与卸载脚本，目标机无需外网。

## 包内容

```
docker-compose.yml          litellm + postgres + redis + prometheus
.env.example                环境变量模板（安装脚本会自动生成 .env）
config/config.yaml          模型存 DB 模式的配置
prometheus.yml              指标采集配置
bin/docker-compose          独立的 compose 二进制，目标机无插件时使用
images/*.tar                全部镜像，docker load 即可
scripts/                    启动、停止、状态、日志、备份、恢复、初始化模型
install.sh                  一键安装部署
uninstall.sh                一键卸载
```

## 环境要求

Linux x86_64，Docker 20 以上，root 权限，磁盘至少 10G，内存至少 4G。目标机不需要 Docker Compose 插件。

## 安装

```bash
tar xzf litellm-offline-v1.106.0-zh.1.tar.gz
cd litellm-offline-v1.106.0-zh.1
sudo ./install.sh --deepseek-key sk-你的DeepSeekKey
```

默认安装到 `/opt/litellm`，监听 4000 端口。安装完成后终端会输出管理界面地址、管理员账号和主密钥。

常用参数：

```
--dir /opt/litellm       安装目录
--port 4000              监听端口
--prometheus-port 9090   Prometheus 端口
--ui-username admin      管理员用户名
--deepseek-key <key>     DeepSeek Key，用于初始化 4 个模型分组
--deepseek-key-2 <key>   第二组上游 Key，flash/pro 双 deployment 分流
--skip-images            跳过镜像加载（镜像已在目标机）
--no-seed                不初始化模型
```

已有 `.env` 时安装脚本会沿用其中的密码和密钥，不会重置数据。

安装后初始化模型也可以单独执行：

```bash
sudo /opt/litellm/scripts/seed-models.sh
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
