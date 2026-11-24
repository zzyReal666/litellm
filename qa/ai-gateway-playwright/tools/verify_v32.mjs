import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true, acceptDownloads: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
const toasts = () => page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
const englishLines = (t) => t.split("\n").map(l=>l.trim()).filter(l=>l && /[A-Za-z]{3,}/.test(l) && !/[\u4e00-\u9fff]/.test(l));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1800);

// 1) 日志与告警四个标签页
await page.goto(`${BASE}/ui/logging-and-alerts`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
const alertTabs = await page.evaluate(() => Array.from(document.querySelectorAll("[role=tab]")).map((e) => (e.innerText||"").trim()));
out.alert_tabs = alertTabs;
out.alertsEnglish = {};
for (const name of ["告警类型","告警设置","邮件告警","MS Teams 告警"]) {
  const tab = page.getByRole("tab", { name, exact: true }).first();
  if (!(await tab.count())) continue;
  await tab.click(); await page.waitForTimeout(1600);
  const t = await text();
  out.alertsEnglish[name] = englishLines(t).filter(l => !/^(MCP|CloudZero|MS Teams|中安云科|admin@|LiteLLM)/.test(l)).slice(0, 12);
}
// 2) 团队表单占位符
await page.goto(`${BASE}/ui/teams`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /添加团队|创建团队|新建团队/ }).first().click();
await page.waitForTimeout(1500);
out.team_placeholders = await page.evaluate(() => Array.from(document.querySelectorAll("input,textarea")).map((e) => e.getAttribute("placeholder")).filter(Boolean));
await page.keyboard.press("Escape");
// 3) 默认用户设置团队名称
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByRole("tab", { name: /默认用户设置/ }).first().click().catch(()=>{});
await page.waitForTimeout(1500);
const defText = await text();
out.default_team_uuid_shown = /默认团队[\s\S]{0,120}[0-9a-f]{8}-[0-9a-f]{4}/.test(defText);
out.default_team_tail = defText.slice(-500);
// 4) 邀请用户：角色描述 + 重复邮箱
await page.getByRole("tab", { name: /^用户$|用户列表/ }).first().click().catch(()=>{});
await page.waitForTimeout(1000);
const invite = page.getByRole("button", { name: /邀请用户/ }).first();
out.invite_btn = await invite.count();
if (await invite.count()) {
  await invite.click(); await page.waitForTimeout(1500);
  const dialogText = await text();
  out.invite_english_desc = /admin over litellm proxy|view all keys, view all spend|view\/create\/delete their own keys/.test(dialogText);
  const email = page.getByRole("textbox", { name: /邮箱/ }).first();
  if (await email.count()) await email.fill("bugtest@example.com");
  await page.getByRole("button", { name: /创建用户|邀请/ }).first().click().catch(()=>{});
  await page.waitForTimeout(2500);
  out.duplicate_email_toasts = await toasts();
}
// 5) 批量邀请模板列名
await page.getByRole("button", { name: /取消|关闭/ }).first().click().catch(()=>{});
await page.waitForTimeout(800);
const bulk = page.getByRole("button", { name: /批量邀请用户/ }).first();
out.bulk_btn = await bulk.count();
if (await bulk.count()) {
  await bulk.click(); await page.waitForTimeout(1500);
  const bulkText = await text();
  out.bulk_column_section_has_chinese = /邮箱[\s\S]{0,80}用户角色[\s\S]{0,80}团队/.test(bulkText);
  out.bulk_column_section_english = /user_email[\s\S]{0,60}user_role/.test(bulkText);
  const dl = page.getByRole("button", { name: /下载模板/ }).first();
  if (await dl.count()) {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }).catch(()=>null), dl.click()]);
    if (download) {
      const path = await download.path();
      const csv = fs.readFileSync(path, "utf8").trim().split("\n")[0];
      out.bulk_template_header = csv;
    }
  }
}
// 6) 密钥详情：重新生成按钮隐藏
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2200);
out.regenerate_visible = await page.getByRole("button", { name: /重新生成密钥/ }).count();
// 7) 重置密码弹窗中文化
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const rowMenu = page.getByLabel(/打开用户操作菜单/).nth(1);
if (await rowMenu.count()) { await rowMenu.click(); await page.waitForTimeout(600); }
await page.getByText(/^重置密码$/).first().click().catch(()=>{});
await page.waitForTimeout(1800);
const resetText = await text();
out.reset_modal_zh = /重置密码链接/.test(resetText);
out.reset_modal_english = /Reset Password Link|Copy and send the generated link/.test(resetText);
// 8) 审计日志 tab 隐藏
await page.goto(`${BASE}/ui/logs`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const logTabs = await page.evaluate(() => Array.from(document.querySelectorAll("[role=tab]")).map((e) => (e.innerText||"").trim()));
out.log_tabs = logTabs;
out.audit_hidden = !logTabs.some((t) => t.includes("审计日志"));
// 9) 护栏复制 ID 提示中文化
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const guard = page.getByText("verify-guard-id", { exact: true }).first();
out.guard_found = await guard.count();
if (await guard.count()) {
  await guard.click(); await page.waitForTimeout(2200);
  const idCopy = page.locator("h1").first().locator("xpath=following::div[1]//button").first();
  if (await idCopy.count()) { await idCopy.click(); await page.waitForTimeout(1200); }
  out.guard_copy_toasts = await toasts();
}
fs.writeFileSync("/tmp/verify_v32.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 5000));
await browser.close();
