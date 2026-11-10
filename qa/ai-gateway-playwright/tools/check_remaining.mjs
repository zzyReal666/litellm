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
await page.waitForTimeout(3000);
const modelText = await page.locator("body").innerText();
out.modelEnglishTabs = ["Deployed Models", "Add Model", "LLM Credentials", "Pass-Through Endpoints"].filter((s) => modelText.includes(s));
const modelRows = await page.locator("tbody tr").allInnerTexts();
out.modelRowCount = modelRows.length;
out.modelUpdatedUnknown = modelRows.some((row) => row.includes("未知日期"));
out.modelRowSample = modelRows.slice(0, 2).map((r) => r.replace(/\n/g, " | ").slice(0, 200));

await page.goto(`${env.AIG_BASE_URL}/ui/logs/`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const logRows = await page.locator("tbody tr").allInnerTexts();
out.logRowSample = logRows.slice(0, 2).map((r) => r.replace(/\n/g, " | ").slice(0, 260));
out.logDashColumns = logRows.length > 0 && (logRows[0].match(/(^|\n)\s*-\s*(\n|$)/g) || []).length;

await page.goto(`${env.AIG_BASE_URL}/ui/product-license/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const licText = await page.locator("body").innerText();
const lic = await page.evaluate(async () => (await fetch("/product/license/info")).json());
out.licenseDeviceSerial = lic.device_serial;
out.licenseSerialRow = licText.includes("产品序列号");
out.licenseDeviceSerialShown = licText.includes(String(lic.device_serial));

console.log(JSON.stringify(out, null, 1));
await browser.close();
