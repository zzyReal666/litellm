import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read", "clipboard-write"] });
const out = {};
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);

// 1587/1585 模型详情测试连接
await page.goto(`${env.AIG_BASE_URL}/ui/models-and-endpoints/?model=d1af9369-7d21-435c-9ae5-09c26f1eb179`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
out.model_detail = (await page.evaluate(() => document.body.innerText)).slice(-1500);
const test = page.getByRole("button", { name: /测试连接|Test Connection/ }).first();
if (await test.count()) { await test.click(); await page.waitForTimeout(7000); out.test_result = (await page.evaluate(() => document.body.innerText)).slice(-1200); }
else out.test_result = "no test button";

// 1574 退出登录回首页
await page.goto(`${env.AIG_BASE_URL}/ui/usage/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
const account = page.getByRole("button", { name: /Account menu/ }).first();
if (await account.count()) {
  await account.click(); await page.waitForTimeout(800);
  const logout = page.getByRole("menuitem", { name: /退出|Logout|Sign out/ }).first();
  if (await logout.count()) { await logout.click(); await page.waitForTimeout(2500); }
}
await page.locator('input[name="username"]').fill(env.AIG_USER).catch(() => {});
await page.locator('input[name="password"]').fill(env.AIG_PASS).catch(() => {});
await page.locator('button[type="submit"]').first().click().catch(() => {});
await page.waitForTimeout(3000);
out.after_relogin_url = page.url();

// 1609 用户团队名称
await page.goto(`${env.AIG_BASE_URL}/ui/users/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
out.users = (await page.evaluate(() => document.body.innerText)).slice(-1800);
fs.writeFileSync("/tmp/probe_modelvis.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify({test: out.test_result?.slice(0,80), url: out.after_relogin_url}).slice(0, 300));
await browser.close();
