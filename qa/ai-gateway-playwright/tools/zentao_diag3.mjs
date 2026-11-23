import { chromium } from "playwright-core";
const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({ channel: "chrome", headless: true, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const bad = [], perr = [];
page.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
page.on("pageerror", (e) => perr.push(String(e).slice(0, 200)));
await page.goto(`${BASE}/user-login.html`, { waitUntil: "domcontentloaded" });
await page.fill("#account", "zhongyuanzhang");
await page.fill("#password", "zzy@7856325A");
await page.click("#submit");
await page.waitForURL(/my\.html/, { timeout: 30000 });
for (const u of [
  "index.php?m=bug&f=view&bugID=1590",
  "index.php?m=my&f=bug",
  "index.php?m=bug&f=browse&productID=1",
]) {
  await page.goto(`${BASE}/${u}`, { waitUntil: "networkidle" }).catch((e) => console.log("goto fail", u, String(e).slice(0, 80)));
  await page.waitForTimeout(2000);
  const text = await page.evaluate(() => document.body.innerText);
  console.log(`--- ${u} | len=${text.length} | url=${page.url()}`);
  console.log(text.slice(0, 260).replace(/\n+/g, " | "));
}
console.log("BAD:", bad.slice(0, 8));
console.log("PERR:", perr.slice(0, 5));
await browser.close();
