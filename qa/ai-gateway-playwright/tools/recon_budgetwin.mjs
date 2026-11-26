import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, ignoreHTTPSErrors: true });
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
// 打开第一个密钥详情
const firstKey = page.locator("tbody tr").first();
await firstKey.click(); await page.waitForTimeout(2500);
let text = await page.evaluate(()=>document.body.innerText);
const out = { hasBudgetWindows: /预算窗口/.test(text) };
if (!out.hasBudgetWindows) {
  // 可能需要在详情页点「编辑」
  const edit = page.getByRole("button", { name: /^编辑$|编辑密钥|Edit/ }).first();
  out.editBtn = await edit.count();
  if (await edit.count()) { await edit.click(); await page.waitForTimeout(2000); text = await page.evaluate(()=>document.body.innerText); out.hasBudgetWindowsAfterEdit = /预算窗口/.test(text); }
}
const addWin = page.getByRole("button", { name: /添加预算窗口/ }).first();
out.addWinBtn = await addWin.count();
if (await addWin.count()) {
  await addWin.click(); await page.waitForTimeout(800);
  const combos = page.locator('[role="combobox"]');
  out.comboCount = await combos.count();
  const values = [];
  for (let i=0;i<out.comboCount;i++) values.push(await combos.nth(i).innerText().catch(()=>"?"));
  out.comboTexts = values;
  // 找预算窗口的那个 combo（在添加预算窗口按钮附近）
  if (out.comboCount) {
    for (let i=out.comboCount-1;i>=0;i--) {
      await combos.nth(i).click().catch(()=>{});
      await page.waitForTimeout(600);
      const opts = await page.locator('[role="option"]').allInnerTexts().catch(()=>[]);
      if (opts.some(o=>/小时|每日|每天|每周|每月/.test(o)) || opts.some(o=>/Hourly|Daily|Weekly/.test(o))) { out.budgetOptions = opts; break; }
      await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    }
  }
}
fs.writeFileSync("/tmp/recon_budgetwin.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,2000));
await browser.close();
