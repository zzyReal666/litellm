import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
const clickAny = async (names) => {
  for (const name of names) {
    for (const role of ["button", "tab", "menuitem"]) {
      const loc = page.getByRole(role, { name }).first();
      if (await loc.count()) { await loc.click().catch(()=>{}); await page.waitForTimeout(1500); return role+":"+name; }
    }
  }
  return null;
};
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1600);

// === 用户设置 ===
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("zzypersonally@gmail.com", { exact: true }).first().click();
await page.waitForTimeout(2200);
out.userEditClick = await clickAny([/^编辑设置$/, /编辑用户/, /^编辑$/]);
const tpmUser = page.getByRole("spinbutton", { name: /TPM/ }).first();
out.userTpmCount = await tpmUser.count();
if (await tpmUser.count()) {
  await tpmUser.fill("111111111111111111111111111111");
  await page.waitForTimeout(1200);
  out.userTpmRealtime = /请输入非负整数/.test(await text());
}
const alias = page.getByRole("textbox", { name: /用户别名|User Alias/ }).first();
out.aliasCount = await alias.count();
if (await alias.count()) out.aliasMaxLength = await alias.getAttribute("maxlength");

// === 虚拟密钥设置 ===
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2500);
out.keyEditClick = await clickAny([/^编辑设置$/, /编辑密钥/, /^编辑$/]);
const spinCount = await page.getByRole("spinbutton").count();
out.keySpinCount = spinCount;
if (spinCount) {
  const labels = [];
  for (let i=0;i<spinCount;i++) labels.push(await page.getByRole("spinbutton").nth(i).getAttribute("aria-label"));
  out.keySpinLabels = labels;
  const tpmKey = page.getByRole("spinbutton", { name: /TPM/ }).first();
  if (await tpmKey.count()) {
    await tpmKey.fill("5555555555555555555555555555");
    await page.waitForTimeout(1200);
    out.keyTpmRealtime = /请输入非负整数/.test(await text());
  }
  const budget = page.getByRole("spinbutton", { name: /最大预算|Max Budget/ }).first();
  if (await budget.count()) {
    await budget.fill("999999999999999999999999999999");
    await page.waitForTimeout(1200);
    out.keyBudgetRealtime = /请输入非负整数|最大/.test(await text());
  }
}

// === 模型编辑隐藏团队 ===
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.getByText("deepseek-v4-flash", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2500);
out.modelEditClick = await clickAny([/^编辑$/, /编辑模型/, /^设置$/]);
const modelText = await text();
out.modelTeamVisible = /团队/.test(modelText.slice(-2500));
out.modelTeamSnippet = modelText.slice(-900);
fs.writeFileSync("/tmp/verify_v38c.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3500));
await browser.close();
