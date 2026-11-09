import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.AIG_BASE_URL || "http://192.168.7.112:4000";
const USER = process.env.AIG_USER || "admin@sinocipher.local";
const PASS = process.env.AIG_PASS || "";
const OUT = "/tmp/aig-probe";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

await page.goto(`${BASE}/ui/login`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT}/01-login.png`, fullPage: true });
const inputs = await page.locator("input").evaluateAll((els) =>
  els.map((e) => ({ type: e.type, name: e.name, placeholder: e.placeholder, ariaLabel: e.getAttribute("aria-label") })),
);
console.log("INPUTS", JSON.stringify(inputs));

await page.locator('input[name="username"]').waitFor({ state: "visible", timeout: 20000 });
await page.locator('input[name="username"]').fill(USER);
await page.locator('input[name="password"]').fill(PASS);
await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Sign In")').first().click();
await page.waitForTimeout(6000);
console.log("URL_AFTER_LOGIN", page.url());
await page.screenshot({ path: `${OUT}/02-after-login.png`, fullPage: true });

const links = await page.locator("a[href]").evaluateAll((els) =>
  els.map((e) => ({ href: e.getAttribute("href"), text: (e.textContent || "").trim().slice(0, 40) })).filter((x) => x.text),
);
console.log("LINKS", JSON.stringify(links, null, 1));

fs.writeFileSync(`${OUT}/links.json`, JSON.stringify(links, null, 2));
await browser.close();
