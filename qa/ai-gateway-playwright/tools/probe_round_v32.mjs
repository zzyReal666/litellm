import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1800);

// 1) 日志与告警
await page.goto(`${BASE}/ui/logging-and-alerts`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const tabs = await page.evaluate(() => Array.from(document.querySelectorAll("[role=tab]")).map((e) => (e.innerText||"").trim()));
out.alert_tabs = tabs;
out.alerts = {};
for (const name of tabs) {
  const tab = page.getByRole("tab", { name, exact: true }).first();
  if (!(await tab.count())) continue;
  await tab.click(); await page.waitForTimeout(1600);
  out.alerts[name] = await page.evaluate(() => document.body.innerText.slice(-6000));
}
// 2) 添加团队表单 placeholder
await page.goto(`${BASE}/ui/teams`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const addTeam = page.getByRole("button", { name: /添加团队|创建团队|新建团队/ }).first();
out.team_add_btn = await addTeam.count();
if (await addTeam.count()) {
  await addTeam.click(); await page.waitForTimeout(1500);
  out.team_form_placeholders = await page.evaluate(() => Array.from(document.querySelectorAll("input,textarea")).map((e) => e.getAttribute("placeholder")).filter(Boolean));
  out.team_form_text = (await page.evaluate(() => document.body.innerText)).slice(-2500);
}
// 3) 默认用户设置团队显示
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByRole("tab", { name: /默认用户设置/ }).first().click().catch(() => {});
await page.waitForTimeout(1500);
out.default_settings_text = (await page.evaluate(() => document.body.innerText)).slice(-1800);
// 4) 邀请用户：角色描述 + 重复邮箱
const invite = page.getByRole("button", { name: /邀请用户/ }).first();
out.invite_btn = await invite.count();
if (await invite.count()) {
  await invite.click(); await page.waitForTimeout(1500);
  out.invite_text = (await page.evaluate(() => document.body.innerText)).slice(-2200);
}
fs.writeFileSync("/tmp/probe_round_v32.json", JSON.stringify(out, null, 1));
console.log("tabs:", JSON.stringify(tabs));
console.log("team placeholders:", JSON.stringify(out.team_form_placeholders));
console.log("default settings tail:", out.default_settings_text.slice(-600));
await browser.close();
