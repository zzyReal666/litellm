import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map((l)=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const base = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1200 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read", "clipboard-write"] });
const page = await ctx.newPage();
await page.goto(`${base}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
await page.goto(`${base}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(3500);
const text = await page.evaluate(() => document.body.innerText);
fs.writeFileSync("/tmp/probe_keydetail.txt", text);
await page.screenshot({ path: "/tmp/probe_keydetail.png", fullPage: false });

// 重新生成按钮状态
const regen = page.getByRole("button", { name: /重新生成密钥|Regenerate Key/ }).first();
const regenCount = await regen.count();
let regenDisabled = null;
if (regenCount) regenDisabled = await regen.isDisabled();
// 复制按钮：点键名旁边的复制
const copyButtons = page.locator('button[aria-label*="复制"], button[aria-label*="Copy"]');
const copyCount = await copyButtons.count();
let clipboard = null;
if (copyCount) {
  await copyButtons.first().click();
  await page.waitForTimeout(800);
  clipboard = await page.evaluate(() => navigator.clipboard.readText().catch(() => "READ_FAILED"));
}
console.log(JSON.stringify({ chars: text.length, regenCount, regenDisabled, copyCount, clipboard }, null, 1));
await browser.close();
