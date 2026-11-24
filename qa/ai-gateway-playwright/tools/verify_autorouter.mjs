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
// 密钥详情自动路由用量
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2500);
const tab = page.getByRole("tab", { name: /自动路由用量/ }).first();
if (await tab.count()) { await tab.click(); await page.waitForTimeout(2500); }
out.key_auto_router_text = (await page.evaluate(() => document.body.innerText)).slice(-1800);
// 成本优化自动路由页
await page.goto(`${BASE}/ui/cost-optimization`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const arTab = page.getByRole("tab", { name: /自动路由/ }).first();
if (await arTab.count()) { await arTab.click(); await page.waitForTimeout(2500); }
out.cost_auto_router_text = (await page.evaluate(() => document.body.innerText)).slice(-1800);
fs.writeFileSync("/tmp/autorouter_texts.json", JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) {
  const english = v.match(/Same model|First visit|Return to tier|All auto-routers|previous turn|turns|Cache hit rate|Expired-miss/g) ?? [];
  console.log(k, "english:", JSON.stringify(english));
}
await browser.close();
