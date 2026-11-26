import { chromium } from "playwright-core";
import fs from "node:fs";
const env = Object.fromEntries(fs.readFileSync(".env","utf8").split("\n").filter(l=>l.includes("=")).map(l=>[l.split("=")[0].trim(), l.split("=").slice(1).join("=").trim()]));
const BASE = env.AIG_BASE_URL;
const INVITE = "e7fd580d-a972-413e-abd7-508602abf84c";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const out = {};
for (const [lang, label] of [["en","en"],["zh-CN","zh"]]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  await page.addInitScript((l) => localStorage.setItem("litellm_ui_language", l), lang);
  await page.goto(`${BASE}/ui/onboarding?invitation_id=${INVITE}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const submit = page.getByRole("button", { name: lang === "en" ? "Sign Up" : "注册" }).last();
  if (await submit.count()) { await submit.click(); await page.waitForTimeout(1200); }
  out[label] = await page.evaluate(() => document.body.innerText).then(t => t.split("\n").map(l=>l.trim()).filter(Boolean).slice(0, 12));
  await page.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
