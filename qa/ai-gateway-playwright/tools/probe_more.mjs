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

// 创建密钥弹窗
await page.goto(`${base}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const createBtn = page.getByRole("button", { name: /创建新密钥|创建密钥|Create/ }).first();
if (await createBtn.count()) {
  await createBtn.click();
  await page.waitForTimeout(1500);
  out.createKeyDialog = await page.evaluate(() => document.body.innerText);
  await page.keyboard.press("Escape");
}

// 密钥详情更多操作
await page.goto(`${base}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2000);
const more = page.getByRole("button", { name: /更多密钥操作|More key actions/ }).first();
if (await more.count()) {
  await more.click();
  await page.waitForTimeout(800);
  out.keyMenu = await page.evaluate(() => document.body.innerText);
  await page.keyboard.press("Escape");
}

// 模型详情
await page.goto(`${base}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const modelLink = page.getByText("bugtest-model", { exact: true }).first();
if (await modelLink.count()) {
  await modelLink.click();
  await page.waitForTimeout(2500);
  out.modelDetail = await page.evaluate(() => document.body.innerText);
}

// 护栏列表 + 删除弹窗
await page.goto(`${base}/ui/guardrails`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
out.guardrails = await page.evaluate(() => document.body.innerText);

fs.writeFileSync("/tmp/probe_more.json", JSON.stringify(out, null, 1));
console.log(Object.keys(out).map((k) => `${k}:${String(out[k]).length}`).join(", "));
await browser.close();
