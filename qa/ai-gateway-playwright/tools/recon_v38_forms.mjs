import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, ignoreHTTPSErrors: true });
const out = {};
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1600);

const buttonsAfter = async () => page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b=>(b.innerText||b.getAttribute("aria-label")||"").replace(/\s+/g," ").trim()).filter(Boolean).slice(0,40));

// 用户
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("zzypersonally@gmail.com", { exact: true }).first().click();
await page.waitForTimeout(2500);
out.userUrl = page.url();
out.userButtons = await buttonsAfter();
out.userText = (await page.evaluate(()=>document.body.innerText)).slice(-1200);
fs.writeFileSync("/tmp/recon_v38_forms.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3000));
await browser.close();
