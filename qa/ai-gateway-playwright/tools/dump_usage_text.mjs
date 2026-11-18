import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, ignoreHTTPSErrors: true });
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
await page.goto(`${env.AIG_BASE_URL}/ui/usage/`, { waitUntil: "networkidle" });
const out = [];
const tabNames = ["总览", "模型活动", "密钥活动", "MCP 服务器活动", "端点活动"];
for (const tab of tabNames) {
  const trigger = page.getByRole("tab", { name: tab, exact: true });
  if (await trigger.count()) { await trigger.first().click(); await page.waitForTimeout(1800); }
  const text = await page.evaluate(() => document.body.innerText);
  out.push(`\n##### ${tab} #####\n${text}`);
}
fs.writeFileSync("/tmp/usage_innertext.txt", out.join("\n"));
console.log("dumped");
await browser.close();
