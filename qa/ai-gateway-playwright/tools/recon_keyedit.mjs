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
await page.waitForTimeout(2600);
await page.getByRole("tab", { name: "设置", exact: true }).first().click();
await page.waitForTimeout(2000);
const out = {
  visibleButtons: await page.locator("button:visible").evaluateAll(els => els.map(e=>(e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean)),
  text: (await page.evaluate(()=>document.body.innerText)).slice(-2000),
  numberInputs: await page.evaluate(() => Array.from(document.querySelectorAll('input[type="number"]')).map(i => ({name:i.getAttribute("name"), label:i.getAttribute("aria-label")}))),
};
console.log(JSON.stringify(out,null,1).slice(0,3000));
await browser.close();
