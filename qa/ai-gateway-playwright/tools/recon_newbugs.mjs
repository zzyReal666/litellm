import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 }, ignoreHTTPSErrors: true, permissions: ["clipboard-read","clipboard-write"] });
const dump = async (name) => {
  const data = await page.evaluate(() => ({
    text: document.body.innerText.slice(0, 4000),
    buttons: Array.from(document.querySelectorAll("button")).map((b) => ({ aria: (b.getAttribute("aria-label")||"").trim(), text: (b.innerText||"").trim() })).filter(b => b.aria || b.text).slice(0, 60),
    inputs: Array.from(document.querySelectorAll("input,textarea,select,[role=combobox]")).map((e) => ({ label: (e.getAttribute("aria-label")||"").trim(), placeholder: (e.getAttribute("placeholder")||"").trim(), id: e.id || "", value: (e.value||"").slice(0,40) })).slice(0, 40),
  }));
  fs.writeFileSync(`/tmp/recon_${name}.json`, JSON.stringify(data, null, 1));
  return data;
};
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1500);

await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest@example.com").first().click();
await page.waitForTimeout(2500);
await dump("user_detail");
const editBtn = page.getByRole("button", { name: /编辑设置|编辑|Edit/ }).first();
if (await editBtn.count()) { await editBtn.click(); await page.waitForTimeout(1500); await dump("user_edit"); }

await page.goto(`${BASE}/ui/api-keys`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByText("bugtest-key", { exact: true }).first().click();
await page.waitForTimeout(2500);
await dump("key_detail");
const keyEdit = page.getByRole("button", { name: /编辑密钥|编辑|Edit/ }).first();
if (await keyEdit.count()) { await keyEdit.click(); await page.waitForTimeout(1500); await dump("key_edit"); }

await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await dump("models");
for (const t of ["模型设置", "设置", "Model Settings"]) {
  const b = page.getByText(t, { exact: true }).first();
  if (await b.count()) { await b.click(); await page.waitForTimeout(1500); await dump("model_settings_modal"); break; }
}

await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await dump("usage");
await browser.close();
console.log("recon done");
