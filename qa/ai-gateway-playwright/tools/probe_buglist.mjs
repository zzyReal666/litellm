import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const base = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, ignoreHTTPSErrors: true });
const log = [];
await page.goto(`${base}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);

async function dump(name, url) {
  await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(`/tmp/probe_${name}.txt`, text);
  log.push(`${name}: ${text.length} chars`);
}

await dump("keys", "/ui/api-keys");
await dump("models", "/ui/models-and-endpoints");
await dump("guardrails", "/ui/guardrails");
await dump("users", "/ui/users");
await dump("costopt", "/ui/cost-optimization");
console.log(log.join("\n"));
await browser.close();
