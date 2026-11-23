import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map((l)=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const base = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, ignoreHTTPSErrors: true });
const out = {};
await page.goto(`${base}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
await page.goto(`${base}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const opBtn = page.getByRole("button", { name: "打开护栏操作" }).first();
if (await opBtn.count()) {
  await opBtn.click();
  await page.waitForTimeout(700);
  out.menu = await page.evaluate(() => document.body.innerText.slice(-600));
  const del = page.getByText(/^删除$|^删除护栏$|Delete/).first();
  if (await del.count()) {
    await del.click();
    await page.waitForTimeout(900);
    out.deleteDialog = await page.evaluate(() => document.body.innerText.slice(-1200));
  }
}
// 点击护栏行打开编辑，再点保存
await page.goto(`${base}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.getByText("bugtest-guard", { exact: true }).first().click();
await page.waitForTimeout(2500);
out.detail = await page.evaluate(() => document.body.innerText);
const saveBtn = page.getByRole("button", { name: /保存|Save|更新|新增/ }).first();
if (await saveBtn.count()) {
  await saveBtn.click();
  await page.waitForTimeout(1500);
  out.afterSave = await page.evaluate(() => document.body.innerText.slice(-800));
}
fs.writeFileSync("/tmp/probe_guardrail.json", JSON.stringify(out, null, 1));
console.log("keys:", Object.keys(out).join(","));
await browser.close();
