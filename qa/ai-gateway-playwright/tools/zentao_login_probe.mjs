import { chromium } from "playwright-core";

const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  proxy: { server: "socks5://127.0.0.1:1087" },
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/user-login.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1500);
const form = await page.evaluate(() => ({
  title: document.title,
  fields: Array.from(document.querySelectorAll("input,button,select")).map((e) => ({
    tag: e.tagName, type: e.getAttribute("type"), name: e.getAttribute("name"),
    id: e.id, ph: e.getAttribute("placeholder"), txt: (e.innerText || "").trim().slice(0, 20),
  })),
}));
console.log(JSON.stringify(form, null, 1).slice(0, 2000));
await page.screenshot({ path: "/tmp/zentao_login.png" });
await browser.close();
