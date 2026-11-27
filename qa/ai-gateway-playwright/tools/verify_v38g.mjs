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

// 用户菜单项
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);
const menus = page.getByRole("button", { name: /打开用户操作菜单/ });
await menus.nth(1).click(); await page.waitForTimeout(800);
out.userMenuItems = await page.evaluate(() => Array.from(document.querySelectorAll('[role="menuitem"]')).map(e=>(e.innerText||"").trim()).filter(Boolean));
// 尝试点击菜单里的编辑
for (const label of ["编辑用户", "编辑", "查看用户", "用户设置"]) {
  const item = page.getByRole("menuitem", { name: label }).first();
  if (await item.count()) { await item.click().catch(()=>{}); await page.waitForTimeout(2000); break; }
}
const tpmUser = page.getByRole("spinbutton", { name: /TPM/ }).first();
out.userTpmCount = await tpmUser.count();
if (await tpmUser.count()) {
  await tpmUser.fill("111111111111111111111111111111");
  await page.waitForTimeout(1500);
  out.userTpmRealtime = /请输入非负整数/.test(await text());
}
const alias = page.getByRole("textbox", { name: /用户别名|User Alias/ }).first();
if (await alias.count()) out.aliasMaxLength = await alias.getAttribute("maxlength");

// 模型详情编辑：点击模型名后找编辑入口
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.getByText("deepseek-v4-flash", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2600);
out.modelUrl = page.url();
out.modelVisibleButtons = await page.locator("button:visible").evaluateAll(els => els.map(e=>(e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean).slice(0,30));
out.modelTabs = await page.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).map(e=>(e.innerText||"").trim()));
fs.writeFileSync("/tmp/verify_v38g.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3000));
await browser.close();
