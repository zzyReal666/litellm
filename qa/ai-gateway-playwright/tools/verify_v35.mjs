import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
const text = () => page.evaluate(() => document.body.innerText);
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(1800);

// 1) 请求日志排序
await page.goto(`${BASE}/ui/logs`, { waitUntil: "networkidle" });
await page.waitForTimeout(2800);
const sortBtn = page.locator('[data-testid^="sort-trigger-"]').first();
out.logSort = { trigger: await sortBtn.count() };
if (await sortBtn.count()) { await sortBtn.click(); await page.waitForTimeout(600); out.logSort.menu = await page.locator('[role="menuitem"]').allInnerTexts(); await page.keyboard.press("Escape"); }

// 2) 用量导出
await page.goto(`${BASE}/ui/usage`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await page.getByRole("button", { name: /导出数据/ }).first().click();
await page.waitForTimeout(1500);
const exportText = await text();
out.exportZh = /按用户逐日明细/.test(exportText) && !/Day-by-day breakdown/.test(exportText) && !/Export CSV/.test(exportText) && !/Format/.test(exportText);
out.exportHasCancel = /取消/.test(exportText);
await page.keyboard.press("Escape");

// 3) 团队详情 tabs
await page.goto(`${BASE}/ui/teams`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
out.teamsExportBtn = await page.locator('[data-testid="teams-export-csv"]').count();
const firstTeam = page.locator("tbody tr").first();
out.teamRows = await page.locator("tbody tr").count();
if (out.teamRows) {
  await firstTeam.click(); await page.waitForTimeout(2500);
  const tabs = await page.evaluate(() => Array.from(document.querySelectorAll('[role="tab"]')).map(e=>(e.innerText||"").trim()));
  out.teamTabs = tabs;
}

// 4) 内部用户：批量邀请隐藏
await page.goto(`${BASE}/ui/users`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
out.bulkInviteBtn = await page.getByRole("button", { name: /批量邀请用户/ }).count();

// 5) 模型与端点：模型设置按钮（config 托管时应隐藏）
await page.goto(`${BASE}/ui/models-and-endpoints`, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
out.modelSettingsBtn = await page.locator('[data-testid="models-settings-trigger"]').count();

// 6) 创建团队表单 TPM 超长校验
await page.goto(`${BASE}/ui/teams`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const addTeam = page.getByRole("button", { name: /添加团队|创建团队|新建团队/ }).first();
if (await addTeam.count()) {
  await addTeam.click(); await page.waitForTimeout(1500);
  const nameInput = page.getByRole("textbox", { name: /团队名称/ }).first();
  if (await nameInput.count()) await nameInput.fill("验证超大TPM");
  const tpm = page.getByRole("spinbutton", { name: /Tokens per minute|TPM/ }).first();
  out.tpmInputCount = await tpm.count();
  if (await tpm.count()) {
    await tpm.fill("5555555555555555555555555555");
    await page.waitForTimeout(300);
    const create = page.getByRole("button", { name: /创建团队|添加团队/ }).last();
    if (await create.count()) { await create.click(); await page.waitForTimeout(1500); }
    const t = await text();
    out.tpmValidationZh = /请输入非负整数/.test(t);
    out.tpmSentToBackend = /Query parsing failure/.test(t);
  }
  await page.keyboard.press("Escape");
}
fs.writeFileSync("/tmp/verify_v35.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1).slice(0,3000));
await browser.close();
