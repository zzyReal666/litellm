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
await page.waitForTimeout(2000);
const navText = await page.evaluate(() => document.querySelector('[data-slot="sidebar"]')?.innerText ?? "");
out.lensHidden = !/链路分析/.test(navText);
out.obsVisible = { usage: /用量/.test(navText), logs: /日志/.test(navText), guardMonitor: /护栏监控/.test(navText) };
// 用户别名限制
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);
const menus = page.getByRole("button", { name: /打开用户操作菜单/ });
await menus.nth(1).click(); await page.waitForTimeout(700);
await page.getByRole("menuitem", { name: "编辑用户" }).first().click();
await page.waitForTimeout(1800);
const alias = page.getByRole("textbox", { name: /用户别名|User Alias/ }).first();
out.aliasFound = await alias.count();
if (out.aliasFound) {
  out.aliasMaxLength = await alias.getAttribute("maxlength");
  const hint = await text();
  out.aliasHintVisible = /最多 255 个字符/.test(hint);
  await alias.fill("y".repeat(400));
  out.aliasCapped = (await alias.inputValue()).length;
}
fs.writeFileSync("/tmp/verify_v39.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1));
await browser.close();
