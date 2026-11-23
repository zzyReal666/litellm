import { chromium } from "playwright-core";
const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({ channel: "chrome", headless: true, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
await page.goto(`${BASE}/user-login.html`, { waitUntil: "domcontentloaded" });
await page.fill("#account", "zhongyuanzhang");
await page.fill("#password", "zzy@7856325A");
await page.click("#submit");
await page.waitForURL(/my\.html/);
await page.goto(`${BASE}/qa.html`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const qa = page.frames()[page.frames().length - 1];
await qa.goto(`${BASE}/bug-browse-45.html`, { waitUntil: "networkidle" });
await qa.waitForTimeout(1500);
const info = await qa.evaluate(() => {
  const a = document.querySelector('a[href*="bug-view-"]');
  const chain = [];
  let el = a;
  while (el && chain.length < 8) { chain.push(el.tagName + "." + String(el.className).replace(/\s+/g, ".").slice(0, 80)); el = el.parentElement; }
  const dtableClasses = Array.from(new Set(Array.from(document.querySelectorAll('[class*="dtable"]')).map((e) => String(e.className).split(/\s+/).filter((c) => c.includes("dtable")).join(" ")))).slice(0, 20);
  const rowCount = document.querySelectorAll('[class*="dtable-row"]').length;
  const rowCount2 = document.querySelectorAll('.dtable-body > div, [class*="dtable-body"] > *').length;
  return { chain, dtableClasses, rowCount, rowCount2 };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
