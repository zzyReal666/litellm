import { chromium } from "playwright-core";
const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({ channel: "chrome", headless: true, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/user-login.html`, { waitUntil: "domcontentloaded" });
await page.fill("#account", "zhongyuanzhang");
await page.fill("#password", "zzy@7856325A");
await page.click("#submit");
await page.waitForURL(/my\.html/, { timeout: 30000 });
await page.getByText("测试", { exact: true }).first().click();
await page.waitForTimeout(4000);
console.log("after 测试 click url:", page.url());
console.log("frames:", page.frames().map((f) => f.url()));
const iframeInfo = await page.evaluate(() => Array.from(document.querySelectorAll("iframe")).map((f) => ({ id: f.id, src: f.getAttribute("src"), visible: f.offsetParent !== null })));
console.log("iframes:", JSON.stringify(iframeInfo));
// 打印 iframe 内部文本（如果有）
for (const f of page.frames().slice(1)) {
  try { console.log("frame", f.url(), "text:", (await f.evaluate(() => document.body?.innerText || "")).slice(0, 300).replace(/\n+/g, " | ")); } catch (e) { console.log("frame err", String(e).slice(0, 80)); }
}
await page.screenshot({ path: "/tmp/zentao_qa.png" });
await browser.close();
