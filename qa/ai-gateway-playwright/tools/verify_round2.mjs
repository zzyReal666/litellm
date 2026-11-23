import { chromium } from "playwright-core";
import fs from "node:fs";

const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
const out = {};
const text = async () => (await page.evaluate(() => document.body.innerText)).replace(/\n{3,}/g, "\n\n");
const snap = async (key) => { out[key] = (await text()).slice(0, 5000); };
const clickText = async (t, timeout = 4000) => {
  const loc = page.getByRole("button", { name: new RegExp(t) }).or(page.getByRole("link", { name: new RegExp(t) })).or(page.getByText(t, { exact: false })).first();
  await loc.click({ timeout });
};

// 1) 登录页：错误提示 + 密码可见性
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill("nobody@example.com");
await page.locator('input[name="password"]').fill("wrong-pass");
const toggleBtn = page.locator('button[aria-label*="assword"], button[aria-label*="密码"]').first();
let toggleBefore = null, toggleAfter = null;
if (await toggleBtn.count()) {
  toggleBefore = await page.locator('input[name="password"]').first().getAttribute("type");
  await toggleBtn.click();
  toggleAfter = await page.locator('input[name="password"]').first().getAttribute("type");
}
out.password_toggle = { toggleBefore, toggleAfter };
await page.locator('button[type="submit"]').first().click();
await page.waitForTimeout(3000);
out.login_error = (await text()).replace(/\n+/g, " | ").slice(-400);

// 2) 正常登录
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/, { timeout: 30000 });
await page.waitForTimeout(1500);

// 3) 模型列表
await page.goto(`${BASE}/ui/models-and-endpoints/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await snap("models_list");

// 4) 模型详情 + 测试连接
try {
  await page.getByText("test-model-diag", { exact: false }).first().click();
  await page.waitForTimeout(2500);
  await snap("model_detail");
  const testBtn = page.getByRole("button", { name: /测试连接|Test Connection/ }).first();
  if (await testBtn.count()) {
    await testBtn.click();
    await page.waitForTimeout(6000);
    await snap("model_test_connection");
  } else { out.model_test_connection = "no test button"; }
} catch (e) { out.model_detail_error = String(e).slice(0, 200); }

// 5) 添加模型表单
await page.goto(`${BASE}/ui/models-and-endpoints/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
try {
  await page.getByRole("tab", { name: "添加模型" }).first().click();
  await page.waitForTimeout(2500);
  await snap("add_model_form");
  out.required_stars = await page.evaluate(() => (document.body.innerText.match(/\*/g) || []).length);
} catch (e) { out.add_model_error = String(e).slice(0, 200); }

// 6) 密钥页 + 重新生成
await page.goto(`${BASE}/ui/api-keys/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await snap("keys_list");
try {
  await page.getByText("bugtest-key", { exact: false }).first().click();
  await page.waitForTimeout(2000);
  await snap("key_detail");
  const regen = page.getByRole("button", { name: /重新生成密钥|Regenerate/ }).first();
  if (await regen.count()) {
    out.regen_disabled = await regen.isDisabled();
    await regen.click();
    await page.waitForTimeout(1500);
    await snap("regen_modal");
  } else { out.regen_modal = "no regenerate button"; }
} catch (e) { out.key_detail_error = String(e).slice(0, 200); }

// 7) 用户与团队
await page.goto(`${BASE}/ui/users/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await snap("users");
await page.goto(`${BASE}/ui/teams/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await snap("teams");

// 8) 护栏 + 删除确认
await page.goto(`${BASE}/ui/guardrails/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await snap("guardrails");
try {
  await page.getByText("bugtest-guard", { exact: false }).first().click();
  await page.waitForTimeout(2000);
  await snap("guardrail_detail");
} catch (e) { out.guardrail_detail_error = String(e).slice(0, 120); }

// 9) 授权页
await page.goto(`${BASE}/ui/product-license/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await snap("license");

// 10) 日志
await page.goto(`${BASE}/ui/logs/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await snap("logs");

// 11) 成本优化与用量
await page.goto(`${BASE}/ui/cost-optimization/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await snap("cost");
await page.goto(`${BASE}/ui/usage/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await snap("usage");

fs.writeFileSync("/tmp/verify_round2.json", JSON.stringify(out, null, 1));
console.log("keys:", Object.keys(out).join(", "));
await browser.close();
