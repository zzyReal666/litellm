import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map((l)=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const base = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1500 }, ignoreHTTPSErrors: true });
await page.goto(`${base}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
await page.goto(`${base}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const btns = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map((b) => ({ label: (b.getAttribute("aria-label") || "").trim(), text: (b.innerText || "").trim() })).filter((b) => b.label || b.text));
fs.writeFileSync("/tmp/keys_buttons.json", JSON.stringify(btns, null, 1));
const create = page.getByRole("button", { name: /新建密钥|创建/ }).first();
console.log("createCount:", await create.count());
if (await create.count()) {
  await create.click();
  await page.waitForTimeout(2000);
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync("/tmp/createkey_dialog.txt", text);
  console.log("dialog chars:", text.length);
} else {
  console.log("buttons:", btns.slice(0, 15).map((b) => b.label || b.text).join(" | "));
}
await browser.close();
