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

const grab = () => qa.evaluate(() => {
  const cat = (sel) => {
    const blocks = Array.from(document.querySelectorAll(sel));
    return blocks.map((b) => Array.from(b.querySelectorAll(".dtable-cell")).map((c) => (c.innerText || "").trim().replace(/\s+/g, " ")));
  };
  const headLeft = cat(".dtable-block.dtable-header .dtable-cells.dtable-fixed-left")[0] || [];
  const headCenter = cat(".dtable-block.dtable-header .dtable-cells.dtable-scroll-center")[0] || [];
  const headRight = cat(".dtable-block.dtable-header .dtable-cells.dtable-fixed-right")[0] || [];
  const bodyLeft = cat(".dtable-block.dtable-body .dtable-cells.dtable-fixed-left")[0] || [];
  const bodyCenter = cat(".dtable-block.dtable-body .dtable-cells.dtable-scroll-center")[0] || [];
  const bodyRight = cat(".dtable-block.dtable-body .dtable-cells.dtable-fixed-right")[0] || [];
  return { headers: [...headLeft, ...headCenter, ...headRight], bodyLeft, bodyCenter, bodyRight };
});

const urls = [`${BASE}/bug-browse-45.html`, `${BASE}/bug-browse-45---0--46-20-2-bug-0.html`, `${BASE}/bug-browse-45---0--46-20-3-bug-0.html`];
const all = [];
let headers = null;
for (const u of urls) {
  await qa.goto(u, { waitUntil: "networkidle" });
  await qa.waitForTimeout(1200);
  const { headers: h, bodyLeft, bodyCenter, bodyRight } = await grab();
  if (!headers) headers = h;
  const rows = bodyLeft.length / 2;
  for (let i = 0; i < rows; i++) {
    const left = bodyLeft.slice(i * 2, i * 2 + 2);
    const center = bodyCenter.slice(i * 8, i * 8 + 8);
    const right = [bodyRight[i] ?? ""];
    all.push([...left, ...center, ...right]);
  }
}
console.log("headers:", JSON.stringify(headers));
console.log("rows:", all.length);
fs.writeFileSync("/tmp/bugs45c.json", JSON.stringify({ headers, rows: all }, null, 1));
console.log(JSON.stringify(all.slice(0, 3), null, 1).slice(0, 1200));
await browser.close();
