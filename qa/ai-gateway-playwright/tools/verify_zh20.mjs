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
const results = {};

const email = `qa+zh20-${Date.now()}@example.com`;
await page.goto(`${base}/ui/users/`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
results.breadcrumbUsers = (await page.getByRole("link", { name: /内部用户|Internal Users/ }).count()) > 0;

await page.getByRole("button", { name: "+ 邀请用户" }).click();
const formDialog = page.getByRole("dialog").filter({ hasText: "用户邮箱" });
await formDialog.getByLabel("用户邮箱").fill(email);
const checkbox = formDialog.getByRole("checkbox", { name: "发送邀请邮件" });
if ((await checkbox.getAttribute("aria-checked")) === "true") await checkbox.click();
await formDialog.getByRole("button", { name: "邀请用户", exact: true }).click();
await page.waitForTimeout(3500);
const dialogsAfter = page.getByRole("dialog");
results.inviteDialogCount = await dialogsAfter.count();
const formStill = page.getByRole("dialog").filter({ hasText: "用户邮箱" });
results.formDialogClosed = (await formStill.count()) === 0;
const inviteDialog = page.getByRole("dialog").filter({ hasText: "Invitation Link" });
results.inviteLinkShown = (await inviteDialog.count()) > 0;
if (results.inviteLinkShown) {
  const closeButtons = inviteDialog.getByRole("button", { name: "关闭", exact: true });
  await closeButtons.last().click().catch(() => {});
}
await page.waitForTimeout(800);

await page.goto(`${base}/ui/api-keys/?create=true`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const keyDialog = page.getByRole("dialog").filter({ hasText: "创建新密钥" });
await keyDialog.getByRole("button", { name: "创建密钥", exact: true }).click();
await page.waitForTimeout(1200);
results.keyEmptyNameError = await keyDialog.getByText("请输入密钥名称").isVisible().catch(() => false);
await page.keyboard.press("Escape");

await page.goto(`${base}/ui/guardrails/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const bodyGuardrails = await page.locator("body").innerText();
results.guardrailDateZh = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(bodyGuardrails);
results.guardrailNoEnglishDate = !/Nov \d{1,2}, \d{2}:\d{2}/.test(bodyGuardrails);

await page.goto(`${base}/ui/logs/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const logText = await page.locator("body").innerText();
results.logDateZh = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(logText);
results.logFiltersZh = logText.includes("筛选");

await page.goto(`${base}/ui/usage/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const usageText = await page.locator("body").innerText();
results.usageTitleZh = usageText.includes("用量");
results.usageGlobalZh = usageText.includes("全局用量");

await page.goto(`${base}/ui/product-license/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const licenseText = await page.locator("body").innerText();
results.licenseSerialRow = licenseText.includes("产品序列号");
const refresh = page.getByRole("button", { name: "刷新状态" });
let clickable = false;
try {
  await refresh.click({ timeout: 5000 });
  clickable = true;
} catch {
  clickable = false;
}
results.licenseRefreshClickable = clickable;

await page.goto(`${base}/ui/cost-optimization/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const costText = await page.locator("body").innerText();
results.costLegendZh = costText.includes("提示词压缩") || costText.includes("提示词缓存") || costText.includes("自动路由");

await page.goto(`${base}/ui/teams/`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.getByRole("button", { name: "创建团队" }).click().catch(() => {});
await page.waitForTimeout(1500);
const teamDialogText = await page.locator("body").innerText();
const createBtn = page.getByRole("dialog").getByRole("button", { name: /创建|Create/ }).last();
await createBtn.click().catch(() => {});
await page.waitForTimeout(1200);
const afterSubmit = await page.locator("body").innerText();
results.teamsValidationZh = afterSubmit.includes("请输入团队名称");
results.teamsOrgLabelZh = teamDialogText.includes("组织") && !teamDialogText.includes("Organization");

console.log(JSON.stringify(results, null, 1));
await page.screenshot({ path: "/tmp/zh20-final.png", fullPage: true });
await browser.close();
