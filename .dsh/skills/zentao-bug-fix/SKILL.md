---
name: zentao-bug-fix
description: 处理禅道（ZenTao）提交的产品 Bug：抓取并梳理清单、实机复现与定性、修复与回归测试、构建部署到测试环境、逐条验证、出安装包与验证报告、提交推送。适用于 AI 安全网关（LiteLLM 中文版）测试组反馈的批量问题处理。
whenToUse: 当用户提到「禅道提了新 bug」「测试组反馈」「批量修 bug」「复跑验证」「出安装包/验证报告」，或需要把一轮 Bug 从清单走到交付时使用。
---

# 禅道 Bug 闭环处理

本技能把「拉取 Bug → 列清单 → 复现 → 修复 → 测试 → 部署验证 → 出包 → 报告 → 提交」固化为可重复流程。完整说明见仓库文档 `Doc4zzy（文档for张忠源）/05-测试与质量/禅道Bug处理标准流程与Skill使用说明.md`，模板见本目录 `references/checklists.md`。

## 开始前

1. 确认工作目录是仓库根（`litellm`），先 `git status` / `git pull`，确认当前分支和 HEAD。
2. 确认测试机（112）在线：`ssh 112 'docker ps | grep litellm'`，记录当前镜像版本。
3. 确认禅道可访问（浏览器/Playwright 可达 `http://192.168.6.253:8081/zentao`）并已获取测试账号（不要把账号密码写进文档或提交）。
4. 确认本轮范围：是新一批 Bug，还是上一轮未关闭项；拿到上一轮清单文档，建立「已处理 ID 集合」用于 diff。

## 阶段一：拉取与梳理

1. 用 `qa/ai-gateway-playwright/tools/zentao_scrape45c.mjs` 抓取禅道产品 45 的 Bug 列表（注意脚本里的账号、密码、socks5 代理需按本机环境替换）。输出 `/tmp/bugs45c.json`。
2. 用 `qa/ai-gateway-playwright/tools/zentao_bugdetails.mjs` 抓详情（把脚本里的 ID 过滤改成 `>= 本批起始 ID`），输出 `/tmp/bug_details.json`。禅道详情经常为空，标题是主要线索，必须实机推断现象与期望。
3. 与上一轮清单对比，得到新增/重新激活的 ID 集合；新 Bug 按模块分组。
4. 产出清单文档（追加到 `Doc4zzy（文档for张忠源）/05-测试与质量/测试组Bug清单-*.md`），每条包含：ID、模块、标题、状态、推断表现、期望行为、处理结论。模板见 `references/checklists.md`。

## 阶段二：复现与定性

1. 用 Playwright 写一次 `recon` 脚本，把相关页面的按钮、输入框、下拉、页面文本 dump 到 `/tmp/recon_*.json`，先搞清交互路径，再写精准的复现脚本（`repro_*.mjs`）。
2. 每条 Bug 记录：当前现象（截图/页面文本/toast 文本）、触发路径、真实根因。不同标题背后的根因可能完全不同，不要按标题字面修改。
3. 区分「新失败」与「历史失败」：仓库前端有大量历史失败用例。需要跑基线对比时，用 `git worktree add /tmp/litellm-base <修改前 commit>`，软链 `node_modules`，同路径跑同一批用例，按失败文件 diff。只有基线没有的失败才算回归。
4. 判定问题类别：i18n 缺失键、文案硬编码、后端 premium/授权门控、结构化错误被吞、静默 return、Select 显示值与选项标签不一致、参数校验缺失、错误码未分类等。

## 阶段三：修复

修复要求（沿用本仓库约定）：

- 中文产品默认全中文：新增文案走 `i18n.t(key, { defaultValue: "English" })`，同时补 `src/locales/zh-CN.json` 与 `en.json`，两个文件的 key 集合必须一致（`src/lib/i18n.test.ts` 会校验）。
- 错误提示：不要直接透出技术异常；在组件层校验并给行内错误或 toast；后端结构化错误在前端映射为可操作的中文提示，必要时后端增加 `code` 字段。
- 校验缺失就补 zod/前端校验，静默 `return` 改成 `form.setError` + 阻止提交。
- 每个修复补回归测试：测试要在修复前失败、修复后通过，断言行为而不是结构；不把第三方事实写成断言。
- 前端改动后跑 `npx tsc --project tsconfig.production.json --noEmit`；后端改动跑对应 `pytest` 单测。
- 提交信息用 conventional commits，不写 emoji/致谢水印。

