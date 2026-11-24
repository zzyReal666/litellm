import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
const toasts = () => page.evaluate(() => Array.from(document.querySelectorAll("[data-sonner-toast]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).filter(Boolean));
const bodyTail = (n=2500) => page.evaluate((n) => document.body.innerText.slice(-n), n);
const snapshot = async (name) => {
  out[name] = { tail: await bodyTail(), toasts: await toasts() };
  fs.writeFileSync(`/tmp/repro_a_${name}.json`, JSON.stringify(out[name], null, 1));
};
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1200);

// ---------- 默认用户设置 ----------
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const tab = page.getByRole("tab", { name: /默认用户设置/ }).first();
if (await tab.count()) { await tab.click(); await page.waitForTimeout(2000); }
await snapshot("default_settings_view");
const editBtn = page.getByRole("button", { name: /^编辑$/ }).first();
if (await editBtn.count()) {
  await editBtn.click(); await page.waitForTimeout(1500);
  const selects = await page.evaluate(() => Array.from(document.querySelectorAll("[role=combobox],button[data-slot=select-trigger],select")).map((e) => ({ text: (e.innerText||"").trim(), value: e.getAttribute("value") })).slice(0,10));
  out.default_settings_edit_selects = selects;
  await snapshot("default_settings_edit");
  const cancel = page.getByRole("button", { name: /取消/ }).first();
  if (await cancel.count()) { await cancel.click(); await page.waitForTimeout(800); }
}

// ---------- 编辑用户：元数据 + 超长 ----------
await page.getByRole("tab", { name: /^用户$|用户列表/ }).first().click().catch(() => {});
await page.waitForTimeout(800);
const rowMenu = page.getByLabel(/打开用户操作菜单/).nth(1);
if (await rowMenu.count()) { await rowMenu.click(); await page.waitForTimeout(600); }
const editUser = page.getByText(/^编辑用户$/).first();
if (await editUser.count()) {
  await editUser.click(); await page.waitForTimeout(2500);
  await snapshot("user_edit_form");
  const meta = page.locator("textarea").first();
  if (await meta.count()) {
    await meta.fill("{invalid json");
    const save = page.getByRole("button", { name: /保存更改|保存/ }).first();
    if (await save.count()) { await save.click(); await page.waitForTimeout(2500); }
    await snapshot("user_edit_invalid_metadata");
    await meta.fill("{}");
  }
  const aliasInputs = page.locator('input');
  const n = await aliasInputs.count();
  if (n > 0) {
    // 找一个可编辑文本输入框填超长
    for (let i = 0; i < n; i++) {
      const el = aliasInputs.nth(i);
      const disabled = await el.isDisabled().catch(() => true);
      const type = await el.getAttribute("type");
      if (!disabled && (type === null || type === "text" || type === "email")) { await el.fill("x".repeat(300)); break; }
    }
    const save = page.getByRole("button", { name: /保存更改|保存/ }).first();
    if (await save.count()) { await save.click(); await page.waitForTimeout(3000); }
    await snapshot("user_edit_long_input");
  }
}
fs.writeFileSync("/tmp/repro_a.json", JSON.stringify(out, null, 1));
console.log("repro A done");
await browser.close();
