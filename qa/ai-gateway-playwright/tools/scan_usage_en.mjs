import { chromium } from "playwright-core";
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]),
);
const base = env.AIG_BASE_URL;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, ignoreHTTPSErrors: true });
await page.goto(`${base}/ui/login`, { waitUntil: "domcontentloaded" });
await page.locator('input[name="username"]').fill(env.AIG_USER);
await page.locator('input[name="password"]').fill(env.AIG_PASS);
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(/login=success/);

const out = {};
const collect = async (label) => {
  await page.waitForTimeout(2200);
  out[label] = await page.evaluate(() => {
    const seen = new Set();
    const items = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = (node.textContent || "").trim();
      if (!text || text.length > 80) continue;
      if (!/[A-Za-z]{3,}/.test(text)) continue;
      if (/^[0-9a-f-]{8,}$/i.test(text)) continue;
      const el = node.parentElement;
      if (!el || el.closest("script,style")) continue;
      const key = text;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ text, tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 50) });
    }
    return items;
  });
};

await page.goto(`${base}/ui/usage/`, { waitUntil: "networkidle" });
await collect("overview");

// 依次切换各标签
const tabs = ["模型活动", "密钥活动", "MCP 服务器活动", "端点活动"];
for (const tab of tabs) {
  const t = page.getByRole("tab", { name: tab });
  if (await t.count()) {
    await t.first().click();
    await collect(`tab_${tab}`);
  }
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
