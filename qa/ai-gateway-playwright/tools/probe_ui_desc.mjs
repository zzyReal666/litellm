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
await page.waitForTimeout(2000);
await page.goto(`${BASE}/ui/admin-panel`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2800);
await page.getByRole("tab", { name: "界面设置", exact: true }).first().click();
await page.waitForTimeout(2000);
const info = await page.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const found = [];
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent || "";
    if (t.includes("Configuration for UI-specific flags") || t.includes("Serve web search tool calls")) {
      let el = walker.currentNode.parentElement;
      const chain = [];
      for (let i = 0; i < 5 && el; i++) { chain.push(el.tagName + "." + (el.className || "").toString().slice(0, 60)); el = el.parentElement; }
      found.push({ text: t.slice(0, 120), chain });
    }
  }
  return found;
});
fs.writeFileSync("/tmp/probe_ui_desc.json", JSON.stringify(info, null, 1));
console.log(JSON.stringify(info, null, 1).slice(0, 3000));
await browser.close();
