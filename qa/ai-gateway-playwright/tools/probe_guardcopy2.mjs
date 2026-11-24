import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true, permissions: ["clipboard-read","clipboard-write"] });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);
await page.goto(`${BASE}/ui/guardrails?guardrail=62959465-c7fd-452e-b2fe-99a429360ea7`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const p = Array.from(document.querySelectorAll("p")).find((el) => /[0-9a-f]{8}-[0-9a-f]{4}/.test(el.textContent || ""));
  return p ? { text: p.textContent.trim(), siblingButtons: p.parentElement ? p.parentElement.querySelectorAll("button").length : 0 } : { text: null };
});
console.log("id element:", JSON.stringify(info));
if (info.text) {
  const btn = page.getByText(info.text, { exact: true }).first().locator("xpath=../button");
  console.log("btn count:", await btn.count());
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(1500); }
  const toasts = await page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => "read_failed"));
  console.log("toasts:", JSON.stringify(toasts), "| clipboard:", clip);
}
await browser.close();
