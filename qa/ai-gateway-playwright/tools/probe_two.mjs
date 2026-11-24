import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1200);
// key edit
await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2500);
const tabs = await page.evaluate(() => Array.from(document.querySelectorAll("[role=tab]")).map((e) => (e.innerText||"").trim()));
console.log("tabs:", JSON.stringify(tabs));
const settingsTab = page.getByRole("tab", { name: /^设置$/ }).first();
console.log("settingsTab count:", await settingsTab.count());
if (await settingsTab.count()) { await settingsTab.click(); await page.waitForTimeout(1200); }
const editBtn = page.getByRole("button", { name: /编辑设置/ }).first();
console.log("editBtn count:", await editBtn.count());
if (await editBtn.count()) { await editBtn.click(); await page.waitForTimeout(1800); }
const meta = page.locator("textarea").first();
console.log("textarea count:", await meta.count());
if (await meta.count()) { await meta.fill("{bad json"); }
const save = page.getByRole("button", { name: /保存更改|Save Changes/ }).first();
console.log("save count:", await save.count());
if (await save.count()) { await save.click(); await page.waitForTimeout(2500); }
console.log("BODY TAIL:", (await page.evaluate(() => document.body.innerText)).slice(-900));
fs.writeFileSync("/tmp/probe_two_key.txt", await page.evaluate(() => document.body.innerText));
// ask ai
await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const ask = page.getByRole("button", { name: /询问 AI/ }).first();
console.log("ask count:", await ask.count());
if (await ask.count()) { await ask.click(); await page.waitForTimeout(1500); }
const ta = page.locator("textarea").last();
console.log("usage textarea count:", await ta.count(), "ph:", await ta.getAttribute("placeholder").catch(()=>null));
if (await ta.count()) { await ta.fill("哪个模型花费最多？"); const send = page.getByRole("button", { name: /发送/ }).first(); console.log("send count:", await send.count()); if (await send.count()) await send.click(); }
await page.waitForTimeout(16000);
console.log("USAGE TAIL:", (await page.evaluate(() => document.body.innerText)).slice(-900));
fs.writeFileSync("/tmp/probe_two_ai.txt", await page.evaluate(() => document.body.innerText));
await browser.close();
