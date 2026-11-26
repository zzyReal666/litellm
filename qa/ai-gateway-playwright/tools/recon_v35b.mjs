import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, ignoreHTTPSErrors: true });
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);
const out = {};
// 团队行 DOM
await page.goto(`${BASE}/ui/teams`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
out.teamRowHtml = await page.evaluate(() => {
  const tr = document.querySelector("tbody tr");
  return tr ? tr.outerHTML.slice(0, 1200) : null;
});
out.buttons = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b=>(b.innerText||"").trim()).filter(Boolean).slice(0,20));
// 护栏页按钮
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
out.guardButtons = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b=>(b.innerText||"").trim()).filter(Boolean).slice(0,20));
fs.writeFileSync("/tmp/recon_v35b.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,2500));
await browser.close();
