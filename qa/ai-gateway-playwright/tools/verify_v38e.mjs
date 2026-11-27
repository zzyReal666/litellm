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

// 虚拟密钥 -> 设置 tab
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2600);
await page.getByRole("tab", { name: "设置", exact: true }).first().click();
await page.waitForTimeout(1800);
const tpmKey = page.getByRole("spinbutton", { name: /TPM/ }).first();
out.keyTpmCount = await tpmKey.count();
if (await tpmKey.count()) {
  await tpmKey.fill("5555555555555555555555555555");
  await page.waitForTimeout(1500);
  out.keyTpmRealtime = /请输入非负整数/.test(await text());
}
const maxBudget = page.getByRole("spinbutton", { name: /最大预算|Max Budget/ }).first();
out.maxBudgetCount = await maxBudget.count();
if (await maxBudget.count()) {
  await maxBudget.fill("999999999999999999999999999999");
  await page.waitForTimeout(1500);
  out.keyBudgetRealtime = /请输入非负整数/.test(await text());
}
const softBudget = page.getByRole("spinbutton", { name: /软预算|Soft Budget/ }).first();
out.softBudgetCount = await softBudget.count();
if (await softBudget.count()) {
  await softBudget.fill("999999999999999999999999999999");
  await page.waitForTimeout(1500);
  out.keySoftBudgetRealtime = /请输入非负整数/.test(await text());
}

// 用户详情
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);
await page.getByText("zzypersonally@gmail.com", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2600);
out.userVisibleButtons = await page.locator("button:visible").evaluateAll(els => els.map(e=>(e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
out.userTabs = await page.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).map(e=>(e.innerText||"").trim()));
fs.writeFileSync("/tmp/verify_v38e.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,2500));
await browser.close();
