import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read","clipboard-write"] });
const dump = async (name) => {
  const data = await page.evaluate(() => ({
    text: document.body.innerText.slice(-4500),
    buttons: Array.from(document.querySelectorAll("button")).map((b) => ({ aria: (b.getAttribute("aria-label")||"").trim(), text: (b.innerText||"").trim() })).filter(b => b.aria || b.text).slice(-45),
    fields: Array.from(document.querySelectorAll("input,textarea,select")).map((e) => ({ tag: e.tagName, id: e.id||"", aria: (e.getAttribute("aria-label")||"").trim(), placeholder: (e.getAttribute("placeholder")||"").trim(), role: e.getAttribute("role")||"", value: (e.value||"").slice(0,50) })).slice(-30),
  }));
  fs.writeFileSync(`/tmp/recon2_${name}.json`, JSON.stringify(data, null, 1));
  return data;
};
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);

// 默认用户设置
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const defBtn = page.getByRole("button", { name: /默认用户设置/ }).first();
if (await defBtn.count()) { await defBtn.click(); await page.waitForTimeout(1800); await dump("default_user_settings"); }

// 模型设置
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const setBtn = page.getByRole("button", { name: /^模型设置$/ }).first();
if (await setBtn.count()) { await setBtn.click(); await page.waitForTimeout(1800); await dump("model_settings"); }

// 密钥编辑
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2500);
const keyEdit = page.getByRole("button", { name: /^编辑设置$/ }).first();
if (await keyEdit.count()) { await keyEdit.click(); await page.waitForTimeout(1800); await dump("key_edit"); }

// 询问 AI
await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const ask = page.getByRole("button", { name: /询问 AI/ }).first();
if (await ask.count()) { await ask.click(); await page.waitForTimeout(1200); }
const panelText = await page.evaluate(() => document.body.innerText.slice(-1200));
fs.writeFileSync("/tmp/recon2_usage_panel.txt", panelText);
const input = page.locator('textarea, input[placeholder*="问"], input[placeholder*="Ask"]').last();
if (await input.count()) {
  await input.fill("本周哪个模型花费最高？");
  const send = page.getByRole("button", { name: /发送|Send/ }).first();
  if (await send.count()) { await send.click(); await page.waitForTimeout(15000); }
  fs.writeFileSync("/tmp/recon2_usage_after.txt", await page.evaluate(() => document.body.innerText.slice(-2000)));
}
await browser.close();
console.log("recon2 done");
