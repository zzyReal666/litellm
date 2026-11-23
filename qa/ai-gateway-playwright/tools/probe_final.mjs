import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true });
const out = {};
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);

// 添加模型：字段标签
await page.goto(`${env.AIG_BASE_URL}/ui/models-and-endpoints/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.getByRole("tab", { name: "添加模型" }).first().click();
await page.waitForTimeout(2000);
const formText = await page.evaluate(() => document.body.innerText);
out.api_labels = { hasZhBase: formText.includes("上游 API 地址"), hasEnBase: formText.includes("Upstream API Base"), hasZhKey: formText.includes("API 密钥"), hasEnKey: /\bAPI Key\b/.test(formText) };

// 团队创建：premium 提示
await page.goto(`${env.AIG_BASE_URL}/ui/teams/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const create = page.getByRole("button", { name: /创建团队/ }).first();
if (await create.count()) { await create.click(); await page.waitForTimeout(1500); }
const teamText = await page.evaluate(() => document.body.innerText);
out.team_premium_hint = {
  hasZh: teamText.includes("企业版功能"),
  hasEn: teamText.includes("Premium feature"),
  hasEnglishNA: /\bn\/a\b/.test(teamText),
};

// 护栏列表行操作
await page.goto(`${env.AIG_BASE_URL}/ui/guardrails/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const rowButtons = await page.evaluate(() => Array.from(document.querySelectorAll("tbody button, [role=row] button")).map(b => (b.innerText||"").trim() || b.getAttribute("aria-label") || "").filter(Boolean).slice(0, 10));
out.guardrail_row_buttons = rowButtons;
if (rowButtons.length) {
  const btn = page.locator("tbody button, [role=row] button").first();
  await btn.click().catch(() => {});
  await page.waitForTimeout(1200);
  const menuText = await page.evaluate(() => document.body.innerText);
  out.guardrail_menu_has_delete = /删除/.test(menuText);
  const del = page.getByRole("menuitem", { name: /删除/ }).or(page.getByRole("button", { name: /删除/ })).first();
  if (await del.count()) { await del.click(); await page.waitForTimeout(1200); out.guardrail_delete_dialog = (await page.evaluate(() => document.body.innerText)).slice(-700); }
}

fs.writeFileSync("/tmp/probe_final.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out).slice(0, 1200));
await browser.close();
