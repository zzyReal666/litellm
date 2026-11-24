import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);
const out = {};
// 管理设置
await page.goto(`${BASE}/ui/admin-panel`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const tabs = await page.evaluate(() => Array.from(document.querySelectorAll("[role=tab]")).map((e) => (e.innerText||"").trim()));
out.admin_tabs = tabs;
out.admin = {};
for (const name of tabs) {
  const tab = page.getByRole("tab", { name, exact: true }).first();
  if (!(await tab.count())) continue;
  await tab.click();
  await page.waitForTimeout(1800);
  const text = await page.evaluate(() => document.body.innerText);
  const panel = text.split("按\n⌘K")[0] || text;
  out.admin[name] = panel.slice(-7000);
}
// 路由设置
await page.goto(`${BASE}/ui/router-settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const rTabs = await page.evaluate(() => Array.from(document.querySelectorAll("[role=tab]")).map((e) => (e.innerText||"").trim()));
out.router_tabs = rTabs;
out.router = {};
for (const name of rTabs) {
  const tab = page.getByRole("tab", { name, exact: true }).first();
  if (!(await tab.count())) continue;
  await tab.click();
  await page.waitForTimeout(1800);
  out.router[name] = (await page.evaluate(() => document.body.innerText)).slice(-7000);
}
fs.writeFileSync("/tmp/settings_en.json", JSON.stringify(out, null, 1));
console.log("admin tabs:", JSON.stringify(tabs));
console.log("router tabs:", JSON.stringify(rTabs));
await browser.close();
