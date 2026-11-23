import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read", "clipboard-write"] });
const page = await ctx.newPage();
const out = {};
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForTimeout(4000);

// 1605 详情时间字段
await page.goto(`${env.AIG_BASE_URL}/ui/models-and-endpoints/?model=d1af9369-7d21-435c-9ae5-09c26f1eb179`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const detail = await page.evaluate(() => document.body.innerText);
out.detail_times = { created: /创建时间/.test(detail), updated: /更新时间/.test(detail), updatedValue: (detail.match(/更新时间[：: ]*([0-9-]+[^ \n]*)/) || [])[1] || null };

// 1597 复制按钮真实写入剪贴板
await page.goto(`${env.AIG_BASE_URL}/ui/api-keys/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.getByText("bugtest-key", { exact: false }).first().click();
await page.waitForTimeout(1800);
const copyBtn = page.getByRole("button", { name: /复制/ }).first();
if (await copyBtn.count()) {
  await copyBtn.click();
  await page.waitForTimeout(600);
  out.clipboard = (await page.evaluate(() => navigator.clipboard.readText().catch(() => ""))).slice(0, 80);
} else out.clipboard = "no copy button";
fs.writeFileSync("/tmp/probe_extra.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await browser.close();
