import { chromium } from "playwright-core";
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]),
);
const base = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(`${base}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);

await page.goto(`${base}/ui/users/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const downloadPromise = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
await page.getByRole("button", { name: /批量邀请用户|Bulk Invite/ }).first().click();
await page.waitForTimeout(800);
await page.getByRole("button", { name: /下载 CSV 模板|Download CSV Template/ }).click();
const download = await downloadPromise;
if (!download) {
  console.log("FAIL: 点击下载模板没有触发下载事件");
} else {
  const path = await download.path();
  const content = fs.readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  console.log("download filename:", download.suggestedFilename());
  console.log("download header:", content.split("\n")[0]);
}
await page.keyboard.press("Escape");
await page.waitForTimeout(500);

await page.getByRole("button", { name: /\+ 邀请用户|\+ Invite User/ }).first().click();
await page.waitForTimeout(800);
const before = await page.locator("body").innerText();
await page.getByRole("button", { name: /创建用户|Create User|邀请|Invite/ }).last().click();
await page.waitForTimeout(1500);
const after = await page.locator("body").innerText();
const errText = after.split("\n").filter((l) => /required|必填|请输入|请填写|valid email|有效|邮箱/i.test(l)).slice(0, 3);
console.log("empty email blocked toast/error:", JSON.stringify(errText));
console.log("still on modal:", !/login=success/.test(page.url()));

await page.screenshot({ path: "/tmp/fix19-invite-empty.png", fullPage: true });
await browser.close();
