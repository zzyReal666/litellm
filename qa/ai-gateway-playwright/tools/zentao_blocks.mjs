import { chromium } from "playwright-core";
const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({ channel: "chrome", headless: true, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
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
  const blocks = Array.from(document.querySelectorAll(".dtable-block.dtable-body .dtable-cells"));
  return blocks.map((b) => ({
    cls: String(b.className).slice(0, 40),
    header: Array.from(b.querySelectorAll(".dtable-header-cell")).map((h) => (h.innerText || "").trim()).slice(0, 3),
    cells: Array.from(b.querySelectorAll(".dtable-cell")).slice(0, 3).map((c) => (c.innerText || "").trim().replace(/\s+/g, " ").slice(0, 40)),
    count: b.querySelectorAll(".dtable-cell").length,
  }));
});
console.log(JSON.stringify(info, null, 1).slice(0, 3000));
await browser.close();