## 阶段四：测试

1. 先跑受影响目录的 vitest 子集，再至少跑一次相关全量（如 cost-optimization、users、guardrails、templates、usage）。
2. 与基线对比失败文件集合，确认「新增失败 = 0」。若无法解释某个失败，先查基线再下结论。
3. Python 改动跑 `tests/unit/...` 对应文件；`pytest` 输出在最终报告里引用，不把 pytest 当「截图证据」，UI 证据用实机截图/文本。

## 阶段五：构建与部署

1. `cd ui/litellm-dashboard && npm run build`，产物在 `out/`。
2. 后端改动只覆盖改动的 `.py` 文件，不要整包拷贝。
3. 在 112 上用叠层 Dockerfile 构建镜像：`FROM 当前镜像`，覆盖 `out/` 和改动的 `.py`，打新 tag；`docker-compose up -d --force-recreate litellm`。
4. 如果导入了新授权或改过 `docker-compose.yml`，注意 compose 的 `environment` 优先级高于 `.env`；复现时临时关授权门禁要在 compose 里改，测完恢复。
5. 健康检查：`curl -sk -o /dev/null -w "%{http_code}" https://127.0.0.1/ui/` 返回 200，容器 healthy。

## 阶段六：实机验证

1. 写一个 `verify_*.mjs`：登录 → 逐条操作 → 断言关键文本/状态 → 输出 JSON 到 `/tmp/verify_*.json`。
2. 每条 Bug 至少一条可复述的操作路径和结果；不能复现的（依赖授权、依赖真实上游）明确标注「部分验证」并写原因。
3. 测试数据（密钥/用户/模型/护栏）可保留在测试实例，但授权文件、账号密码等敏感信息不得进入仓库。

## 阶段七：出包与文档

1. 版本号按本轮升级：`grep -rln "zh.<旧版本>" deploy Doc4zzy | xargs sed -i 's/zh.<旧版本>/zh.<新版本>/g'`（`deploy/offline-package` 三件套 + 安装教程）。
2. 在 112 上：复制上一版解压目录 → `docker save 新镜像` → 替换 `images/` 下的 tar → sed 版本号 → `tar -czf` → `sha256sum` → 放 `/opt` 并解压，核对 compose 里的镜像 tag 和 sha。
3. 更新验证报告：本轮每条的状态、验证方式、新增测试、安装包 sha256 与镜像 ID。
4. 教程类文档改完要重新生成 docx/pdf（pandoc + LibreOffice convert），避免 markdown 与交付件不一致。
5. 本机 `~/Downloads` 同步安装包并核对 sha，保持交付一致。

## 阶段八：提交推送

1. 按主题拆分提交：代码修复、QA 工具、文档（清单+报告+版本号）、发布相关。
2. `git add` 指定路径，不要 `add -A`，避免把其他会话的 WIP（如 `deploy/arm64/`）带进去。
3. 推两个远端：`git push origin zayk-dev && git push gateway zayk-dev`，确认远端 SHA 与本地一致。
4. 收尾：旧镜像/旧包按需清理，测试实例状态（授权门禁、测试数据）在报告中说明。

## 完成标准

- 新 Bug 全部有结论：已修复/已核验/部分验证（附原因）。
- 前端 tsc 通过，受影响测试通过，基线对比无新增失败。
- 112 部署新版本并逐条验证，证据 JSON/截图存档。
- 新版本安装包已生成、sha256 已核对、报告已更新。
- 代码与文档已推送到两个远端。

## 常见坑

- 禅道详情常为空，只能靠标题 + 实机推断；不要等详情。
- 前端 i18n 双语文件 key 必须成对，否则 `i18n.test.ts` 失败。
- 基线仓库有大量历史失败用例：不对比基线就不能说「没有回归」。
- 镜像构建时间早于最后一个提交时要重建，否则交付物缺修复。
- compose `environment` 覆盖 `.env`，只改 `.env` 不生效。
- 登录接口只接受 form 编码；用 JSON curl 调试会得到看似密码错误的 401。
- 桌面/浏览器证据与命令输出都要留，报告里不能只有「已修复」三个字。
