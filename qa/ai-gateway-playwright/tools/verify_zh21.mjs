import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(`${env.AIG_BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);
const out = {};

await page.goto(`${env.AIG_BASE_URL}/ui/models-and-endpoints/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const modelText = await page.locator("body").innerText();
out.modelTabsZh = ["已部署模型", "添加模型", "LLM 凭证", "透传端点", "健康状态", "模型重试设置", "模型组别名"].filter((s) => modelText.includes(s));
out.modelEnglishLeft = ["Deployed Models", "Add Model", "LLM Credentials", "Pass-Through Endpoints"].filter((s) => modelText.includes(s));

await page.goto(`${env.AIG_BASE_URL}/ui/logs/`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const logText = await page.locator("body").innerText();
out.logHasPlaceholder = logText.includes("暂无");
out.logBareDashCount = (logText.match(/(^|\n)\s*-\s*(\n|$)/g) || []).length;

await page.goto(`${env.AIG_BASE_URL}/ui/product-license/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const licText = await page.locator("body").innerText();
out.licenseDeviceLabel = licText.includes("设备序列号（授权文件）");

await page.goto(`${env.AIG_BASE_URL}/ui/teams/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const teamText = await page.locator("body").innerText();
out.teamPageLoaded = teamText.includes("团队");

console.log(JSON.stringify(out, null, 1));
await browser.close();
