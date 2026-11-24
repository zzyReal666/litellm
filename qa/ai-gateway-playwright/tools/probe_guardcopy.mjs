import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("verify-guard-id", { exact: true }).first().click();
await page.waitForTimeout(2500);
console.log("PAGE TAIL:", (await page.evaluate(() => document.body.innerText)).slice(-1200));
const info = await page.evaluate(() => {
  const p = Array.from(document.querySelectorAll("p")).find((el) => /[0-9a-f]{8}-[0-9a-f]{4}/.test(el.textContent || ""));
  if (!p) return { found: false };
  const parent = p.parentElement;
  return { found: true, text: p.textContent.trim(), parentHtml: parent ? parent.outerHTML.slice(0, 500) : null };
});
fs.writeFileSync("/tmp/probe_guardcopy.json", JSON.stringify(info, null, 1));
console.log(JSON.stringify(info).slice(0, 800));
const idText = info.text;
if (idText) {
  const idEl = page.getByText(idText, { exact: true }).first();
  const btn = idEl.locator("xpath=../button");
  console.log("btn count:", await btn.count());
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(1200); }
  const toasts = await page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
  console.log("toasts:", JSON.stringify(toasts));
}
await browser.close();
