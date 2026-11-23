import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true });
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForTimeout(4000);
await page.goto(`${env.AIG_BASE_URL}/ui/teams/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const create = page.getByRole("button", { name: /创建团队/ }).first();
if (await create.count()) { await create.click(); await page.waitForTimeout(1500); }
const t = await page.evaluate(() => document.body.innerText);
const out = { zhDefault: t.includes("默认值"), na: /\bn\/a\b/.test(t), enPremium: t.includes("Premium feature"), zhPremium: t.includes("企业版功能") };
fs.writeFileSync("/tmp/probe_team_ph.json", JSON.stringify(out));
console.log(JSON.stringify(out));
await browser.close();
