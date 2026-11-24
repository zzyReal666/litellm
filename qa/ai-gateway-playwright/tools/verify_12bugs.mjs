import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read","clipboard-write"] });
const page = await ctx.newPage();
const res = {};
const txt = async () => (await page.evaluate(() => document.body.innerText));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);

// 1 模型更新时间
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(2800);
const modelText = await txt();
const rowDate = modelText.match(/2026-1\d-\d\d/);
res.model_updated_at_shown = Boolean(rowDate);

// 5 成本优化自动路由标签
await page.goto(`${BASE}/ui/cost-optimization`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
let costText = await txt();
res.costopt_has_english_all_auto_routers = /All auto-routers/.test(costText);
res.costopt_has_chinese_all_auto_routers = /全部自动路由/.test(costText);

// 10 Headroom 压缩护栏表单
const compTab = page.getByText(/提示词压缩|Headroom/).first();
if (await compTab.count()) { await compTab.click(); await page.waitForTimeout(2000); costText = await txt(); }
res.headroom_tab_found = /Headroom|提示词压缩/.test(costText);
const hForm = page.locator("form").filter({ hasText: /Headroom|压缩/ }).first();
if (await hForm.count()) {
  const inputs = hForm.locator("input");
  const n = await inputs.count();
  if (n >= 2) {
    await inputs.nth(0).fill("");
    await inputs.nth(1).fill("x".repeat(600));
    const submit = hForm.locator('button[type="submit"]').first();
    if (await submit.count()) { await submit.click(); await page.waitForTimeout(1200); }
    res.headroom_validation_text = (await txt()).match(/必填|不能超过|请输入|无效|格式|URL/)?.[0] ?? null;
  }
}
res.headroom_no_horizontal_overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 4);

// 11/12 护栏
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const gOp = page.getByRole("button", { name: "打开护栏操作" }).first();
if (await gOp.count()) {
  await gOp.click(); await page.waitForTimeout(600);
  const del = page.getByText(/^删除$/).first();
  if (await del.count()) { await del.click(); await page.waitForTimeout(800); res.guardrail_delete_dialog = (await txt()).match(/确定删除护栏[^\n]*|Are you sure[^\n]*/)?.[0] ?? null; }
}
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const guardName = page.getByText("bugtest-guard", { exact: true }).first();
if (await guardName.count()) {
  await guardName.click(); await page.waitForTimeout(2500);
  const save = page.getByRole("button", { name: /保存|Save|更新/ }).first();
  if (await save.count()) { await save.click(); await page.waitForTimeout(1500); res.guardrail_no_changes_toast = (await txt()).match(/未检测到更改|No changes detected/)?.[0] ?? null; }
}

// 3/4/6/7/8/9 虚拟密钥
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
// 7 可选设置占位符
await page.getByRole("button", { name: /新建密钥/ }).first().click();
await page.waitForTimeout(1500);
const opt = page.getByText("可选设置", { exact: true }).first();
if (await opt.count()) { await opt.click(); await page.waitForTimeout(1000); }
res.keydialog_placeholders = await page.evaluate(() => Array.from(document.querySelectorAll("input,textarea")).map(e => e.getAttribute("placeholder")).filter(Boolean));
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
// 3 重复别名错误（不填团队时仍会产生明确提示或成功；记录 toast）
await page.getByRole("button", { name: /新建密钥/ }).first().click();
await page.waitForTimeout(1200);
const aliasInput = page.locator('input').filter({ has: page.locator('xpath=.') }).first();
await page.keyboard.press("Escape");
// 4/6 密钥详情
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2500);
const regen = page.getByRole("button", { name: /重新生成密钥/ }).first();
res.regenerate_present = await regen.count();
res.regenerate_disabled = (await regen.count()) ? await regen.isDisabled() : null;
if (await regen.count()) { await regen.click(); await page.waitForTimeout(1200); res.regenerate_dialog_text = (await txt()).slice(-500); await page.keyboard.press("Escape"); await page.waitForTimeout(1000); }
// 9 复制
const copyBtns = page.locator('button[aria-label*="复制"]');
res.copy_buttons = await copyBtns.count();
if (res.copy_buttons) {
  const values = [];
  for (let i = 0; i < Math.min(3, res.copy_buttons); i++) {
    await copyBtns.nth(i).click(); await page.waitForTimeout(400);
    values.push(await page.evaluate(() => navigator.clipboard.readText().catch(() => "READ_FAILED")));
  }
  res.copy_values = values;
}
// 8 节省 tab
const savingsTab = page.getByRole("tab", { name: "节省", exact: true }).first();
if (await savingsTab.count()) {
  await savingsTab.click(); await page.waitForTimeout(2500);
  res.savings_english = (await txt()).match(/Savings|Running total|Compression|Cumulative|Per day|No usage recorded/g) ?? [];
}

// 2 删除用户刷新
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const userRow = page.getByText("bugfix-check@example.com").first();
if (await userRow.count()) {
  await userRow.click(); await page.waitForTimeout(2500);
  const delBtn = page.getByRole("button", { name: /删除用户|Delete User|删除/ }).first();
  res.user_delete_btn = await delBtn.count();
  if (await delBtn.count()) {
    await delBtn.click(); await page.waitForTimeout(900);
    const confirm = page.getByRole("button", { name: /^删除$|确认删除/ }).first();
    if (await confirm.count()) { await confirm.click(); await page.waitForTimeout(2500); }
    res.user_still_visible_after_delete = await page.getByText("bugfix-check@example.com").count() > 0;
  }
}
fs.writeFileSync("/tmp/verify_12bugs.json", JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1).slice(0, 3500));
await browser.close();
