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
// 1574: 从用量页退出再登录
await page.goto(`${env.AIG_BASE_URL}/ui/usage/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const account = page.getByRole("button", { name: /Account menu/ }).first();
if (await account.count()) { await account.click(); await page.waitForTimeout(800); const logout = page.getByRole("menuitem", { name: /退出|Logout|Sign out/ }).first(); if (await logout.count()) { await logout.click(); await page.waitForTimeout(2500); } }
await page.locator('input[name="username"]').fill(env.AIG_USER).catch(() => {});
await page.locator('input[name="password"]').fill(env.AIG_PASS).catch(() => {});
await page.locator('button[type="submit"]').first().click().catch(() => {});
await page.waitForTimeout(3500);
out.after_relogin_url = page.url();
// 团队占位符
await page.goto(`${env.AIG_BASE_URL}/ui/teams/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const create = page.getByRole("button", { name: /创建团队/ }).first();
if (await create.count()) { await create.click(); await page.waitForTimeout(1200); }
const teamText = await page.evaluate(() => document.body.innerText);
out.team_placeholder = { zhDefault: teamText.includes("默认值"), na: /\bn\/a\b/.test(teamText), enPremium: teamText.includes("Premium feature") };
fs.writeFileSync("/tmp/probe_last.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await browser.close();
