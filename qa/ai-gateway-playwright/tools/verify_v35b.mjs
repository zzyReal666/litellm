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

// A) 模型与端点：模型设置按钮是否隐藏（config 托管）
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
out.modelSettingsBtn = await page.locator('[data-testid="models-settings-trigger"]').count();

// B) 团队详情 tabs 中文
await page.goto(`${BASE}/ui/teams`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const teamLink = page.locator("tbody tr a, tbody tr [role='link']").first();
out.teamLinkCount = await teamLink.count();
if (await teamLink.count()) { await teamLink.click(); } else { await page.locator("tbody tr").first().click(); }
await page.waitForTimeout(2800);
out.teamDetailUrl = page.url();
out.teamDetailTabs = await page.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).map(e=>(e.innerText||"").trim()));

// C) 修改密码：错误提示中文
await page.goto(`${BASE}/ui/change-password`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const pwInputs = page.locator('input[type="password"]');
out.pwInputCount = await pwInputs.count();
if (out.pwInputCount >= 3) {
  await pwInputs.nth(0).fill("WrongPassword@123");
  await pwInputs.nth(1).fill("NewPassword@456");
  await pwInputs.nth(2).fill("NewPassword@456");
  await page.getByRole("button", { name: /修改密码|保存/ }).first().click();
  await page.waitForTimeout(3000);
  const t = await text();
  out.pwErrorZh = /当前密码不正确/.test(t);
  out.pwErrorEnglish = /Current password is incorrect/.test(t);
}

// D) 创建护栏表单中文
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const addGuard = page.getByRole("button", { name: /添加护栏|创建护栏|新增护栏/ }).first();
out.addGuardBtn = await addGuard.count();
if (await addGuard.count()) {
  await addGuard.click(); await page.waitForTimeout(2500);
  const t = await text();
  out.guardFormZh = {
    hasModeZh: /调用前/.test(t),
    hasStreamZh: /流式与非流式/.test(t),
    hasInheritZh: /使用全局默认值/.test(t),
    hasEnglishResidue: /pre_call\b|fail_closed|fail_open|inherit\b/.test(t),
  };
  // 选择 headroom 提供商看参数说明
  out.guardFormSnippet = t.slice(0, 800);
}
fs.writeFileSync("/tmp/verify_v35b.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3500));
await browser.close();
