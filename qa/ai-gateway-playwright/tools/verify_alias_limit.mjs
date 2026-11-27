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
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);
const menus = page.getByRole("button", { name: /打开用户操作菜单/ });
await menus.nth(1).click(); await page.waitForTimeout(700);
await page.getByRole("menuitem", { name: "编辑用户" }).first().click();
await page.waitForTimeout(1800);
const alias = page.getByRole("textbox", { name: /用户别名|User Alias/ }).first();
out.aliasFound = await alias.count();
if (out.aliasFound) {
  out.maxlength = await alias.getAttribute("maxlength");
  await alias.fill("x".repeat(400));
  await page.waitForTimeout(300);
  const value = await alias.inputValue();
  out.typedLength = value.length;
  // 尝试保存，看是否被前端拦截
  const save = page.getByRole("button", { name: /保存更改|保存/ }).first();
  if (await save.count()) { await save.click(); await page.waitForTimeout(2500); }
  const body = await page.evaluate(()=>document.body.innerText);
  out.errorShown = /别名|alias|最多|字符/.test(body) ? body.split("\n").filter(l=>/别名|alias|字符/.test(l)).slice(0,4) : [];
}
fs.writeFileSync("/tmp/verify_alias_limit.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1));
await browser.close();
