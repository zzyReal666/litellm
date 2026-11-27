import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
const spinInfo = async () => {
  const n = await page.getByRole("spinbutton").count();
  const arr = [];
  for (let i=0;i<n;i++) arr.push({ i, label: await page.getByRole("spinbutton").nth(i).getAttribute("aria-label") ?? await page.getByRole("spinbutton").nth(i).getAttribute("name") });
  return arr;
};
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1600);

// 用户设置
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("zzypersonally@gmail.com", { exact: true }).first().click();
await page.waitForTimeout(2000);
const editSettings = page.getByRole("button", { name: /编辑设置/ }).first();
out.editSettings = await editSettings.count();
if (await editSettings.count()) { await editSettings.click(); await page.waitForTimeout(2000); }
out.userSpins = await spinInfo();
const tpm = page.getByRole("spinbutton", { name: /TPM/ }).first();
if (await tpm.count()) {
  await tpm.fill("111111111111111111111111111111");
  await page.waitForTimeout(1200);
  out.userTpmRealtime = /请输入非负整数/.test(await text());
}
const alias = page.getByRole("textbox", { name: /用户别名|User Alias/ }).first();
if (await alias.count()) out.aliasMaxLength = await alias.getAttribute("maxlength");

// 虚拟密钥编辑
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2500);
out.keyButtons = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b=>(b.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean).slice(0,25));
// 若有“编辑”则点开
const keyEdit = page.getByRole("button", { name: /^编辑$|编辑密钥/ }).first();
if (await keyEdit.count()) { await keyEdit.click(); await page.waitForTimeout(1800); }
out.keySpins = await spinInfo();
fs.writeFileSync("/tmp/verify_v38b.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3000));
await browser.close();
