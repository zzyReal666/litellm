import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1560, height: 1080 }, ignoreHTTPSErrors: true });
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
await page.goto(`${env.AIG_BASE_URL}/ui/usage/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "artifacts/usage-zh-overview.png", fullPage: false });
const modelTab = page.getByRole("tab", { name: "模型活动", exact: true });
if (await modelTab.count()) { await modelTab.first().click(); await page.waitForTimeout(2000); await page.screenshot({ path: "artifacts/usage-zh-model-activity.png", fullPage: false }); }
console.log("shots saved");
await browser.close();
