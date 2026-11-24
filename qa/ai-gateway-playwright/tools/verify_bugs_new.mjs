import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
const toasts = () => page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1200);

// 1616/1617 成本优化
await page.goto(`${BASE}/ui/cost-optimization`, { waitUntil: "networkidle" });
await page.waitForTimeout(2800);
const cost = await text();
out.cost_banner_removed = !cost.includes("这是一个实验性面板") && !cost.includes("有反馈");
out.cost_english_leftovers = (cost.match(/\b(Savings|Running total|Compression|Cumulative|Per day|No usage recorded|Have feedback|This is an experimental dashboard)\b/g) || []);
// 1616 压缩页企业版提示
await page.getByRole("tab", { name: /提示词压缩/ }).first().click();
await page.waitForTimeout(2000);
const comp = await text();
out.comp_enterprise_notice_removed = !comp.includes("企业版功能") && !comp.includes("试用密钥");
// 1615 重复护栏
const nameInput = page.locator("form input").first();
if (await nameInput.count()) {
  await nameInput.fill("bugtest-compress");
  const apiInput = page.locator("form form input, form input").nth(1);
  if (await apiInput.count()) await apiInput.fill("http://headroom:8000");
  const add = page.getByRole("button", { name: /添加护栏/ }).first();
  if (await add.count()) { await add.click(); await page.waitForTimeout(2000); }
  const t = await text();
  out.duplicate_guardrail_friendly = /已存在|already exists/i.test(t);
  out.duplicate_toasts = await toasts();
}

// 1619 模型设置
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /^模型设置$/ }).first().click();
await page.waitForTimeout(1500);
const setText = await text();
out.model_settings_managed_hint = /config\.yaml/.test(setText);
const sw = page.getByRole("switch").first();
if (await sw.count()) out.model_switch_aria_disabled = await sw.getAttribute("aria-disabled");
const saveBtn = page.getByRole("button", { name: /保存设置/ }).first();
if (await saveBtn.count()) out.model_save_disabled = await saveBtn.isDisabled();
await page.keyboard.press("Escape");

// 1620/1621/1622 默认用户设置与用户编辑
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByRole("tab", { name: /默认用户设置/ }).first().click();
await page.waitForTimeout(1500);
const defView = await text();
out.default_settings_role_chinese = /内部用户|内部查看者|管理员/.test(defView) && !/Internal User \(/.test(defView);
await page.getByRole("button", { name: /编辑设置/ }).first().click();
await page.waitForTimeout(1200);
const defEdit = await text();
out.default_edit_budget_trigger_chinese = !/No reset/.test(defEdit);
await page.getByRole("button", { name: /取消/ }).first().click().catch(() => {});
// 用户编辑：超长邮箱 / 无效元数据
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const menus = page.getByLabel(/打开用户操作菜单/);
if (await menus.count() > 1) { await menus.nth(1).click(); await page.waitForTimeout(600); }
const editUser = page.getByText(/^编辑用户$/).first();
if (await editUser.count()) {
  await editUser.click(); await page.waitForTimeout(2200);
  const formText = await text();
  out.user_edit_labels_chinese = /全局代理角色|个人模型/.test(formText) && !/Global Proxy Role/.test(formText);
  const email = page.getByRole("textbox", { name: "邮箱" }).first();
  if (await email.count()) { await email.fill("x".repeat(255)); }
  const metadata = page.locator("textarea").first();
  if (await metadata.count()) await metadata.fill("{invalid json");
  await page.getByRole("button", { name: /保存更改/ }).first().click();
  await page.waitForTimeout(2000);
  const t = await text();
  out.user_edit_errors = { emailOrAlias: /字符|characters or fewer/.test(t), metadata: /元数据必须|Metadata must be valid JSON/.test(t) };
  out.user_edit_toasts = await toasts();
}

// 1623 密钥编辑校验
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2000);
const settingsTab = page.getByRole("tab", { name: /^设置$/ }).first();
if (await settingsTab.count()) { await settingsTab.click(); await page.waitForTimeout(1000); }
const keyEdit = page.getByRole("button", { name: /编辑设置/ }).first();
if (await keyEdit.count()) {
  await keyEdit.click(); await page.waitForTimeout(1500);
  const metadata = page.locator("textarea").first();
  if (await metadata.count()) await metadata.fill("{bad json");
  await page.getByRole("button", { name: /保存更改/ }).first().click();
  await page.waitForTimeout(2000);
  out.key_edit_validation = /元数据必须是合法的 JSON|Metadata must be a valid JSON object/.test(await text());
}

// 1624 询问 AI
await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const ask = page.getByRole("button", { name: /询问 AI/ }).first();
if (await ask.count()) { await ask.click(); await page.waitForTimeout(1200); }
const input = page.locator('textarea[placeholder*="询问"], input[placeholder*="询问"]').last();
if (await input.count()) { await input.fill("哪个模型花费最多？"); await page.getByRole("button", { name: /发送/ }).first().click(); await page.waitForTimeout(15000); }
const usageText = await text();
out.ask_ai_friendly = /未配置 API Key|没有配置 API Key/.test(usageText);
out.ask_ai_english_internal_error = /An internal error occurred/.test(usageText);

fs.writeFileSync("/tmp/verify_bugs_new.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 3500));
await browser.close();
