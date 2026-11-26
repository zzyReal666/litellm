import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, ignoreHTTPSErrors: true });
const out = {};
await page.addInitScript(() => localStorage.setItem("litellm_ui_language","zh-CN"));
await page.goto(`${BASE}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL((u)=>!u.toString().includes("/login"), { timeout: 30000 });
await page.waitForTimeout(2200);
const navText = await page.evaluate(() => {
  const el = document.querySelector('[data-slot="sidebar"]');
  return el ? el.innerText : document.body.innerText;
});
out.hidden = {
  agents: !/智能体/.test(navText),
  mcpServers: !/MCP 服务器/.test(navText),
  skills: !/技能/.test(navText),
  policies: !/策略/.test(navText),
  tools: !/工具/.test(navText),
};
out.visible = {
  home: /首页/.test(navText),
  virtualKeys: /虚拟密钥/.test(navText),
  playground: /试验场/.test(navText),
  models: /模型与端点/.test(navText),
  guardrails: /安全护栏/.test(navText),
  usage: /用量/.test(navText),
  logs: /日志/.test(navText),
  teams: /团队/.test(navText),
  budgets: /预算/.test(navText),
};
// 直接访问被隐藏路由仍应可用（数据与页面保留）
await page.goto(`${BASE}/ui/mcp-servers`, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
out.directRouteMcp = page.url().includes("/mcp-servers");
out.directRouteBody = (await page.evaluate(() => document.body.innerText)).slice(0, 200);
fs.writeFileSync("/tmp/verify_v36_nav.json", JSON.stringify(out,null,1));
console.log(JSON.stringify(out,null,1));
await browser.close();
