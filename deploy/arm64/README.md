# ARM64 离线包

Linux aarch64（麒麟、统信、Ubuntu ARM、鲲鹏/飞腾）与 Apple Silicon macOS 本机联调用。

## 与 x86 包的差异

脚本、compose、配置、安装向导完全共用，只有三类二进制要换成 aarch64：

1. `images/*.tar`：六个镜像全部重新构建/拉取为 linux/arm64
2. `vendor/docker/docker-26.0.1.tgz`：换成 aarch64 静态包（文件名不变，install-docker.sh 无需改）
3. `bin/docker-compose`：换成 docker-compose-linux-aarch64

x86 包里的 `scripts/_lib.sh` 提示语提到 x86_64，组装脚本会替换成 aarch64。

## 外部二进制（校验值）

```text
docker-26.0.1.tgz   https://download.docker.com/linux/static/stable/aarch64/docker-26.0.1.tgz
                    66780916 字节  sha256 ffb86d77f764e544fe9dcf1c10296adebb7db01a18a5b9bce7d41814d852a8f4
                    2026-11-24 下载；Docker 在该目录不发布 .sha256 旁文件，校验值按下载结果记录

docker-compose      https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-aarch64
                    62095190 字节  sha256 6e9fbd5daa20dca5d7d89145081ae8155d68ef2928b497d9f85b54fe0f9dbb2c
                    与同版本 checksums.txt 中的 linux-aarch64 行一致
```

## 构建

前置：能访问 ghcr.io、docker.io、pkg 源；headroom 压缩模型缓存从现有 x86 包的 headroom 镜像层解出。

```bash
docker load -i litellm-offline-v1.106.0-zh.28/images/headroom-offline-v1.106.0-zh.7.tar
layer=$(docker image inspect --format '{{index .RootFS.Layers 11}}' headroom-offline:v1.106.0-zh.7)
docker save headroom-offline:v1.106.0-zh.7 -o /tmp/headroom.tar
# 或者直接从包的 tar 里解最后一层：blobs/sha256/6d1513c0...
```

解出的目录应包含 `root/.cache/huggingface`（kompress-v2-base ONNX 模型，约 574MB，与架构无关），然后：

```bash
cd deploy/arm64
./build-bundle.sh \
  --package ../offline-package \
  --headroom-cache /tmp/headroom-cache \
  --out ~/Downloads
```

产物：`dist/litellm-offline-v1.106.0-zh.28-arm64.tar.gz`（`dist/` 已在 .gitignore 内）

2026-11-24 在本机（Apple M5，OrbStack arm64）产出的包：
1.5G，sha256 `9332c278849c272362cfa59ac3eebd6abe3002f5088564500498d659a63e7c8d`，
六个镜像与 `bin/docker-compose`、`vendor/docker/docker-26.0.1.tgz` 均为 aarch64

## macOS 本机验证

`run-local.sh` 会一并放进包根目录，解包后直接跑（不需要 root、systemd，也不动 /opt）：

```bash
tar xzf litellm-offline-v1.106.0-zh.28-arm64.tar.gz
cd litellm-offline-v1.106.0-zh.28-arm64
./run-local.sh            # 加载镜像、生成 .env、docker compose up、等就绪
./run-local.sh --down     # 停止，数据保留
```

默认端口：界面 4000、Postgres 55432、Redis 56379、headroom 8787、Prometheus 9190，可用环境变量覆盖。

## 授权组件（当前 ARM 包不可用的根因）

`litellm/proxy/product_license/lib/liblicense.so` 是厂商提供的 x86-64 预编译库，没有源码。在 aarch64 上加载失败：

```text
加载原生授权库失败: .../liblicense.so: cannot open shared object file: No such file or directory
```

`/product/license/info` 返回 `auth_state=component_unavailable`、`native_available=false`，
业务接口始终 403，也导不进授权文件。也就是说 ARM 包能跑起来、能开机、能进管理界面，
但无法完成产品授权，只能用于联调和演示。

要变成可交付的 ARM 包，需要向授权库厂商要 aarch64 版本的 `liblicense.so`，
放到 `litellm/proxy/product_license/lib/liblicense.so` 再重编镜像。若厂商提供的是独立文件名，
可用 `LITELLM_PRODUCT_LICENSE_LIB` 指定路径。本机联调可临时用
`LITELLM_PRODUCT_LICENSE_ENABLED=False` 跳过授权检查验证业务链路。

## 已知限制

- 业务接口在导入授权文件前返回 403，这是产品授权设计，不是部署故障
- macOS 上跑的是 arm64 容器，不需要 Rosetta；`images/` 里的 tar 换了架构就不能和 x86 包混用
- 目标机没装 Docker 时需要 aarch64 的 `vendor/docker/docker-26.0.1.tgz` 与 `bin/docker-compose`。
  `build-bundle.sh` 可用 `--vendor-docker-tgz`、`--compose-bin` 传入，脚本校验 ELF 机器类型为 aarch64
  （`e_machine=0xb7`）后才放进包里；不提供时装包会提示目标机需预装 Docker
