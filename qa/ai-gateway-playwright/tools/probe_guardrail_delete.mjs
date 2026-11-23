import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true });
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
await page.goto(`${env.AIG_BASE_URL}/ui/guardrails/?guardrail=2f0eabf7-7596-4e55-8230-59ccd7fae11b`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const out = { detail: (await page.evaluate(() => document.body.innerText)).slice(0, 1500) };
const del = page.getByRole("button", { name: /删除/ }).first();
if (await del.count()) { await del.click(); await page.waitForTimeout(1500); out.delete_dialog = (await page.evaluate(() => document.body.innerText)).slice(-1200); }
else out.delete_dialog = "no delete button";
fs.writeFileSync("/tmp/guardrail_delete.json", JSON.stringify(out, null, 1));
console.log(out.delete_dialog.slice(0, 600));
await browser.close();
