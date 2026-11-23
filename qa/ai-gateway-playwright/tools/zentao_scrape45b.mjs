import { chromium } from "playwright-core";
import fs from "node:fs";
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

const parseRows = () => qa.evaluate(() => {
  const rows = Array.from(document.querySelectorAll(".dtable-row"));
  return rows.map((row) => {
    const link = row.querySelector('a[href*="bug-view-"]');
    const id = link ? (link.getAttribute("href").match(/bug-view-(\d+)/) || [])[1] : null;
    const cells = Array.from(row.querySelectorAll(".dtable-cell")).map((c) => (c.innerText || "").trim().replace(/\s+/g, " "));
    return id ? { id, cells } : null;
  }).filter(Boolean);
});

let all = [];
await qa.goto(`${BASE}/bug-browse-45.html`, { waitUntil: "networkidle" });
await qa.waitForTimeout(1200);
all.push(...(await parseRows()));
for (const p of [2, 3]) {
  await qa.goto(`${BASE}/bug-browse-45---0--46-20-${p}-bug-0.html`, { waitUntil: "networkidle" });
  await qa.waitForTimeout(1200);
  all.push(...(await parseRows()));
}
fs.writeFileSync("/tmp/bugs45b.json", JSON.stringify(all, null, 1));
console.log("rows:", all.length);
console.log(JSON.stringify(all.slice(0, 2), null, 1));
await browser.close();
