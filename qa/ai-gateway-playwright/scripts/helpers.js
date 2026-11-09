import { expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(projectRoot, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}


export const BASE_URL = process.env.AIG_BASE_URL || "http://192.168.7.112:4000";
export const ADMIN_USER = process.env.AIG_USER || "admin@sinocipher.local";
export const ADMIN_PASS = process.env.AIG_PASS || "";

export const ROUTES = {
  models: "/ui/models-and-endpoints/",
  guardrails: "/ui/guardrails/",
  apiKeys: "/ui/api-keys/",
  teams: "/ui/teams/",
  users: "/ui/users/",
  usage: "/ui/usage/",
  logs: "/ui/logs/",
  costOptimization: "/ui/cost-optimization/",
  license: "/ui/product-license/",
};

export async function login(page, options = {}) {
  const user = options.user || ADMIN_USER;
  const pass = options.pass || ADMIN_PASS;
  if (!pass) {
    throw new Error("缺少管理员密码：请设置环境变量 AIG_PASS，或在 .env 中提供");
  }
  await page.goto(`${BASE_URL}/ui/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="username"]').waitFor({ state: "visible", timeout: 30000 });
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(pass);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/login=success|home/, { timeout: 60000 });
  await page.waitForLoadState("domcontentloaded");
}

export async function gotoPage(page, path, marker) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  if (marker) {
    await expect(marker).toBeVisible({ timeout: 30000 });
  }
}

export async function gotoRoute(page, name, marker) {
  const path = ROUTES[name];
  if (!path) throw new Error(`未知路由: ${name}`);
  await gotoPage(page, path, marker);
}

export async function waitForToastsToClear(page) {
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 20000 });
}

export async function waitForToast(page, text) {
  const toast = page.locator("[data-sonner-toast], [role='status'], [role='alert']").filter({ hasText: text }).first();
  await expect(toast).toBeVisible({ timeout: 30000 });
}

export async function searchTable(page, text) {
  const search = page.getByPlaceholder(/搜索|Search/).first();
  await search.fill(text);
  await page.waitForTimeout(1200);
}

export function uniqueName(prefix) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  return `${prefix}_${stamp}`;
}
