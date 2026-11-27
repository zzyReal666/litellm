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
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2800);
const out = {
  url: page.url(),
  visibleButtons: await page.locator("button:visible").evaluateAll(els => els.map(e=>(e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean)),
  tabs: await page.evaluate(() => Array.from(document.querySelectorAll('[role="tab"],[role="tablist"] button')).map(e=>(e.innerText||"").trim())),
  texts: (await page.evaluate(()=>document.body.innerText)).slice(-2200),
};
fs.writeFileSync("/tmp/recon_keydetail.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3500));
await browser.close();
