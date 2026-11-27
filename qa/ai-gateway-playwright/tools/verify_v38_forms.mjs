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
await page.waitForTimeout(1800);

// A) 用户设置：TPM 超长即时提示 + 别名长度限制
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const firstUser = page.getByText("zzypersonally@gmail.com", { exact: true }).first();
out.userFound = await firstUser.count();
if (out.userFound) {
  await firstUser.click(); await page.waitForTimeout(2500);
  const editBtn = page.getByRole("button", { name: /编辑设置|编辑用户|编辑/ }).first();
  if (await editBtn.count()) { await editBtn.click(); await page.waitForTimeout(1500); }
  const tpm = page.getByRole("spinbutton", { name: /TPM Limit|TPM/ }).first();
  out.tpmInput = await tpm.count();
  if (await tpm.count()) {
    await tpm.fill("111111111111111111111111111111");
    await page.waitForTimeout(1500);
    const t = await text();
    out.userTpmRealtime = /请输入非负整数/.test(t);
  }
  const alias = page.getByRole("textbox", { name: /用户别名|User Alias/ }).first();
  out.aliasInput = await alias.count();
  if (await alias.count()) {
    out.aliasMaxLength = await alias.getAttribute("maxlength");
  }
}

// B) 虚拟密钥设置：数值超限即时提示
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const firstKey = page.getByText("bugtest-key", { exact: true }).first();
out.keyFound = await firstKey.count();
if (out.keyFound) {
  await firstKey.click(); await page.waitForTimeout(2500);
  const edit = page.getByRole("button", { name: /^编辑$|编辑密钥/ }).first();
  if (await edit.count()) { await edit.click(); await page.waitForTimeout(2000); }
  const inputs = page.getByRole("spinbutton");
  const count = await inputs.count();
  out.keySpinButtons = count;
  const candidates = [];
  for (let i=0;i<Math.min(count,8);i++) candidates.push(await inputs.nth(i).getAttribute("value").catch(()=>null));
  // 找 TPM 输入：通过标签名
  const tpm = page.getByRole("spinbutton", { name: /TPM/ }).first();
  if (await tpm.count()) {
    await tpm.fill("5555555555555555555555555555");
    await page.waitForTimeout(1500);
    const t = await text();
    out.keyTpmRealtime = /请输入非负整数/.test(t);
  }
}

// C) 模型编辑：团队字段隐藏
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const modelRow = page.getByText("deepseek-v4-flash", { exact: true }).first();
out.modelFound = await modelRow.count();
if (out.modelFound) {
  await modelRow.click(); await page.waitForTimeout(2500);
  const edit = page.getByRole("button", { name: /^编辑$|编辑模型/ }).first();
  if (await edit.count()) { await edit.click(); await page.waitForTimeout(2000); }
  const t = await text();
  out.modelEditHasTeam = /团队/.test(t.split("模型信息")[1]?.slice(0,2000) ?? t);
}
fs.writeFileSync("/tmp/verify_v38_forms.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,2500));
await browser.close();
