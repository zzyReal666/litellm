import { chromium } from "playwright-core";
import fs from "node:fs";

const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1500, height: 950 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read", "clipboard-write"] });
const page = await context.newPage();
const out = {};

await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
// 登录页：密码可见性 + 错误提示
await page.locator('input[name="password"]').fill("wrong-password");
await page.locator('button[type="submit"]').first().click();
await page.waitForTimeout(2500);
out.login_error = (await page.evaluate(() => document.body.innerText)).slice(0, 600);
const pw = page.locator('input[name="password"]').first();
const before = await pw.getAttribute("type").catch(() => null);
const eye = page.locator('button[aria-label*="assword"], button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)').first();
if (await eye.count()) { await eye.click(); await page.waitForTimeout(300); }
const after = await page.locator('input[name="password"]').first().getAttribute("type").catch(() => null);
out.password_toggle = { before, after };

await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/, { timeout: 30000 });
await page.waitForTimeout(1500);

const grab = async (path, key) => {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(1800);
  out[key] = await page.evaluate(() => document.body.innerText.slice(0, 6000));
};

await grab("/ui/models-and-endpoints/", "models");
// 打开第一个模型详情
const modelLink = page.locator('a[href*="model"], td a, [role="row"] a').first();
await grab("/ui/api-keys/", "keys");
await grab("/ui/users/", "users");
await grab("/ui/teams/", "teams");
await grab("/ui/guardrails/", "guardrails");
await grab("/ui/product-license/", "license");
await grab("/ui/logs/", "logs");
await grab("/ui/cost-optimization/", "cost");
await grab("/ui/usage/", "usage");

fs.writeFileSync("/tmp/verify_bugs.json", JSON.stringify(out, null, 1));
console.log("captured:", Object.keys(out).join(", "));
await browser.close();
