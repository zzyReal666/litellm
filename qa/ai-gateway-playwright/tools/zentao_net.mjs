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
const hits = [];
qa.on("response", async (r) => {
  const ct = (r.headers()["content-type"] || "").toLowerCase();
  const u = r.url();
  if (ct.includes("json") || /dtable|bug-browse|ajax/.test(u)) {
    try { const body = await r.text(); hits.push({ u: u.slice(0, 200), ct, body: body.slice(0, 400) }); } catch {}
  }
});
await qa.goto(`${BASE}/bug-browse-45.html`, { waitUntil: "networkidle" });
await qa.waitForTimeout(3000);
console.log("命中:", hits.length);
for (const h of hits.slice(0, 10)) console.log("---", h.u, "\n", h.body.slice(0, 300));
await browser.close();
