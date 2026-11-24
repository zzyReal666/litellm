import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
const toasts = () => page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1200);

// ---------- 成本优化 ----------
await page.goto(`${BASE}/ui/cost-optimization`, { waitUntil: "networkidle" });
await page.waitForTimeout(2800);
out.cost_text = await page.evaluate(() => document.body.innerText);
const compTab = page.getByRole("tab", { name: /提示词压缩/ }).first();
if (await compTab.count()) { await compTab.click(); await page.waitForTimeout(2200); }
out.compression_text = await page.evaluate(() => document.body.innerText);
const inputs = page.locator("form input");
out.compression_inputs = await page.evaluate(() => Array.from(document.querySelectorAll("form input,form textarea,form button")).map((e) => ({ tag: e.tagName, type: e.getAttribute("type"), ph: e.getAttribute("placeholder"), text: (e.innerText||"").trim().slice(0,40) })).slice(0,20));
// 尝试重复添加：填名称与已存在重复
const nameInput = page.locator("form input").first();
if (await nameInput.count()) {
  await nameInput.fill("bugtest-guard");
  const save = page.getByRole("button", { name: /添加护栏|Add guardrail/ }).first();
  if (await save.count()) { await save.click(); await page.waitForTimeout(3500); }
  out.duplicate_guardrail = { toasts: await toasts(), tail: (await page.evaluate(() => document.body.innerText)).slice(-1200) };
}
// 自动路由页文案
const arTab = page.getByRole("tab", { name: /自动路由/ }).first();
if (await arTab.count()) { await arTab.click(); await page.waitForTimeout(2000); }
out.autorouter_text = (await page.evaluate(() => document.body.innerText)).slice(-1500);
fs.writeFileSync("/tmp/repro_c.json", JSON.stringify(out, null, 1));
console.log("repro C done");
await browser.close();
