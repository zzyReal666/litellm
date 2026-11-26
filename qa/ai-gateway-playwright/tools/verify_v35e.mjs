import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1600);
// 打开 headroom-compression 护栏详情/设置
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("headroom-compression", { exact: true }).first().click();
await page.waitForTimeout(2800);
let t = await text();
out.detailZh = {
  overviewTab: /概览/.test(t),
  settingsTab: /设置/.test(t),
  rawEnglish: /pre_call\b|fail_closed|fail_open|inherit\b/.test(t),
  snippet: t.slice(-1800),
};
// 设置页
const settingsTab = page.getByRole("tab", { name: /^设置$/ }).first();
if (await settingsTab.count()) { await settingsTab.click(); await page.waitForTimeout(1800); t = await text(); }
out.settingsZh = {
  providerSection: /提供商设置/.test(t),
  advancedSection: /高级设置/.test(t),
  apiBaseZh: /压缩服务/.test(t),
  rawEnglish: /Optional parameters for the guardrail|Base URL for the headroom|API key for the headroom|Model name forwarded/.test(t),
  snippet: t.slice(-1600),
};
fs.writeFileSync("/tmp/verify_v35e.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3500));
await browser.close();
