import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
const toasts = () => page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map(e=>(e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1600);

// A) 护栏添加提供商表单
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByRole("button", { name: /添加新护栏/ }).first().click(); await page.waitForTimeout(800);
await page.getByText(/添加提供商护栏/).first().click(); await page.waitForTimeout(2000);
const t = await text();
out.providerForm = {
  basicInfoZh: /基本信息/.test(t),
  testZh: /测试/.test(t),
  modeZh: /调用前/.test(t),
  rawEnglish: /pre_call|fail_closed|inherit\b|Optional parameters/.test(t),
  snippet: t.slice(0, 1000),
};
await page.keyboard.press("Escape");

// B) 模型详情 → 设置 → 团队 → 保存
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const modelLink = page.getByText("deepseek-v4-flash", { exact: true }).first();
out.modelLink = await modelLink.count();
if (await modelLink.count()) {
  await modelLink.click(); await page.waitForTimeout(2500);
  const settingsTab = page.getByRole("tab", { name: /设置/ }).first();
  if (await settingsTab.count()) { await settingsTab.click(); await page.waitForTimeout(1500); }
  const teamCombo = page.getByRole("combobox").filter({ hasText: /团队/ }).first();
  out.combos = await page.getByRole("combobox").count();
  const t2 = await text();
  out.modelSettingsHasTeam = /团队/.test(t2);
  out.modelSettingsSnippet = t2.slice(-1400);
}
fs.writeFileSync("/tmp/verify_v35d.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3500));
await browser.close();
