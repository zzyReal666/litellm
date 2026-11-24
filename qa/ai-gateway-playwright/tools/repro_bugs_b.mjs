import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
const toasts = () => page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1200);

// 默认用户设置编辑态
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByRole("tab", { name: /默认用户设置/ }).first().click();
await page.waitForTimeout(1800);
const edit = page.getByRole("button", { name: /编辑设置/ }).first();
if (await edit.count()) {
  await edit.click(); await page.waitForTimeout(1500);
  out.default_edit = {
    tail: await page.evaluate(() => document.body.innerText.slice(-1600)),
    combos: await page.evaluate(() => Array.from(document.querySelectorAll("button[role=combobox]")).map((e) => ({ text: (e.innerText||"").replace(/\s+/g," ").trim(), expanded: e.getAttribute("aria-expanded") }))),
  };
  // 打开第一个角色下拉看选项
  const combo = page.locator("button[role=combobox]").first();
  if (await combo.count()) {
    await combo.click(); await page.waitForTimeout(800);
    out.default_edit.options = await page.evaluate(() => Array.from(document.querySelectorAll("[role=option]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()));
    await page.keyboard.press("Escape");
  }
}

// 密钥编辑态
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2200);
const settingsTab = page.getByRole("tab", { name: /设置/ }).first();
if (await settingsTab.count()) { await settingsTab.click(); await page.waitForTimeout(1200); }
const keyEdit = page.getByRole("button", { name: /编辑设置/ }).first();
if (await keyEdit.count()) {
  await keyEdit.click(); await page.waitForTimeout(1800);
  out.key_edit = { tail: await page.evaluate(() => document.body.innerText.slice(-3500)),
    combos: await page.evaluate(() => Array.from(document.querySelectorAll("button[role=combobox]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim())) };
  const combo = page.locator("button[role=combobox]").first();
  if (await combo.count()) {
    await combo.click(); await page.waitForTimeout(800);
    out.key_edit.options = await page.evaluate(() => Array.from(document.querySelectorAll("[role=option]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).slice(0,20));
    await page.keyboard.press("Escape");
  }
}

// 用户编辑态：角色显示与选项
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const menu = page.getByLabel(/打开用户操作菜单/).nth(1);
if (await menu.count()) { await menu.click(); await page.waitForTimeout(600); }
const editUser = page.getByText(/^编辑用户$/).first();
if (await editUser.count()) {
  await editUser.click(); await page.waitForTimeout(2200);
  out.user_edit = { tail: await page.evaluate(() => document.body.innerText.slice(-2200)),
    combos: await page.evaluate(() => Array.from(document.querySelectorAll("button[role=combobox]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim())) };
  const combo = page.locator("button[role=combobox]").first();
  if (await combo.count()) {
    await combo.click(); await page.waitForTimeout(800);
    out.user_edit.options = await page.evaluate(() => Array.from(document.querySelectorAll("[role=option]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).slice(0,20));
  }
}
fs.writeFileSync("/tmp/repro_b.json", JSON.stringify(out, null, 1));
console.log("repro B done", JSON.stringify(Object.keys(out)));
await browser.close();
