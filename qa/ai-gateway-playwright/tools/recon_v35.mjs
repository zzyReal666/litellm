import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
const bodyText = () => page.evaluate(() => document.body.innerText);
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1800);

// 1) 虚拟密钥 -> 创建密钥 -> 预算窗口
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const createKey = page.getByRole("button", { name: /创建密钥|新建密钥/ }).first();
out.createKeyBtn = await createKey.count();
if (await createKey.count()) {
  await createKey.click(); await page.waitForTimeout(2000);
  const t = await bodyText();
  out.createKeyHasBudgetWindows = /预算窗口/.test(t);
  const addWin = page.getByRole("button", { name: /添加预算窗口/ }).first();
  out.addWinBtn = await addWin.count();
  if (await addWin.count()) {
    await addWin.click(); await page.waitForTimeout(800);
    const selects = page.locator('[role="combobox"]');
    out.comboCount = await selects.count();
    if (out.comboCount) {
      await selects.last().click(); await page.waitForTimeout(800);
      out.budgetWindowOptions = await page.locator('[role="option"]').allInnerTexts();
      await page.keyboard.press("Escape");
    }
  }
  // close dialog
  await page.keyboard.press("Escape"); await page.waitForTimeout(500);
}
// 2) 请求日志排序
await page.goto(`${BASE}/ui/logs`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const sortBtns = page.locator('[data-testid^="sort-trigger-"]');
out.sortTriggerCount = await sortBtns.count();
if (out.sortTriggerCount) {
  await sortBtns.first().click(); await page.waitForTimeout(600);
  out.sortMenu = await page.locator('[role="menuitem"]').allInnerTexts();
  await page.keyboard.press("Escape");
}
// 3) 用量导出
await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const exportBtn = page.getByRole("button", { name: /导出数据/ }).first();
out.exportBtn = await exportBtn.count();
if (await exportBtn.count()) {
  await exportBtn.click(); await page.waitForTimeout(1500);
  out.exportDialogText = (await bodyText()).slice(-1500);
}
fs.writeFileSync("/tmp/recon_v35.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 3500));
await browser.close();
