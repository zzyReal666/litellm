import { expect, test } from "@playwright/test";
import { gotoRoute, login, ROUTES } from "./helpers.js";

test("冒烟：登录后可访问九个被测页面", async ({ page }) => {
  test.setTimeout(180000);

  await test.step("1. 登录管理界面", async () => {
    await login(page);
    await expect(page).toHaveURL(/login=success/);
  });

  for (const [name, entry] of Object.entries({
    模型端点管理: "models",
    压缩护栏管理: "guardrails",
    虚拟密钥管理: "apiKeys",
    团队管理: "teams",
    内部用户管理: "users",
    用量: "usage",
    日志: "logs",
    成本优化: "costOptimization",
    授权管理: "license",
  })) {
    await test.step(`2. 打开${name}`, async () => {
      await page.goto(`${ROUTES[entry]}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await expect(page.locator("body")).not.toHaveText(/404|This page could not be found/);
    });
  }
});
