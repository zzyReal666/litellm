import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1800);
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click().catch(()=>{});
await page.waitForTimeout(2600);
await page.getByRole("tab", { name: "设置", exact: true }).first().click();
await page.waitForTimeout(1500);
const edit = page.locator("button:visible", { hasText: "编辑设置" }).first();
if (await edit.count()) { await edit.click(); await page.waitForTimeout(1600); }
for (const [label, re] of [["tpm", /TPM/], ["max", /最大预算|Max Budget/], ["soft", /软预算|Soft Budget/]]) {
  const inp = page.getByRole("spinbutton", { name: re }).first();
  if (await inp.count()) {
    await inp.fill("999999999999999999999999999999");
    await page.waitForTimeout(1400);
    out[`${label}_realtime`] = /请输入非负整数/.test(await text());
  } else { out[`${label}_count`] = 0; }
}
fs.writeFileSync("/tmp/verify_v38_final.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1));
await browser.close();
