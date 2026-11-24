# 模板与检查清单

本文件是 `zentao-bug-fix` 技能的参考模板，按阶段复制使用。

## 1. Bug 清单条目模板

```markdown
### <ID> <模块>：<标题>

表现：<实机看到的现象，含文案/状态/报错>
期望：<产品应有行为>
根因：<代码位置或机制，例如 i18n key 缺失、后端 premium 门控、错误被吞>
处理：<修复方式，一句话>
验证：<实机路径 + 结果>
状态：已修复 / 已核验 / 部分验证（原因）/ 待确认
```

## 2. 清单文档结构模板

```markdown
# 测试组 Bug 清单（<日期>）

版本 v<X.Y>
日期 <YYYY-MM-DD>
来源 禅道「<产品名>」产品（ID <N>）
范围 <总数> 条，<激活数> 激活，<已解决数> 已解决

## 一、说明
## 二、汇总（模块 / 条数 / 激活 / 已解决）
## 三、<模块 A>（n）
### 条目...
## 四、<模块 B>（n）
### 条目...
## 附：已处理 ID 集合（供下一轮 diff）
```

## 3. 复现记录模板（写入 `/tmp/repro_<主题>.json`）

```json
{
  "bug": "<ID>",
  "version": "v<镜像 tag>",
  "path": "<进入路径：/ui/... → 点击 → 输入>",
  "observed": "<页面文本 / toast / 截图文件>",
  "expected": "<期望行为>",
  "root_cause": "<文件:行 或 机制>",
  "is_regression": false,
  "baseline_failed": false
}
```

## 4. Playwright 验证脚本骨架

```js
import { chromium } from "playwright-core";
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]),
);

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });

await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });

const results = {};
// 每条 Bug：goto → 操作 → 断言 → results.<id> = { pass, evidence }
fs.writeFileSync("/tmp/verify_<批次>.json", JSON.stringify(results, null, 1));
await browser.close();
```

要点：

- 登录等待用「URL 不含 /login」而不是 `login=success`。
- toast 用 `[data-sonner-toast]` 收集，页面文本用 `document.body.innerText`。
- 定位输入框优先 `getByRole("textbox", { name: "<标签>" })`，避免 `getByLabel` 命中复制按钮。
- 校验失败断言行内错误文本；后端错误断言中文可操作提示。

## 5. 基线对比命令

```bash
# 修改前基线
git worktree add -q /tmp/litellm-base <baseline-commit>
ln -sfn "$PWD/ui/litellm-dashboard/node_modules" /tmp/litellm-base/ui/litellm-dashboard/node_modules

# 当前分支跑同一批用例
cd ui/litellm-dashboard && npx vitest run <paths> --reporter=json --outputFile=/tmp/vitest_cur.json
cd /tmp/litellm-base/ui/litellm-dashboard && npx vitest run <paths> --reporter=json --outputFile=/tmp/vitest_base.json

# 按失败文件 diff，仅当前新增的才算回归
python3 - <<'PY'
import json
def failed(path):
    d = json.load(open(path)); out = set()
    for f in d.get("testResults", []):
        if any(a.get("status") == "failed" for a in f.get("assertionResults", [])):
            name = f.get("name", ""); i = name.find("/src/")
            out.add(name[i + 1:] if i >= 0 else name)
    return out
cur, base = failed("/tmp/vitest_cur.json"), failed("/tmp/vitest_base.json")
print("new failures:", sorted(cur - base))
print("pre-existing:", len(base & cur))
PY
```

## 6. 验证报告模板

```markdown
## <批次>：<范围说明>

| 编号 | 结论 | 验证方式 |
| --- | --- | --- |
| <ID> <标题> | 已修复，<一句话> | <实机路径 + 结果> |

### 测试与交付
- 新增回归测试：<列表>
- 前端相关用例：<n> 通过；基线对比新增失败 0
- 安装包：<路径>，sha256 `<hash>`，镜像 ID `<id>`
- 测试实例：<版本 / 授权状态 / 遗留说明>
```

## 7. 出包脚本骨架（在测试机执行）

```bash
#!/bin/bash
set -euo pipefail
SRC=/opt/litellm-offline-v<旧版本>
NEW=litellm-offline-v<新版本>
mkdir -p /root/pkgbuild && cd /root/pkgbuild
cp -a "$SRC" "$NEW"
rm -f "$NEW/images/litellm-zhcn-v<旧版本>.tar"
docker save litellm-zhcn:v<新版本> -o "$NEW/images/litellm-zhcn-v<新版本>.tar"
sed -i "s/v<旧版本>/v<新版本>/g" "$NEW/install.sh" "$NEW/docker-compose.yml" "$NEW/README-安装说明.md"
tar -czf "/root/$NEW.tar.gz" "$NEW"
sha256sum "/root/$NEW.tar.gz" > "/root/$NEW.sha256"
cp -f "/root/$NEW.tar.gz" "/root/$NEW.sha256" /opt/
rm -rf "/opt/$NEW" && tar -xzf "/opt/$NEW.tar.gz" -C /opt
echo PACKAGE_DONE
```

## 8. 完成检查清单（逐项勾选）

- [ ] 新 Bug 已全部有结论（已修复 / 已核验 / 部分验证附原因）
- [ ] 根因写清楚，不是只写「已修复」
- [ ] 前端 `tsc` 通过
- [ ] 受影响用例通过，且与基线对比新增失败为 0
- [ ] 每条修复有回归测试（修复前会失败）
- [ ] 镜像已重建并部署，容器 healthy，`/ui/` 200
- [ ] 实机逐条验证，证据 JSON/截图落盘
- [ ] 版本号只升不降，安装包 sha256 与报告一致
- [ ] 教程 docx/pdf 已重新生成
- [ ] 提交按主题拆分，未混入其他会话 WIP
- [ ] `origin` 与 `gateway` 远端 SHA 与本地一致
- [ ] 敏感信息（账号、密码、授权文件、token）未进仓库和文档

## 9. 常用命令速查

```bash
# 环境与状态
ssh 112 'docker ps | grep litellm; docker logs --since 5m litellm-litellm-1 | tail -50'
curl -sk -o /dev/null -w '%{http_code}\n' https://192.168.7.112/ui/

# 前端
cd ui/litellm-dashboard
npx tsc --project tsconfig.production.json --noEmit
npx vitest run <path> --reporter=dot
npm run build

# 后端
.venv/bin/python -m pytest tests/unit/<path> -q

# 镜像与部署（在 112）
docker build -q -t litellm-zhcn:v<新版本> /root/uibuild
cd /opt/litellm && ./bin/docker-compose up -d --force-recreate litellm

# 提交
git add <主题相关路径>
git commit -m "fix: <一句话>"
git push origin zayk-dev && git push gateway zayk-dev
```
