import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true, acceptDownloads: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
const toasts = () => page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
const englishSentences = (t) => t.split("\n").map(l=>l.trim()).filter(l => l && /[A-Za-z]{4,}/.test(l) && !/[\u4e00-\u9fff]/.test(l) && !/^[A-Za-z0-9_\-\.:\/@ ]+$/.test(l));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1800);

// 日志与告警
await page.goto(`${BASE}/ui/logging-and-alerts`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
out.alerts = {};
for (const name of ["告警类型","告警设置","邮件告警","MS Teams 告警"]) {
  const tab = page.getByRole("tab", { name, exact: true }).first();
  if (!(await tab.count())) continue;
  await tab.click(); await page.waitForTimeout(1700);
  out.alerts[name] = englishSentences(await text()).slice(0, 10);
}
// 邮件事件标签中文化检查
await page.getByRole("tab", { name: "邮件告警", exact: true }).first().click();
await page.waitForTimeout(1500);
const emailText = await text();
out.email_events_zh = /创建虚拟密钥|邀请新用户/.test(emailText) && !/Virtual Key Created/.test(emailText);

// 邀请用户重复邮箱
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByRole("button", { name: /邀请用户/ }).first().click();
await page.waitForTimeout(1500);
const email = page.getByRole("textbox", { name: /邮箱/ }).first();
if (await email.count()) await email.fill("bugtest@example.com");
await page.getByRole("button", { name: /创建用户|邀请/ }).first().click().catch(()=>{});
await page.waitForTimeout(2500);
out.duplicate_toasts = await toasts();
await page.keyboard.press("Escape");

// 批量邀请：列名与模板表头
const bulk = page.getByRole("button", { name: /批量邀请用户/ }).first();
await bulk.click();
await page.waitForTimeout(1800);
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 8000 }).catch(() => null),
  page.getByRole("button", { name: /下载.*模板|Download CSV Template/ }).first().click(),
]);
if (download) {
  const p = await download.path();
  out.bulk_template_header = fs.readFileSync(p, "utf8").trim().split("\n")[0];
}
const bulkText = await text();
out.bulk_column_labels_zh = /邮箱/.test(bulkText) && /用户角色/.test(bulkText) && !/user_email/.test(bulkText.split("Template")[0] || "");

// 护栏复制 ID 提示
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("verify-guard-id", { exact: true }).first().click();
await page.waitForTimeout(2200);
const idEl = page.locator("p.font-mono").first();
const copyBtn = idEl.locator("xpath=following-sibling::button[1]");
out.guard_copy_btn = await copyBtn.count();
if (await copyBtn.count()) { await copyBtn.click(); await page.waitForTimeout(1200); }
out.guard_copy_toasts = await toasts();
fs.writeFileSync("/tmp/verify_v32b.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
await browser.close();
