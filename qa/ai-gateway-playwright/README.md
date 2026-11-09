# 中安云科 AI 安全网关 UI 自动化测试

基于 Playwright 的管理界面回归用例，覆盖 AI 网关、访问控制、可观测性、设置四大部分共 9 个功能页，可直接交给测试组执行。

## 目录结构

```
ai-gateway-playwright/
├── playwright.config.js      # 运行配置（报告、重试、超时、录像开关）
├── package.json
├── .env                      # 本地凭据（不入库），格式见 .env.example
└── scripts/
    ├── helpers.js            # 登录、页面跳转、Toast 等待、唯一命名等公共能力
    ├── 冒烟.spec.js           # 登录 + 九个页面可访问
    ├── 模型端点管理.spec.js
    ├── 压缩护栏管理.spec.js
    ├── 虚拟密钥管理.spec.js
    ├── 团队管理.spec.js
    ├── 内部用户管理.spec.js
    ├── 用量.spec.js
    ├── 日志.spec.js
    ├── 成本优化.spec.js
    └── 授权管理.spec.js
```

## 环境要求

Node.js 22.x（见 `.node-version`），系统安装 Google Chrome，或使用 Playwright 自带 chromium。

```bash
npm install
```

使用自带 chromium 时还需下载浏览器并指定 `AIG_BROWSER=chromium`：

```bash
npx playwright install chromium
```

## 配置被测环境

复制 `.env.example` 为 `.env`，填写被测环境地址与管理员账号：

```
AIG_BASE_URL=http://192.168.7.112:4000
AIG_USER=admin@sinocipher.local
AIG_PASS=安装时设置的管理员密码
```

管理员密码在安装目录的 `.env` 里（`UI_USERNAME` / `UI_PASSWORD`），或用 `litellm create-admin` 新建账号。

注意：被测环境必须已导入授权，未授权时界面只会跳转到授权激活页，所有用例都会失败。

## 运行

```bash
# 全部用例
npm test

# 单个功能
npx playwright test scripts/虚拟密钥管理.spec.js

# 带界面调试
npx playwright test --headed

# 只跑冒烟
npx playwright test scripts/冒烟.spec.js
```

默认使用系统 Chrome。若用 Playwright chromium：

```bash
AIG_BROWSER=chromium npm test
```

## 报告与产物

执行完自动生成 `playwright-report/`，用以下命令打开：

```bash
npx playwright show-report
```

失败用例会保留截图和 trace（`test-results/`），可用 `npx playwright show-trace <trace.zip>` 回放。

默认不录屏。需要录像时先安装 ffmpeg 再开启开关：

```bash
npx playwright install ffmpeg
AIG_VIDEO=on npm test
```

ffmpeg 无法写入系统缓存目录时，可指定工作区内路径：

```bash
PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers npx playwright install ffmpeg
PLAYWRIGHT_BROWSERS_PATH=$PWD/.pw-browsers AIG_VIDEO=on npm test
```

## 用例清单

| 部分 | 功能 | 文件 | 覆盖点 |
| --- | --- | --- | --- |
| AI 网关 | 模型端点管理 | 模型端点管理.spec.js | 模型列表、搜索、新增模型、详情、删除 |
| AI 网关 | 压缩护栏管理 | 压缩护栏管理.spec.js | 护栏列表、headroom 压缩护栏存在性、新增护栏、删除 |
| AI 网关 | 虚拟密钥管理 | 虚拟密钥管理.spec.js | 密钥列表、创建密钥、查看密钥、删除 |
| 访问控制 | 团队管理 | 团队管理.spec.js | 团队列表、搜索、创建团队、详情、删除 |
| 访问控制 | 内部用户管理 | 内部用户管理.spec.js | 用户列表、搜索、邀请用户、用户详情 |
| 可观测性 | 用量 | 用量.spec.js | 概览卡片、各维度 tab 切换、日期范围、导出入口 |
| 可观测性 | 日志 | 日志.spec.js | 请求日志表格、时间范围、筛选、其他日志 tab |
| 可观测性 | 成本优化 | 成本优化.spec.js | 总览与三个子 tab、累计/按天切换 |
| 设置 | 授权管理 | 授权管理.spec.js | 授权状态、产品名、机器码、有效期、授权时间为北京时间 |

## 测试数据约定

创建类用例使用 `uniqueName()` 生成带时间戳的唯一名称，用例结束删除，正常情况下不留残留。若中途失败，可能残留形如 `自动化测试_20261106173000` 的团队、密钥或模型条目，手工清理即可。

## 常见问题

登录后跳回登录页：多为密码错误或账号被删除，用 `litellm create-admin` 重建账号。

页面停在授权激活页：环境未导入授权，先上传授权文件。

元素找不到：界面升级后文案或结构可能变化，用 `npx playwright codegen <地址>` 重新取选择器，再更新对应 spec。

用例偶发超时：界面图表接口较慢，可调大 `playwright.config.js` 中的 `timeout` 与 `expect.timeout`。

## 维护约定

新增功能用例时在 `scripts/` 下建同名中文 spec，复用 `helpers.js` 的 `login`、`gotoRoute`、`waitForToast`、`uniqueName`；每个用例用 `test.step` 分段描述步骤，创建的数据必须在用例内清理。
