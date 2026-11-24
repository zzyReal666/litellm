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
await page.waitForTimeout(1500);
await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /询问 AI/ }).first().click();
await page.waitForTimeout(1500);
const panel = page.locator('[data-testid="usage-ai-chat-panel"]');
const combo = panel.getByRole("combobox").first();
await combo.click();
await page.waitForTimeout(1200);
await page.keyboard.type("deepseek");
await page.waitForTimeout(1500);
const optTexts = await page.locator('[role="option"]').allInnerTexts();
console.log("filtered options:", JSON.stringify(optTexts));
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(300);
await page.keyboard.press("Enter");
await page.waitForTimeout(800);
const selected = await combo.inputValue().catch(()=>"?");
const ta = panel.locator("textarea").last();
await ta.fill("本周哪个模型花费最高？只回答模型名");
await panel.getByRole("button", { name: /发送/ }).first().click();
await page.waitForTimeout(40000);
const text = await panel.innerText();
fs.writeFileSync("/tmp/verify_askai_final.txt", "selected=" + selected + "\n" + text);
const out = {
  selected,
  error: text.match(/错误：[^\n]{0,120}/)?.[0] ?? null,
  thinking: /Thinking\.\.\./.test(text),
  answerText: text.split("只回答模型名").pop().replace(/发送[\s\S]*/, "").trim().slice(0, 300),
};
console.log(JSON.stringify(out, null, 1));
await browser.close();
