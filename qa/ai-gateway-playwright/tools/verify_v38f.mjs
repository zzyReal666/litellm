import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
const clickVisible = async (txt) => {
  const loc = page.locator("button:visible", { hasText: txt }).first();
  if (await loc.count()) { await loc.click().catch(()=>{}); await page.waitForTimeout(1500); return true; }
  return false;
};
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1600);

// 1) 虚拟密钥设置
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2600);
await page.getByRole("tab", { name: "设置", exact: true }).first().click();
await page.waitForTimeout(1500);
out.keyEditOpened = await clickVisible("编辑设置");
const tpmKey = page.getByRole("spinbutton", { name: /TPM/ }).first();
out.keyTpmCount = await tpmKey.count();
if (await tpmKey.count()) {
  await tpmKey.fill("5555555555555555555555555555");
  await page.waitForTimeout(1500);
  out.keyTpmRealtime = /请输入非负整数/.test(await text());
}
for (const [label, re] of [["max", /最大预算|Max Budget/], ["soft", /软预算|Soft Budget/]]) {
  const inp = page.getByRole("spinbutton", { name: re }).first();
  if (await inp.count()) {
    await inp.fill("999999999999999999999999999999");
    await page.waitForTimeout(1300);
    out[`key_${label}_realtime`] = /请输入非负整数/.test(await text());
  }
}

// 2) 用户设置：行操作菜单 -> 编辑
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);
const rowMenu = page.getByRole("button", { name: /打开用户操作菜单/ });
out.userMenuCount = await rowMenu.count();
if (out.userMenuCount > 1) { await rowMenu.nth(1).click(); await page.waitForTimeout(800); }
out.userEditClicked = await clickVisible("编辑");
const tpmUser = page.getByRole("spinbutton", { name: /TPM/ }).first();
out.userTpmCount = await tpmUser.count();
if (await tpmUser.count()) {
  await tpmUser.fill("111111111111111111111111111111");
  await page.waitForTimeout(1500);
  out.userTpmRealtime = /请输入非负整数/.test(await text());
}
const alias = page.getByRole("textbox", { name: /用户别名|User Alias/ }).first();
if (await alias.count()) out.aliasMaxLength = await alias.getAttribute("maxlength");

// 3) 护栏：headroom 不填 api_base 创建
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const addGuard = page.getByRole("button", { name: /添加新护栏/ }).first();
if (await addGuard.count()) {
  await addGuard.click(); await page.waitForTimeout(800);
  await page.getByText(/添加提供商护栏/).first().click().catch(()=>{});
  await page.waitForTimeout(1800);
  const nameInput = page.getByRole("textbox").first();
  if (await nameInput.count()) await nameInput.fill("verify-headroom-missing-base").catch(()=>{});
  // 选择 headroom 提供商
  const combos = page.getByRole("combobox");
  const n = await combos.count();
  out.guardCombos = n;
  for (let i=0;i<n;i++) {
    await combos.nth(i).click().catch(()=>{});
    await page.waitForTimeout(500);
    const opt = page.getByRole("option", { name: /Headroom/i }).first();
    if (await opt.count()) { await opt.click().catch(()=>{}); await page.waitForTimeout(800); break; }
    await page.keyboard.press("Escape").catch(()=>{});
  }
  // 下一步到提供商配置后直接创建
  await clickVisible("下一步");
  await page.waitForTimeout(1200);
  await clickVisible("创建护栏");
  await page.waitForTimeout(3000);
  const t = await text();
  out.guardHeadroomErrorZh = /Headroom 压缩服务需要填写/.test(t) || /API 基础地址/.test(t);
  out.guardErrorSnippet = t.split("\n").filter(l=>/护栏|基础地址|Headroom/.test(l)).slice(-6);
}
fs.writeFileSync("/tmp/verify_v38f.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3000));
await browser.close();
