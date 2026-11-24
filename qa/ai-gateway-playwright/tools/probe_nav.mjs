import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 }, ignoreHTTPSErrors: true });
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(2500);
const nav = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('nav a, aside a, [data-slot="sidebar"] a'));
  return links.map((a) => (a.innerText || "").trim()).filter(Boolean);
});
fs.writeFileSync("/tmp/nav_labels.txt", nav.join("\n"));
console.log(nav.slice(0, 45).join(" | "));
await browser.close();
