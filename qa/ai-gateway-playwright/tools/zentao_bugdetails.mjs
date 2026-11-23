import { chromium } from "playwright-core";
import fs from "node:fs";
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

const ids = JSON.parse(fs.readFileSync("/tmp/bugs45c.json", "utf8")).rows.map((r) => r[0]);
const out = {};
for (const id of ids) {
  try {
    await qa.goto(`${BASE}/bug-view-${id}.html`, { waitUntil: "networkidle", timeout: 20000 });
    await qa.waitForTimeout(400);
    const data = await qa.evaluate(() => {
      const text = document.body.innerText;
      const title = (document.querySelector("h1, .page-title, .detail-title")?.innerText || document.title || "").trim();
      const fields = {};
      document.querySelectorAll("tr, .detail-row, .legend-row").forEach((row) => {
        const cells = Array.from(row.querySelectorAll("th, td, .legend-cell, .legend-label")).map((c) => (c.innerText || "").trim().replace(/\s+/g, " "));
        if (cells.length >= 2 && cells[0] && cells[0].length < 24) fields[cells[0]] = cells.slice(1).join(" | ").slice(0, 400);
      });
      return { text: text.slice(0, 4000), title, fields };
    });
    out[id] = data;
  } catch (e) { out[id] = { error: String(e).slice(0, 100) }; }
}
fs.writeFileSync("/tmp/bug_details.json", JSON.stringify(out, null, 1));
console.log("抓取详情:", Object.keys(out).length);
await browser.close();
