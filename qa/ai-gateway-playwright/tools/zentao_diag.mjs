import { chromium } from "playwright-core";
const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({ channel: "chrome", headless: true, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [], failed = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
page.on("requestfailed", (r) => failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`));
await page.goto(`${BASE}/user-login.html`, { waitUntil: "domcontentloaded" });
await page.fill("#account", "zhongyuanzhang");
await page.fill("#password", "zzy@7856325A");
await page.click("#submit");
await page.waitForURL(/my\.html/, { timeout: 30000 });
await page.goto(`${BASE}/bug-view-1590.html`, { waitUntil: "networkidle" });
await page.waitForTimeout(4000);
const info = await page.evaluate(() => ({
  htmlLen: document.documentElement.outerHTML.length,
  bodyChildren: document.body.children.length,
  mainIds: Array.from(document.querySelectorAll("[id]")).map((e) => e.id).slice(0, 40),
  iframes: Array.from(document.querySelectorAll("iframe")).map((f) => f.src),
  text: document.body.innerText.slice(0, 600),
}));
console.log(JSON.stringify({ info, errors: errors.slice(0, 5), failed: failed.slice(0, 8) }, null, 1));
await browser.close();
