import { expect, test } from "@playwright/test";

import { BASE_URL, gotoRoute, login, uniqueName } from "./helpers.js";

const SIDEBAR = '[data-slot="sidebar"]';

const gotoResilient = async (page, route) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
  await page.waitForTimeout(2000);
};

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(1500);
});

test("回归：链路分析、智能体、MCP 服务器、技能、策略、工具入口已隐藏", async ({ page }) => {
  const sidebar = page.locator(SIDEBAR).first();
  await expect(sidebar).toBeVisible({ timeout: 20000 });

  for (const hidden of ["链路分析", "智能体", "MCP 服务器", "技能", "策略", "工具"]) {
    await expect(sidebar.getByText(hidden, { exact: false })).toHaveCount(0);
  }
  for (const visible of ["用量", "日志", "护栏监控"]) {
    await expect(sidebar.getByText(visible, { exact: false }).first()).toBeVisible();
  }
});

test("回归：内部用户编辑限制别名长度并实时提示超长 TPM", async ({ page }) => {
  await gotoResilient(page, "/ui/users");
  const row = page.locator("tbody tr").filter({ hasText: "qa-auto@sinocipher.local" }).first();
  await expect(row).toBeVisible({ timeout: 30000 });
  await row.getByRole("button", { name: /打开用户操作菜单/ }).click();
  await page.getByRole("menuitem", { name: "编辑用户", exact: true }).click();

  const alias = page.getByRole("textbox", { name: /用户别名/ }).first();
  await expect(alias).toBeVisible({ timeout: 20000 });
  await expect(alias).toHaveAttribute("maxlength", "255");

  const tpm = page.getByRole("spinbutton", { name: /TPM/ }).first();
  await expect(tpm).toBeVisible();
  await tpm.fill("111111111111111111111111111111");
  await expect(page.getByText(/请输入非负整数，留空表示不限制/).first()).toBeVisible();
});

test("回归：修改密码提示具体密码策略明细", async ({ page }) => {
  await gotoResilient(page, "/ui/change-password");
  await page.waitForURL(/change-password/, { timeout: 30000 });

  const inputs = page.locator('input[type="password"]');
  await expect(inputs).toHaveCount(3);
  await inputs.nth(0).fill(process.env.AIG_PASS || "");
  await inputs.nth(1).fill("weakpass");
  await inputs.nth(2).fill("weakpass");
  await page
    .getByRole("button", { name: /修改密码/ })
    .first()
    .click();

  await expect(page.getByText(/长度至少 12 个字符/).first()).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/包含大写字母/).first()).toBeVisible();
});

test("回归：成本优化新建免 Key 的中文名压缩护栏并可删除", async ({ page }) => {
  const guardrailName = uniqueName("压缩回归");
  await gotoResilient(page, "/ui/cost-optimization");
  const compressionTab = page.getByRole("tab", { name: /提示词压缩/ }).first();
  await expect(compressionTab).toBeVisible({ timeout: 30000 });
  await compressionTab.click();
  await expect(page.getByText(/Headroom 提示词压缩/).first()).toBeVisible();

  await page.getByPlaceholder("headroom-compression").fill(guardrailName);
  await page.getByPlaceholder("https://your-headroom-endpoint").fill("http://headroom:8787");
  await page
    .getByRole("button", { name: /添加护栏/ })
    .first()
    .click();
  await expect(page.getByText(/压缩护栏已创建/).first()).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(guardrailName).first()).toBeVisible();

  await gotoResilient(page, "/ui/guardrails");
  const row = page.locator("tbody tr").filter({ hasText: guardrailName }).first();
  await expect(row).toBeVisible({ timeout: 30000 });
  await row.getByRole("button", { name: /打开护栏操作/ }).click();
  await page.getByRole("menuitem", { name: "删除", exact: true }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "删除护栏" });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder(guardrailName).fill(guardrailName);
  await dialog.getByRole("button", { name: "删除", exact: true }).click();
  await expect(row).toHaveCount(0, { timeout: 20000 });
});
