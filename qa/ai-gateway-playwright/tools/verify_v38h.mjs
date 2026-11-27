import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1600);
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
// 点击模型 ID 按钮进入详情
const modelIdBtn = page.getByRole("button", { name: "fd9ca524-f37e-45b5-8f6a-49699f6d1def" }).first();
out.modelIdBtn = await modelIdBtn.count();
if (await modelIdBtn.count()) { await modelIdBtn.click(); await page.waitForTimeout(2600); }
out.url = page.url();
out.tabs = await page.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).map(e=>(e.innerText||"").trim()));
out.visibleButtons = await page.locator("button:visible").evaluateAll(els => els.map(e=>(e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean).slice(0,30));
// 找设置 tab / 编辑按钮
const tabNames = out.tabs;
for (const name of ["设置", "模型信息", "概览"]) {
  const t = page.getByRole("tab", { name, exact: true }).first();
  if (await t.count()) { await t.click().catch(()=>{}); await page.waitForTimeout(1200); break; }
}
const editBtn = page.locator("button:visible", { hasText: "编辑" }).first();
out.editBtn = await editBtn.count();
if (await editBtn.count()) { await editBtn.click(); await page.waitForTimeout(1800); }
const t = await text();
out.modelTeamLabelVisible = /团队/.test(t);
out.formSnippet = t.slice(-1200);
fs.writeFileSync("/tmp/verify_v38h.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3000));
await browser.close();
