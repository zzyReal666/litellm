import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u) => !u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(2500);
// 侧边栏
const nav = await page.evaluate(() => Array.from(document.querySelectorAll('nav a, aside a, [data-slot="sidebar"] a')).map((a) => (a.innerText || "").trim()).filter(Boolean));
out.nav = nav;
out.no_developer_tools = !nav.some((t) => /开发者工具|API 参考|AI Hub|实验性功能/.test(t));
out.no_organizations = !nav.some((t) => t === "组织");
// 命令面板
await page.keyboard.press("Control+k");
await page.waitForTimeout(1000);
await page.keyboard.type("组织");
await page.waitForTimeout(800);
const paletteText = await page.evaluate(() => document.body.innerText);
out.palette_org_hidden = !/组织（|组织\b/.test(paletteText.split("搜索或跳转")[1] || "");
await page.keyboard.press("Escape");
// 管理设置
await page.goto(`${BASE}/ui/admin-panel`, { waitUntil: "networkidle" });
await page.waitForTimeout(2800);
const adminTabs = await page.evaluate(() => Array.from(document.querySelectorAll("[role=tab]")).map((e) => (e.innerText||"").trim()));
out.admin_tabs = adminTabs;
const panelText = async (tabName) => {
  const tab = page.getByRole("tab", { name: tabName, exact: true }).first();
  if (!(await tab.count())) return "";
  await tab.click(); await page.waitForTimeout(1800);
  return page.evaluate(() => document.body.innerText);
};
const englishLines = (text) => text.split("\n").map(l=>l.trim()).filter(l => l && /[A-Za-z]{4,}/.test(l) && !/[\u4e00-\u9fff]/.test(l) && !/^(SSO|SCIM|Hashicorp|CyberArk|Conjur|Vault|API|UI|ID|URL|Web Search|admin@|LiteLLM|中安云科)/.test(l));
const uiText = await panelText("界面设置");
out.ui_settings_english = englishLines(uiText).slice(0, 10);
out.ui_settings_has_chinese_desc = /模型|智能体|向量存储|界面相关开关/.test(uiText);
const wsText = await panelText("Web Search Interception");
out.web_search_english = englishLines(wsText).slice(0, 10);
out.web_search_chinese = /启用联网搜索拦截|搜索工具|提供商/.test(wsText);
// 路由设置
await page.goto(`${BASE}/ui/router-settings`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const routerTabs = await page.evaluate(() => Array.from(document.querySelectorAll("[role=tab]")).map((e) => (e.innerText||"").trim()));
out.router_tabs = routerTabs;
const routerText = async (tabName) => {
  const tab = page.getByRole("tab", { name: tabName, exact: true }).first();
  if (!(await tab.count())) return "";
  await tab.click(); await page.waitForTimeout(1800);
  return page.evaluate(() => document.body.innerText);
};
const pcText = await routerText("提示词缓存");
out.prompt_caching_english = englishLines(pcText).slice(0, 10);
const genText = await routerText("常规");
out.general_english = englishLines(genText).slice(0, 20);
out.general_chinese_desc = /并发|请求|文件|清理|预算/.test(genText);
fs.writeFileSync("/tmp/verify_hidden_i18n.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...out, nav: nav.slice(0, 40) }, null, 1).slice(0, 4000));
await browser.close();
