import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.env.AIG_BASE_URL || "http://192.168.7.112:4000";
const USER = process.env.AIG_USER || "admin@sinocipher.local";
const PASS = process.env.AIG_PASS || "";
const ROUTES = (process.env.AIG_ROUTES || "").split(",").filter(Boolean);
const OUT = "/tmp/aig-dump";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true });
const page = await context.newPage();

await page.goto(`${BASE}/ui/login`, { waitUntil: "networkidle" });
await page.locator('input[name="username"]').fill(USER);
await page.locator('input[name="password"]').fill(PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success|home/, { timeout: 30000 });

for (const route of ROUTES) {
  const name = route.replace(/[^\w]+/g, "_") || "root";
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const buttons = await page.locator("button:visible").evaluateAll((els) =>
    els.map((e) => (e.textContent || "").trim()).filter(Boolean).slice(0, 40),
  );
  const headings = await page.locator("h1:visible, h2:visible, h3:visible").evaluateAll((els) =>
    els.map((e) => (e.textContent || "").trim()).filter(Boolean).slice(0, 30),
  );
  const inputs = await page.locator("input:visible, select:visible, textarea:visible").evaluateAll((els) =>
    els.map((e) => ({ tag: e.tagName.toLowerCase(), name: e.name, placeholder: e.placeholder, type: e.type, aria: e.getAttribute("aria-label") })),
  );
  const ths = await page.locator("th:visible").evaluateAll((els) => els.map((e) => (e.textContent || "").trim()).slice(0, 30));
  const bodyText = (await page.locator("body").innerText()).slice(0, 1200);
  console.log("=".repeat(70));
  console.log("ROUTE", route);
  console.log("HEADINGS", JSON.stringify(headings));
  console.log("BUTTONS", JSON.stringify(buttons));
  console.log("TH", JSON.stringify(ths));
  console.log("INPUTS", JSON.stringify(inputs));
  console.log("TEXT", bodyText.replace(/\n{2,}/g, "\n").slice(0, 900));
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
}
await browser.close();
