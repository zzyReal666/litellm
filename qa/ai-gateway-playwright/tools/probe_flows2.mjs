import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true });
const out = {};
const text = async () => (await page.evaluate(() => document.body.innerText)).slice(-3000);
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);

// 护栏：行内删除
await page.goto(`${env.AIG_BASE_URL}/ui/guardrails/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const delBtn = page.getByRole("button", { name: /删除/ }).first();
if (await delBtn.count()) { await delBtn.click(); await page.waitForTimeout(1500); out.guardrail_delete_dialog = await text(); }
else out.guardrail_delete_dialog = "no delete button";

// 团队：创建空校验
await page.goto(`${env.AIG_BASE_URL}/ui/teams/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const createBtn = page.getByRole("button", { name: /创建团队/ }).first();
if (await createBtn.count()) {
  await createBtn.click(); await page.waitForTimeout(1500);
  const saveBtn = page.getByRole("button", { name: /保存|确定|创建/ }).last();
  if (await saveBtn.count()) { await saveBtn.click(); await page.waitForTimeout(1500); }
  out.team_validation = await text();
} else out.team_validation = "no create button";

// 审计日志
await page.goto(`${env.AIG_BASE_URL}/ui/logs/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const auditTab = page.getByRole("tab", { name: /审计日志/ }).first();
if (await auditTab.count()) { await auditTab.click(); await page.waitForTimeout(2000); out.audit_logs = await text(); }
else out.audit_logs = "no audit tab";

fs.writeFileSync("/tmp/probe_flows2.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(Object.keys(out)));
await browser.close();
