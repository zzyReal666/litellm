import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map((l)=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const base = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, ignoreHTTPSErrors: true });
await page.goto(`${base}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
await page.goto(`${base}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2500);
const out = {};
for (const tab of ["自动路由用量", "设置", "节省"]) {
  const t = page.getByRole("tab", { name: tab, exact: true });
  if (await t.count()) {
    await t.first().click();
    await page.waitForTimeout(2500);
    out[tab] = await page.evaluate(() => document.body.innerText);
  } else out[tab] = "TAB_NOT_FOUND";
}
fs.writeFileSync("/tmp/probe_keytabs.json", JSON.stringify(out, null, 1));
console.log("tabs captured:", Object.keys(out).map((k) => `${k}:${String(out[k]).length}`).join(", "));
await browser.close();
