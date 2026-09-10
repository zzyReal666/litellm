# LiteLLM 项目学习文档（Doc4zzy）

> 本 README 用于个人持续维护，主要记录：
>
> - 项目整体结构和每个目录的作用
> - 环境准备、编译、启动、构建方法
> - 测试和常用开发命令
>
> 业务原理、请求链路、二次开发设计等，见 [`模型接入读码路线.md`](./模型接入读码路线.md)
>
> 官方架构文档的中文对照见 [`ARCHITECTURE_zh.md`](../ARCHITECTURE_zh.md)

---

## 项目信息

- 项目名称：LiteLLM AI Gateway
- 官方仓库：https://github.com/BerriAI/litellm
- 当前 fork：`git@github.com:zzyReal666/litellm.git`
- 当前分支：`learn-litellm`
- 当前版本：`1.101.0`
- 主要语言：
  - Python：核心 SDK + Proxy 后端
  - TypeScript/React：Admin UI
  - Rust：LiteLLM Rust 版实现
  - Go：Terraform Provider

---

## 根目录结构

| 目录/文件 | 作用 |
|---|---|
| `litellm/` | 核心 Python 源码：SDK、Router、Provider 适配、Proxy 服务 |
| `ui/` | Next.js 管理后台（Admin Dashboard） |
| `gateway/` | 独立“数据面”入口，只暴露 LLM 调用相关 API |
| `backend/` | 独立“管理面”入口，只暴露 Admin/管理 API |
| `enterprise/` | 企业版商业功能（闭源/商业授权） |
| `litellm-proxy-extras/` | Proxy 附加功能包，减轻主包体积 |
| `litellm-rust/` | Rust 版 LiteLLM，包含 SDK、Axum Gateway、PyO3 桥接 |
| `tests/` | 自动化测试 |
| `cookbook/` | 示例 Notebook、使用教程、第三方集成示例 |
| `examples/` | 示例配置文件等 |
| `docker/` | Dockerfile、容器启动脚本 |
| `db_scripts/` | 数据库运维 SQL/Python 脚本 |
| `migrations/` | 数据库迁移运行器 |
| `ci_cd/` | CI/CD 辅助脚本 |
| `scripts/` | 本地开发、质量检查、基准测试等脚本 |
| `helm/` | Kubernetes Helm Chart |
| `terraform/` | Terraform 模块和 Provider |
| `packaging/` | 发布打包相关，例如 Homebrew |
| `.github/` | GitHub Actions、Issue/PR 模板 |
| `.circleci/` | CircleCI 配置 |
| `.devcontainer/` | VS Code Dev Container 配置 |
| `.githooks/` | Git hooks |
| `.semgrep/` | Semgrep 静态安全扫描规则 |
| `.cargo/` | Rust/Cargo 相关配置 |
| `.git/` | Git 内部数据 |

### 根目录关键文件

| 文件 | 作用 |
|---|---|
| `README.md` | 官方项目说明 |
| `ARCHITECTURE.md` | 架构说明、请求链路、组件图 |
| `CLAUDE.md` | 给 AI 编码助手的开发规范 |
| `AGENTS.md` | Agent 使用入口，内容指向 CLAUDE.md |
| `CONTRIBUTING.md` | 贡献指南 |
| `pyproject.toml` | Python 项目配置和依赖 |
| `uv.lock` | uv 锁定依赖 |
| `Makefile` | 常用开发命令入口 |
| `schema.prisma` | Prisma/PostgreSQL 数据模型 |
| `model_prices_and_context_window.json` | 模型价格和上下文窗口数据 |
| `docker-compose.yml` | Docker Compose 编排 |
| `Dockerfile` | 主镜像构建 |
| `.env.example` | 环境变量示例 |

---

## `litellm/` 核心目录说明

| 路径 | 作用 |
|---|---|
| `litellm/main.py` | SDK 入口：`completion()`、`acompletion()`、`embedding()` 等 |
| `litellm/utils.py` | 通用工具、响应对象、Provider 解析 |
| `litellm/router.py` | 多模型路由、重试、fallback、负载均衡 |
| `litellm/llms/` | 各 LLM 供应商适配层，如 OpenAI、Anthropic、Bedrock、Gemini |
| `litellm/proxy/` | FastAPI Proxy 服务、认证、管理 API、Hooks、Guardrails |
| `litellm/router_strategy/` | 路由策略：最低延迟、最低成本、复杂度路由等 |
| `litellm/router_utils/` | 路由辅助逻辑：健康检查、冷却、限流、预检查 |
| `litellm/caching/` | 缓存：内存、Redis、DualCache |
| `litellm/integrations/` | 第三方观测/日志集成：Langfuse、Prometheus、OTel 等 |
| `litellm/models/` | Pydantic 数据模型 |
| `litellm/repositories/` | 数据访问层 Repository |
| `litellm/types/` | 类型定义 |
| `litellm/litellm_core_utils/` | 核心工具：日志、流式、token 计算、异常映射等 |
| `litellm/secret_managers/` | Secret 管理：AWS、Azure、Vault 等 |
| `litellm/a2a_protocol/` | A2A Agent 协议支持 |
| `litellm/experimental_mcp_client/` | MCP Client 实验功能 |
| `litellm/responses/` | OpenAI Responses API 支持 |
| `litellm/rerank_api/` | Rerank API 支持 |
| `litellm/assistants/` | Assistants API 支持 |
| `litellm/batches/` | Batch API 支持 |
| `litellm/files/` | 文件上传/管理支持 |
| `litellm/fine_tuning/` | Fine-tuning 支持 |
| `litellm/images/` | 图像生成支持 |
| `litellm/realtime_api/` | Realtime API 支持 |
| `litellm/vector_stores/` | 向量存储支持 |
| `litellm/search/` | 搜索工具支持 |
| `litellm/rag/` | RAG 支持 |
| `litellm/rust_bridge/` | Python 调用 Rust 的桥接 |
| `litellm/skills/` | Skills 相关能力 |

