import { chromium } from "playwright-core";
const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({ channel: "chrome", headless: true, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/user-login.html`, { waitUntil: "domcontentloaded" });
await page.fill("#account", "zhongyuanzhang");
await page.fill("#password", "zzy@7856325A");
await page.click("#submit");
await page.waitForURL(/my\.html/, { timeout: 30000 });
await page.goto(`${BASE}/bug-view-1590.html`, { waitUntil: "networkidle" });
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(1000);
  const frames = page.frames().map((f) => f.url());
  if (frames.length > 1 && frames[1]) { console.log("frames:", frames); break; }
  if (i === 11) { console.log("仍然只有:", frames); console.log(await page.evaluate(() => document.querySelector("#appIframe-qa")?.outerHTML?.slice(0, 400))); }
}
const frameUrls = page.frames().map((f) => f.url());
console.log("frameUrls:", frameUrls);
// 尝试 onlybody
await page.goto(`${BASE}/bug-view-1590.html?onlybody=yes`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
console.log("onlybody text len:", (await page.evaluate(() => document.body.innerText)).length);
console.log((await page.evaluate(() => document.body.innerText)).slice(0, 500));
await browser.close();
