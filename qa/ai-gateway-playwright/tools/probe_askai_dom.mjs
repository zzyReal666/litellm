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
await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /询问 AI/ }).first().click();
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const panel = document.querySelector('[data-testid="usage-ai-chat-panel"]');
  const scope = panel || document.body;
  return {
    inputs: Array.from(scope.querySelectorAll("input,textarea,[role=combobox]")).map((e) => ({
      tag: e.tagName, role: e.getAttribute("role"), ph: e.getAttribute("placeholder"), aria: e.getAttribute("aria-label"), id: e.id,
    })),
    buttons: Array.from(scope.querySelectorAll("button")).map((b) => ({ text: (b.innerText||"").trim().slice(0,30), aria: b.getAttribute("aria-label") })).slice(0,20),
  };
});
fs.writeFileSync("/tmp/probe_askai_dom.json", JSON.stringify(info, null, 1));
console.log(JSON.stringify(info, null, 1).slice(0, 3000));
await browser.close();
