import { expect, test } from "@playwright/test";
import { gotoRoute, login, uniqueName } from "./helpers.js";

const GUARDRAIL_HEADERS = ["护栏 ID", "名称", "提供商", "模式", "默认启用", "创建时间", "更新时间", "操作"];

async function deleteGuardrailIfPresent(page, guardrailName) {
  await gotoRoute(page, "guardrails");
  await expect(page.locator("thead th").first()).toBeVisible();
  const row = page.locator("tbody tr").filter({ hasText: guardrailName }).first();
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: "打开护栏操作" }).click();
  await page.getByRole("menuitem", { name: "删除", exact: true }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "删除护栏" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "删除", exact: true }).click();
  await expect(row).toHaveCount(0);
}

test("压缩护栏管理：内置护栏展示与自定义护栏增删闭环", async ({ page }) => {
  test.setTimeout(180000);
  const guardrailName = uniqueName("qa_guardrail");

  try {
    await test.step("1. 登录并打开压缩护栏页面", async () => {
      await login(page);
      await gotoRoute(page, "guardrails", page.locator("thead th").first());
      for (const header of GUARDRAIL_HEADERS) {
        await expect(page.getByRole("columnheader", { name: header, exact: true })).toBeVisible();
      }
    });

    await test.step("2. 校验内置 headroom-compression 护栏", async () => {
      const row = page.locator("tbody tr").filter({ hasText: "headroom-compression" }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/headroom/i);
      await expect(row).toContainText("pre_call");
      await expect(row).toContainText("默认启用");
    });

    await test.step("3. 打开添加护栏菜单并校验提供商护栏表单", async () => {
      await page.getByRole("button", { name: /添加新护栏/ }).click();
      await expect(page.getByRole("menuitem", { name: "添加提供商护栏", exact: true })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "创建自定义代码护栏", exact: true })).toBeVisible();
      await page.getByRole("menuitem", { name: "添加提供商护栏", exact: true }).click();

      const dialog = page.getByRole("dialog").filter({ hasText: "创建护栏" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByPlaceholder("为此护栏输入名称")).toBeVisible();
      await expect(dialog.getByPlaceholder("选择护栏提供商")).toBeVisible();
      await expect(dialog.getByRole("button", { name: "下一步", exact: true })).toBeVisible();
      await dialog.getByRole("button", { name: "取消", exact: true }).click();
      await expect(dialog).toBeHidden();
    });

    await test.step("4. 创建自定义代码护栏", async () => {
      await page.getByRole("button", { name: /添加新护栏/ }).click();
      await page.getByRole("menuitem", { name: "创建自定义代码护栏", exact: true }).click();

      const dialog = page.getByRole("dialog").filter({ hasText: "创建自定义护栏" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByPlaceholder("例如：block-pii-custom")).toBeVisible();
      await expect(dialog.locator("textarea")).toHaveValue(/async def apply_guardrail/);
      await dialog.getByPlaceholder("例如：block-pii-custom").fill(guardrailName);
      await dialog.getByRole("button", { name: "保存护栏", exact: true }).click();
      await expect(dialog).toBeHidden();

      const row = page.locator("tbody tr").filter({ hasText: guardrailName }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText("custom_code");
      await expect(row).toContainText("pre_call");
      await expect(row).toContainText("默认关闭");
      await expect(row).toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    });

    await test.step("5. 删除自定义护栏并校验列表清除", async () => {
      const row = page.locator("tbody tr").filter({ hasText: guardrailName }).first();
      await row.getByRole("button", { name: "打开护栏操作" }).click();
      await page.getByRole("menuitem", { name: "删除", exact: true }).click();
      const dialog = page.getByRole("dialog").filter({ hasText: "删除护栏" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(guardrailName);
      await dialog.getByRole("button", { name: "删除", exact: true }).click();
      await expect(page.locator("tbody tr").filter({ hasText: guardrailName })).toHaveCount(0);
    });
  } finally {
    await deleteGuardrailIfPresent(page, guardrailName).catch(() => {});
  }
});
