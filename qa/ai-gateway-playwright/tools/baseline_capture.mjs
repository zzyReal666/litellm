import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true });
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
const pages = {
  models: "/ui/models-and-endpoints/",
  model_add: "/ui/models-and-endpoints/?tab=add-model",
  keys: "/ui/api-keys/",
  users: "/ui/users/",
  teams: "/ui/teams/",
  guardrails: "/ui/guardrails/",
  license: "/ui/product-license/",
  logs: "/ui/logs/",
  cost: "/ui/cost-optimization/",
  usage: "/ui/usage/",
};
const out = {};
for (const [k, path] of Object.entries(pages)) {
  await page.goto(`${env.AIG_BASE_URL}${path}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1800);
  out[k] = { url: page.url(), text: await page.evaluate(() => document.body.innerText.slice(0, 4000)) };
}
fs.writeFileSync("/tmp/baseline_pages.json", JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(k, "->", v.url, "chars", v.text.length);
await browser.close();
