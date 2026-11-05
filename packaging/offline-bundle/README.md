# 离线安装包组装说明

本目录是离线安装包的可版本化部分：安装向导、运维入口、编排文件、初始化脚本和安装说明。
镜像 tar、Docker 引擎包和 compose 二进制体积大，不进仓库，按下面的步骤在打包机上补齐。

## 目录对应关系

```
install.sh           交互式安装向导，也可用参数静默安装
litellm              安装后的运维入口（start/stop/restart/status/logs/backup/post-install/uninstall）
uninstall.sh         卸载脚本，--all 可回到未安装状态
docker-compose.yml   litellm + headroom + postgres + redis + prometheus 编排
prometheus.yml       指标采集配置
config/config.yaml   模型存 DB 模式的配置
scripts/             启动、停止、状态、日志、备份恢复、模型初始化、压缩护栏、Docker 离线安装
.env.example         环境变量模板，安装时自动生成 .env
README-安装说明.md   面向实施人员的安装与运维说明
```

## 补齐三类外部产物

1. `images/`：五个镜像的 `docker save` 结果，文件名与 compose 中的镜像名对应

```bash
docker save -o images/litellm-zhcn-v1.106.0-zh.15.tar litellm-zhcn:v1.106.0-zh.15
docker save -o images/headroom-offline-v1.106.0-zh.7.tar headroom-offline:v1.106.0-zh.7
docker save -o images/postgres-16.4.tar postgres:16.4
docker save -o images/redis-7.4.2-alpine.tar redis:7.4.2-alpine
docker save -o images/prometheus-v2.55.1.tar prom/prometheus:v2.55.1
```

2. `vendor/docker/docker-26.0.1.tgz`：Docker 官方静态二进制包，用于目标机没有 Docker 的场景

```text
下载地址 https://download.docker.com/linux/static/stable/x86_64/docker-26.0.1.tgz
SHA256   d362e648f6a7cccbe313145864d2316ab3114abb22c15a685427ebd5cb306078
```

3. `vendor/docker/docker.service`、`vendor/docker/daemon.json`：systemd 单元与守护进程配置，
`install-docker.sh` 在目标机缺少这两个文件时会直接报错，需要一并放入

4. `bin/docker-compose`：compose v2 静态二进制，目标机没有 compose 插件时使用。
从 Docker 官方 GitHub Release 下载对应版本后 `chmod +x`，并用官方发布的 checksums 文件校验

## 打包

在打包机上把这个目录复制成带版本号的目录名，补齐上面三类产物后整目录打包：

```bash
cp -a packaging/offline-bundle /tmp/litellm-offline-v1.106.0-zh.15
cd /tmp && tar -czf litellm-offline-v1.106.0-zh.15.tar.gz litellm-offline-v1.106.0-zh.15
sha256sum litellm-offline-v1.106.0-zh.15.tar.gz
```

产物约 1.3G，包含镜像 tar 与 Docker 引擎包

## 目标机安装

```bash
cd /opt
tar xzf litellm-offline-v1.106.0-zh.15.tar.gz
cd litellm-offline-v1.106.0-zh.15
./install.sh
```

不带参数进入交互式向导，会依次询问安装目录、端口、管理账号密码和上游 Key，
每一步显示进度和耗时。参数方式见 `./install.sh -h`。

## 授权相关说明

- 首次打开管理界面会跳转到授权激活页，下载申请码交给厂商签发后上传解锁
- 申请码在导入成功前保持不变，重复下载不会使已签发的授权文件失效
- 授权状态由原生库写入 `/etc/license.zayk`，编排文件已把它挂到 `data/license/license.zayk`，
  容器重建后授权仍然有效，这个挂载不能去掉
- 授权时间按 `Asia/Shanghai` 渲染，可用 `LITELLM_PRODUCT_TIMEZONE` 调整
- 未授权状态下管理接口会被拦截，模型初始化与压缩护栏需要导入授权后执行 `./litellm post-install`
