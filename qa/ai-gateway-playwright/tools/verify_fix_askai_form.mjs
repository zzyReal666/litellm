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
await page.waitForTimeout(1500);

// 1) 询问 AI：选择 deepseek-v4-flash
await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /询问 AI/ }).first().click();
await page.waitForTimeout(1500);
// 选择模型下拉
const combo = page.locator('[data-slot="combobox-input"], input[placeholder*="选择模型"], input[placeholder*="Select a model"]').first();
out.model_input_found = await combo.count();
if (await combo.count()) {
  await combo.click();
  await page.waitForTimeout(600);
  const option = page.getByText("deepseek-v4-flash", { exact: true }).first();
  if (await option.count()) { await option.click(); } else { await page.keyboard.press("Escape"); }
  await page.waitForTimeout(400);
}
out.selected_model_text = (await page.evaluate(() => document.body.innerText)).match(/deepseek-v4-flash/)?.[0] ?? null;
const ta = page.locator("textarea").last();
if (await ta.count()) await ta.fill("哪个模型花费最多？");
await page.getByRole("button", { name: /发送/ }).first().click();
await page.waitForTimeout(25000);
const askText = await text();
out.ask_answer_present = /哪个模型花费最多/.test(askText) && !/错误：/.test(askText);
out.ask_error = askText.match(/错误：[^\n]{0,120}/)?.[0] ?? null;
out.ask_tail = askText.slice(-600);

// 2) 内部用户编辑：TPM 非法 → 中文提示
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const menus = page.getByLabel(/打开用户操作菜单/);
if (await menus.count() > 1) { await menus.nth(1).click(); await page.waitForTimeout(600); }
await page.getByText(/^编辑用户$/).first().click();
await page.waitForTimeout(2200);
const tpm = page.getByRole("spinbutton", { name: /TPM/i }).first();
out.tpm_found = await tpm.count();
if (await tpm.count()) { await tpm.fill("-1"); }
await page.getByRole("button", { name: /保存更改/ }).first().click();
await page.waitForTimeout(1800);
out.rate_limit_chinese = /请输入非负整数/.test(await text());
out.rate_limit_english = /Enter a non-negative whole number/.test(await text());
out.rate_limit_tail = (await text()).slice(-500);

// 3) 表单提交不再弹「正在发起 API 调用」：创建预算流程
await page.goto(`${BASE}/ui/budgets`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const createBtn = page.getByRole("button", { name: /创建预算|新建预算|添加预算/ }).first();
out.budget_create_btn = await createBtn.count();
let budgetToastSeq = [];
if (await createBtn.count()) {
  await createBtn.click(); await page.waitForTimeout(1200);
  const nameInput = page.locator('input[name="budget_id"], input[placeholder*="budget"]').first();
  if (await nameInput.count()) await nameInput.fill("verify-budget-1");
  const maxInput = page.getByRole("spinbutton").first();
  if (await maxInput.count()) await maxInput.fill("10");
  const save = page.getByRole("button", { name: /创建|保存/ }).first();
  if (await save.count()) { await save.click(); await page.waitForTimeout(2500); }
  budgetToastSeq = await toasts();
}
out.budget_toasts = budgetToastSeq;
out.budget_no_progress_toast = !budgetToastSeq.some((t) => /正在发起|正在调用 API|Making API Call/.test(t));
fs.writeFileSync("/tmp/verify_fix_askai_form.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
await browser.close();
