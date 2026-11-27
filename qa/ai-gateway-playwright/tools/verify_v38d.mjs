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

// 虚拟密钥详情 -> 编辑设置
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);
await page.getByText("bugtest-key", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2800);
out.keyDetailUrl = page.url();
const editTab = page.getByRole("tab", { name: /编辑设置/ }).first().or(page.locator("button:visible", { hasText: "编辑设置" }).first());
out.keyEditTab = await editTab.count();
if (await editTab.count()) { await editTab.click(); await page.waitForTimeout(2000); }
out.keySpinLabels = await page.evaluate(() => Array.from(document.querySelectorAll('input[type="number"]')).map(i => i.getAttribute("aria-label") ?? i.getAttribute("name")));
const tpmKey = page.getByRole("spinbutton", { name: /TPM/ }).first();
out.keyTpmCount = await tpmKey.count();
if (await tpmKey.count()) {
  await tpmKey.fill("5555555555555555555555555555");
  await page.waitForTimeout(1200);
  out.keyTpmRealtime = /请输入非负整数/.test(await text());
}
const maxBudget = page.getByRole("spinbutton", { name: /最大预算|Max Budget/ }).first();
out.maxBudgetCount = await maxBudget.count();
if (await maxBudget.count()) {
  await maxBudget.fill("999999999999999999999999999999");
  await page.waitForTimeout(1200);
  out.keyBudgetRealtime = /请输入非负整数/.test(await text());
}

// 用户详情 -> 编辑设置
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);
await page.getByText("zzypersonally@gmail.com", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2600);
const userEdit = page.getByRole("tab", { name: /编辑设置/ }).first().or(page.locator("button:visible", { hasText: "编辑设置" }).first());
out.userEditCount = await userEdit.count();
if (await userEdit.count()) { await userEdit.click(); await page.waitForTimeout(2000); }
out.userSpinLabels = await page.evaluate(() => Array.from(document.querySelectorAll('input[type="number"]')).map(i => i.getAttribute("aria-label") ?? i.getAttribute("name")));
const tpmUser = page.getByRole("spinbutton", { name: /TPM/ }).first();
if (await tpmUser.count()) {
  await tpmUser.fill("111111111111111111111111111111");
  await page.waitForTimeout(1200);
  out.userTpmRealtime = /请输入非负整数/.test(await text());
}
const alias = page.getByRole("textbox", { name: /用户别名|User Alias/ }).first();
if (await alias.count()) out.aliasMaxLength = await alias.getAttribute("maxlength");
fs.writeFileSync("/tmp/verify_v38d.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,2500));
await browser.close();
