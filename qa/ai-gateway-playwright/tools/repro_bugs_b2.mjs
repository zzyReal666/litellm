import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
const safe = async (name, fn) => { try { await fn(); } catch (e) { out[name] = { error: String(e).slice(0, 200) }; } };
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1200);

await safe("default_edit", async () => {
  await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.getByRole("tab", { name: /默认用户设置/ }).first().click();
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /编辑设置/ }).first().click();
  await page.waitForTimeout(1500);
  out.default_edit = { tail: (await page.evaluate(() => document.body.innerText)).slice(-1500),
    combos: await page.evaluate(() => Array.from(document.querySelectorAll("button[role=combobox]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim())) };
  const combo = page.locator("button[role=combobox]").first();
  if (await combo.count()) {
    await combo.click(); await page.waitForTimeout(700);
    out.default_edit.options = await page.evaluate(() => Array.from(document.querySelectorAll("[role=option]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()));
  }
});

await safe("key_edit", async () => {
  await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.getByText("bugtest-key", { exact: true }).first().click();
  await page.waitForTimeout(2200);
  const settingsTab = page.getByRole("tab", { name: /设置/ }).first();
  if (await settingsTab.count()) { await settingsTab.click(); await page.waitForTimeout(1200); }
  const keyEdit = page.getByRole("button", { name: /编辑设置/ }).first();
  if (await keyEdit.count()) {
    await keyEdit.click(); await page.waitForTimeout(1800);
    out.key_edit = { tail: (await page.evaluate(() => document.body.innerText)).slice(-3500),
      combos: await page.evaluate(() => Array.from(document.querySelectorAll("button[role=combobox]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim())) };
    const combo = page.locator("button[role=combobox]").first();
    if (await combo.count()) {
      await combo.click(); await page.waitForTimeout(700);
      out.key_edit.options = await page.evaluate(() => Array.from(document.querySelectorAll("[role=option]")).map((e) => (e.innerText||"").replace(/\s+/g," ").trim()).slice(0,20));
    }
  }
});
fs.writeFileSync("/tmp/repro_b2.json", JSON.stringify(out, null, 1));
console.log("done", JSON.stringify(Object.keys(out)));
await browser.close();
