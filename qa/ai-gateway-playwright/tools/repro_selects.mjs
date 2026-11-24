import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1200);
const dumpSelects = async (label) => {
  const triggers = page.locator('[data-slot="select-trigger"]');
  const n = await triggers.count();
  const arr = [];
  for (let i = 0; i < n; i++) {
    const text = (await triggers.nth(i).innerText().catch(() => "")).trim();
    await triggers.nth(i).click().catch(() => {});
    await page.waitForTimeout(500);
    const opts = await page.evaluate(() => Array.from(document.querySelectorAll("[role=option]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).slice(0, 10));
    arr.push({ index: i, text, opts });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
  out[label] = arr;
};
// 默认用户设置编辑
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByRole("tab", { name: /默认用户设置/ }).first().click();
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /编辑设置/ }).first().click();
await page.waitForTimeout(1500);
await dumpSelects("default_settings");
// 保存状态恢复（刷新）
// 用户编辑
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const menus = page.getByLabel(/打开用户操作菜单/);
const cnt = await menus.count();
if (cnt > 1) { await menus.nth(1).click(); await page.waitForTimeout(600); }
const editUser = page.getByText(/^编辑用户$/).first();
if (await editUser.count()) { await editUser.click(); await page.waitForTimeout(2200); await dumpSelects("user_edit"); }
fs.writeFileSync("/tmp/repro_selects.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
await browser.close();
