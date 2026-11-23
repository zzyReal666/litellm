import { chromium } from "playwright-core";
import fs from "node:fs";
const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({ channel: "chrome", headless: true, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
await page.goto(`${BASE}/user-login.html`, { waitUntil: "domcontentloaded" });
await page.fill("#account", "zhongyuanzhang");
await page.fill("#password", "zzy@7856325A");
await page.click("#submit");
await page.waitForURL(/my\.html/, { timeout: 30000 });
await page.goto(`${BASE}/qa.html`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const qa = page.frames()[page.frames().length - 1];

const rows = [];
for (let p = 1; p <= 3; p++) {
  await qa.goto(`${BASE}/bug-browse-45.html?pageID=${p}`, { waitUntil: "networkidle", timeout: 30000 });
  await qa.waitForTimeout(1200);
  const pageRows = await qa.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="bug-view-"]'));
    return links.map((a) => {
      const href = a.getAttribute("href") || "";
      const id = (href.match(/bug-view-(\d+)/) || [])[1];
      const title = (a.getAttribute("title") || a.textContent || "").trim();
      const tr = a.closest("tr");
      const cells = tr ? Array.from(tr.querySelectorAll("td")).map((td) => (td.innerText || "").trim().replace(/\s+/g, " ")) : [];
      return { id, title, cells };
    }).filter((r) => r.id);
  });
  rows.push(...pageRows);
}
const seen = new Set();
const unique = rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
fs.writeFileSync("/tmp/bugs45.json", JSON.stringify(unique, null, 1));
console.log("共抓取", unique.length, "条");
console.log(JSON.stringify(unique.slice(0, 3), null, 1));
await browser.close();
