import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = "http://192.168.6.253:8081/zentao";
const browser = await chromium.launch({ channel: "chrome", headless: true, proxy: { server: "socks5://127.0.0.1:1087" } });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/user-login.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.fill("#account", "zhongyuanzhang");
await page.fill("#password", "zzy@7856325A");
await page.click("#submit");
await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(2000);
console.log("URL:", page.url());
console.log("TITLE:", await page.title());
fs.writeFileSync("/tmp/zentao_home.txt", await page.evaluate(() => document.body.innerText));
const links = await page.evaluate(() => Array.from(document.querySelectorAll("a")).map((a) => `${(a.innerText || "").trim().slice(0, 20)} => ${a.getAttribute("href")}`).filter((x) => x.includes("=>") && !x.startsWith(" =>")).slice(0, 80));
fs.writeFileSync("/tmp/zentao_links.txt", links.join("\n"));
await page.screenshot({ path: "/tmp/zentao_home.png" });
// 打开指定 bug
await page.goto(`${BASE}/bug-view-1590.html`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
console.log("BUG URL:", page.url());
fs.writeFileSync("/tmp/zentao_bug1590.txt", await page.evaluate(() => document.body.innerText));
await page.screenshot({ path: "/tmp/zentao_bug1590.png" });
await browser.close();
