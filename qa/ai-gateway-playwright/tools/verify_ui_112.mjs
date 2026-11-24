import fs from "node:fs";
import { chromium } from "playwright";

const envPath = "/Users/zhangzhongyuan/IdeaProjects/litellm/qa/ai-gateway-playwright/.env";
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const BASE = "https://192.168.7.112";
const user = env.AIG_USER;
const pass = env.AIG_PASS;
const exe = process.env.HOME + "/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

const routes = {
  models: "/ui/models-and-endpoints/",
  guardrails: "/ui/guardrails/",
  apiKeys: "/ui/api-keys/",
  teams: "/ui/teams/",
  users: "/ui/users/",
  usage: "/ui/usage/",
  logs: "/ui/logs/",
  costOptimization: "/ui/cost-optimization/",
  license: "/ui/product-license/",
};

const result = { base: BASE, steps: [], errors: [] };
const browser = await chromium.launch({ executablePath: exe, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true, locale: "zh-CN" });

try {
  await page.goto(BASE + "/ui/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(pass);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !String(url).includes("/ui/login"), { timeout: 90000 });
  await page.waitForLoadState("domcontentloaded");
  result.steps.push({ step: "login", url: page.url(), ok: true });
} catch (e) {
  result.errors.push({ step: "login", message: String(e).slice(0, 300) });
}

for (const [name, path] of Object.entries(routes)) {
  const entry = { name, path };
  try {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1800);
    const breadcrumb = page.locator('[data-slot="breadcrumb-page"]').first();
    entry.breadcrumb = (await breadcrumb.count()) ? (await breadcrumb.textContent())?.trim() : null;
    entry.url = page.url();
    entry.title = await page.title();
    const bodyText = (await page.locator("body").innerText()).slice(0, 400);
    entry.sample = bodyText.replace(/\s+/g, " ").slice(0, 160);
    entry.ok = Boolean(entry.breadcrumb);
    await page.screenshot({ path: "/tmp/ui_" + name + ".png", fullPage: false });
  } catch (e) {
    entry.ok = false;
    entry.error = String(e).slice(0, 200);
  }
  result.steps.push(entry);
}

await browser.close();
fs.writeFileSync("/tmp/verify_ui_result.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 1));