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

// 团队详情
await page.goto(`${BASE}/ui/teams`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const teamBtn = page.getByRole("button", { name: /测试团队A/ }).first();
out.teamBtn = await teamBtn.count();
if (await teamBtn.count()) { await teamBtn.click(); await page.waitForTimeout(2800); }
out.teamUrl = page.url();
out.teamTabs = await page.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).map(e=>(e.innerText||"").trim()));
out.teamHeadings = (await text()).split("\n").map(l=>l.trim()).filter(Boolean).slice(0, 25);

// 护栏创建表单
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const addGuard = page.getByRole("button", { name: /添加新护栏/ }).first();
out.addGuard = await addGuard.count();
if (await addGuard.count()) {
  await addGuard.click(); await page.waitForTimeout(2500);
  let t = await text();
  out.guardFormSnippet = t.slice(0, 1200);
  out.guardZhFlags = {
    pre_callZh: /调用前/.test(t),
    bothZh: /流式与非流式/.test(t),
    inheritZh: /使用全局默认值/.test(t),
    failClosedZh: /拦截（报错）|拦截\(报错\)/.test(t),
    rawEnglish: /pre_call|fail_closed|inherit\b/.test(t),
  };
}
fs.writeFileSync("/tmp/verify_v35c.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3200));
await browser.close();
