import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read","clipboard-write"] });
const page = await ctx.newPage();
const res = {};
const txt = async () => (await page.evaluate(() => document.body.innerText));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);

// B2 用户删除：从列表行操作删除
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
res.users_page_chars = (await txt()).length;
const userCell = page.getByText("bugfix-check@example.com").first();
res.user_row_found = await userCell.count();
if (res.user_row_found) {
  await userCell.click();
  await page.waitForTimeout(2500);
  const btns = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b => (b.getAttribute("aria-label") || b.innerText || "").trim()).filter(Boolean));
  res.user_detail_buttons = btns.filter(b => /删除|Delete|编辑|保存|重置/.test(b)).slice(0, 10);
  const del = page.getByRole("button", { name: /^删除用户$|删除用户|Delete User/ }).first();
  res.user_delete_button_count = await del.count();
  if (await del.count()) {
    await del.click(); await page.waitForTimeout(900);
    const confirm = page.getByRole("button", { name: /^删除$|确认/ }).first();
    if (await confirm.count()) { await confirm.click(); await page.waitForTimeout(3000); }
    res.user_after_delete_url = page.url();
    res.user_still_in_list = (await page.getByText("bugfix-check@example.com").count()) > 0;
  }
}

// B10 Headroom 校验
await page.goto(`${BASE}/ui/cost-optimization`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const tabs = await page.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.innerText.trim()).filter(Boolean));
res.costopt_tabs = tabs;
const perComp = page.getByRole("tab", { name: /提示词压缩/ }).first();
if (await perComp.count()) { await perComp.click(); await page.waitForTimeout(2000); }
res.headroom_form_present = await page.getByText(/添加 Headroom|Add Headroom/).count();
const nameInput = page.locator('form input').first();
const urlInput = page.locator('form input').nth(1);
if (await nameInput.count() && await urlInput.count()) {
  await nameInput.fill("x".repeat(300));
  await urlInput.fill("not-a-url-" + "y".repeat(300));
  const submit = page.locator('form button[type="submit"]').first();
  if (await submit.count()) { await submit.click(); await page.waitForTimeout(1500); }
  const t = await txt();
  res.headroom_validation = t.match(/必填|不能超过|请输入|无效|格式|URL|http|At most|Too big/gi)?.slice(0, 6) ?? null;
  res.headroom_overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 4);
}

// B11 护栏无变更提示
await page.goto(`${BASE}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const g = page.getByText("bugtest-guard", { exact: true }).first();
res.guardrail_row_found = await g.count();
if (await g.count()) {
  await g.click(); await page.waitForTimeout(2500);
  const btns = await page.evaluate(() => Array.from(document.querySelectorAll("button")).map(b => (b.getAttribute("aria-label") || b.innerText || "").trim()).filter(Boolean));
  res.guardrail_detail_buttons = btns.filter(b => /保存|Save|更新|提交|Submit|编辑|Edit/.test(b)).slice(0, 10);
  const editBtn = page.getByRole("button", { name: /编辑|Edit/ }).first();
  if (await editBtn.count()) { await editBtn.click(); await page.waitForTimeout(1200); }
  const save = page.getByRole("button", { name: /保存|Save|更新|提交|Submit/ }).first();
  if (await save.count()) { await save.click(); await page.waitForTimeout(1800); res.guardrail_after_save_toast = (await txt()).match(/未检测到更改|No changes detected|保存成功|更新成功/g) ?? null; }
}
fs.writeFileSync("/tmp/verify_remaining.json", JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1).slice(0, 3000));
await browser.close();
