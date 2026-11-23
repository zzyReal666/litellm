import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map((l)=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const base = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, ignoreHTTPSErrors: true });
const out = {};
await page.goto(`${base}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);

// 密钥操作菜单
await page.goto(`${base}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2500);
const buttons = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => (b.getAttribute("aria-label") || b.innerText || "").trim()).filter(Boolean));
out.keyButtons = buttons.filter((b) => /操作|菜单|更多|Action|menu|重置|删除|禁用/.test(b));
const moreBtn = page.getByRole("button", { name: /更多密钥操作|More key actions/ }).first();
if (await moreBtn.count()) {
  await moreBtn.click();
  await page.waitForTimeout(700);
  out.keyMenuItems = await page.evaluate(() => Array.from(document.querySelectorAll('[role="menuitem"], [role="menu"] button, [role="menu"] [role="menuitem"]')).map((e) => (e.innerText || "").trim()).filter(Boolean));
  const reset = page.getByText(/重置花费|Reset Spend/).first();
  if (await reset.count()) { await reset.click(); await page.waitForTimeout(800); out.resetDialog = await page.evaluate(() => document.body.innerText); }
}

// 护栏页面
await page.goto(`${base}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const gb = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => (b.getAttribute("aria-label") || b.innerText || "").trim()).filter(Boolean));
out.guardrailButtons = gb.filter((b) => /删除|Delete|编辑|Edit|操作/.test(b)).slice(0, 10);
fs.writeFileSync("/tmp/probe_dialogues.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 1800));
await browser.close();