---

## 本地环境准备

### 必需工具

- Python：`>=3.10, <3.15`
- uv：依赖管理工具
- Node.js：`>=24.14.1`，Admin UI 需要
- Docker：用于本地启动 PostgreSQL，或完整 Compose 部署
- git

### 当前本机已确认

- macOS Apple Silicon
- Python 3.14.3
- uv 0.11.13
- Docker + Compose 已安装
- Node 默认版本低于要求，运行 UI 前需要切到 Node 24.19.0

### 第一次准备

```bash
# 进入项目
cd /Users/zhangzhongyuan/IdeaProjects/litellm

# 切到学习分支
git switch learn-litellm

# 准备环境变量
cp .env.example .env
```

编辑 `.env`：

- 设置 `LITELLM_MASTER_KEY=sk-1234`
- `DATABASE_URL` 在宿主机直跑时改为 `localhost:5432`
- 填入需要的模型 API Key

安装依赖：

```bash
make bootstrap
```

> `make bootstrap` 会执行 uv sync、生成 Prisma Client、安装 UI 依赖等，首次较慢。

---

## 启动项目

### 1. 只启动 PostgreSQL

```bash
docker compose up -d db
docker compose ps
```

### 2. 启动 LiteLLM Proxy（单体）

```bash
uv run python litellm/proxy/proxy_cli.py \
  --config litellm/proxy/dev_config.yaml \
  --detailed_debug \
  --reload \
  --use_v2_migration_resolver
```

验证：

```bash
curl http://localhost:4000/health/liveliness
curl http://localhost:4000/v1/models \
  -H "Authorization: Bearer sk-1234"
```

### 3. 启动 Admin UI

```bash
cd ui/litellm-dashboard
nvm use 24.19.0
npm run dev
```

浏览器访问：

```text
http://localhost:3000
```

登录 Key 使用：

```text
sk-1234
```

### 4. Docker Compose 完整启动

```bash
docker compose up --build -d
```

主要服务：

- `litellm`：Proxy，端口 4000
- `db`：PostgreSQL
- `prometheus`：监控

> 注意：如果本地已经手动启动 Proxy，不要再同时启动 Compose 里的 `litellm`，会占用 4000 端口。

### 5. 组件化启动（gateway/backend/ui）

```bash
# 数据面 Gateway，端口 4000
uvicorn gateway.main:app --host 0.0.0.0 --port 4000

# 管理面 Backend，端口 4001
uvicorn backend.main:app --host 0.0.0.0 --port 4001
```

UI 生产构建后由 Nginx/静态服务托管，开发模式仍然使用：

```bash
cd ui/litellm-dashboard && npm run dev
```

### 6. 直接使用 Python SDK

不经过 Proxy，直接在 Python 中调用：

```bash
uv run python
```

```python
import litellm

response = litellm.completion(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
print(response)
```

---

## 构建相关

### Python 构建

```bash
uv sync --frozen
```

### Docker 镜像构建

```bash
docker build -t litellm-local .
```

### Admin UI 构建

```bash
cd ui/litellm-dashboard
npm ci
npm run build
```

### Rust 构建

```bash
cd litellm-rust
cargo build --workspace
cargo fmt --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

### Prisma Client 生成

```bash
uv run prisma generate
```

### Prisma 迁移

```bash
uv run prisma migrate dev
```

---

## 测试

### Python 单元测试

```bash
# 测试目录和 litellm 源码目录基本镜像
uv run pytest tests/test_litellm/xxx -x -q
```

例如：

```bash
uv run pytest tests/test_litellm/test_utils.py -x -q
```

### Proxy 单测

```bash
uv run pytest tests/proxy_unit_tests -x -q
```

### UI 测试

```bash
cd ui/litellm-dashboard
npm run test:unit
```

### 代码质量检查

```bash
make lint
make check
```

### 常用 Make 命令

```bash
make help
make install-dev
make bootstrap
make format
make lint
make check
make test-unit
```

---

## 生产环境信息（备查）

当前公司内部生产服务器 `192.168.7.99` 运行：

- LiteLLM 镜像：`ghcr.io/berriai/litellm:v1.83.14-stable.patch.3`
- PostgreSQL：`postgres:16.4`
- Prometheus：`prom/prometheus:v2.55.1`

对比：

- 本地 upstream 最新 staging 版本：`1.101.0`
- 生产版本相对落后，升级需走测试环境验证
- 当前 upstream 存在 i18n/中文 PR #30499，但尚未合并

---

## 学习与二开路线简版

1. 跑通本地 Proxy + Admin UI
2. 直接用 Python SDK 调模型
3. 通过 Proxy 调用，并观察详细日志
4. 阅读 `ARCHITECTURE.md`
5. 跟踪请求链路：
   - `litellm/proxy/proxy_server.py`
   - `litellm/proxy/auth/`
   - `litellm/router.py`
   - `litellm/main.py`
   - `litellm/llms/<provider>/`
6. 修改 UI 做中文化等二开实验
7. 补测试并跑 `make lint`

模型接入方向按 [`模型接入读码路线.md`](./模型接入读码路线.md) 的 0 到 8 步走，每一步都有对应的文件和过关标准

---

## 更新记录

| 日期 | 更新内容 |
|---|---|
| 2026-09-04 | 初始化 README，补充根目录作用、核心目录说明、启动/构建/测试命令 |
| 2026-09-10 | 新增模型接入读码路线文档，并在此处建立索引 |
| 2026-09-10 | 收录根目录 `ARCHITECTURE_zh.md`，README 内补充索引 |
