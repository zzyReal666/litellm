import { expect, test } from "@playwright/test";
import { gotoPage, gotoRoute, login, uniqueName } from "./helpers.js";

const KEY_HEADERS = ["密钥", "团队", "用户", "创建时间", "最后活跃", "花费 / 预算", "累计消费", "预算重置", "模型"];
const SEARCH_PLACEHOLDER = /按密钥别名或 ID 搜索/;

async function deleteKeyIfPresent(page, alias) {
  await gotoPage(page, `/ui/api-keys/?key_search=${encodeURIComponent(alias)}`);
  await expect(page.getByRole("heading", { name: "虚拟密钥" })).toBeVisible();
  const row = page.locator("tbody tr").filter({ hasText: alias }).first();
  if ((await row.count()) === 0) return;
  await row.locator("button").first().click();
  await expect(page.getByRole("button", { name: "更多密钥操作" })).toBeVisible();
  await page.getByRole("button", { name: "更多密钥操作" }).click();
  await page.getByRole("menuitem", { name: "删除密钥", exact: true }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "删除密钥" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox").fill(alias);
  await dialog.getByRole("button", { name: "删除", exact: true }).click();
  await expect(page.getByRole("button", { name: "更多密钥操作" })).toBeHidden();
  await gotoPage(page, `/ui/api-keys/?key_search=${encodeURIComponent(alias)}`);
  await expect(page.locator("tbody tr").filter({ hasText: alias })).toHaveCount(0);
}

test("虚拟密钥管理：创建、列表校验与删除闭环", async ({ page }) => {
  test.setTimeout(180000);
  const alias = uniqueName("qa_key");

  try {
    await test.step("1. 登录并打开创建虚拟密钥弹窗", async () => {
      await login(page);
      await gotoRoute(page, "apiKeys", page.getByRole("heading", { name: "虚拟密钥" }));
      await page.getByRole("button", { name: /新建密钥/ }).click();
      await expect(page.getByRole("dialog").filter({ hasText: "创建新密钥" })).toBeVisible();
    });

    const createDialog = page.getByRole("dialog").filter({ hasText: "创建新密钥" });

    await test.step("2. 校验创建表单默认项", async () => {
      await expect(page.locator("[role='dialog']:visible").filter({ hasText: "密钥归属" })).toBeVisible();
      await expect(createDialog.getByText("密钥详情")).toBeVisible();
      await expect(createDialog.getByRole("radio", { name: "你" })).toBeChecked();
      await expect(createDialog.locator("#key_alias")).toBeVisible();
      await expect(createDialog.getByText("必填", { exact: true })).toBeVisible();
      await expect(createDialog.getByRole("button", { name: "创建密钥", exact: true })).toBeVisible();
    });

    await test.step("3. 密钥名称为空时不创建密钥", async () => {
      await createDialog.getByRole("button", { name: "创建密钥", exact: true }).click();
      await expect(createDialog).toBeVisible();
      await expect(createDialog.getByText("请输入密钥名称")).toBeVisible();
      await expect(page.getByRole("dialog").filter({ hasText: "保存你的密钥" })).toBeHidden();
    });

    await test.step("4. 填写密钥名称并创建", async () => {
      await createDialog.locator("#key_alias").fill(alias);
      await createDialog.getByRole("button", { name: "创建密钥", exact: true }).click();

      const successDialog = page.getByRole("dialog").filter({ hasText: "保存你的密钥" });
      await expect(successDialog).toBeVisible();
      await expect(successDialog).toContainText(/sk-[A-Za-z0-9_-]+/);
      await expect(successDialog.getByRole("button", { name: "复制虚拟密钥" })).toBeVisible();
      await successDialog.getByRole("button", { name: "关闭", exact: true }).click();
      await expect(successDialog).toBeHidden();
    });

    let row;

    await test.step("5. 在密钥列表中搜索并校验新密钥", async () => {
      await gotoRoute(page, "apiKeys", page.getByRole("heading", { name: "虚拟密钥" }));
      for (const header of KEY_HEADERS) {
        await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
      }
      await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill(alias);
      row = page.locator("tbody tr").filter({ hasText: alias }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/sk-\.\.\./);
      await expect(row).toContainText("无限制");
    });

    await test.step("6. 打开密钥详情并校验关键信息", async () => {
      await row.locator("button").first().click();
      await expect(page.getByRole("button", { name: "更多密钥操作" })).toBeVisible();
      await expect(page.locator("main")).toContainText(/密钥 ID：[0-9a-f]{64}/);
      await expect(page.getByRole("button", { name: "重新生成密钥" })).toBeVisible();
      await expect(page.getByText(alias, { exact: true }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: "返回密钥列表" })).toBeVisible();
    });

    await test.step("7. 删除密钥并校验列表清除", async () => {
      await page.getByRole("button", { name: "更多密钥操作" }).click();
      await expect(page.getByRole("menuitem", { name: "删除密钥", exact: true })).toBeVisible();
      await page.getByRole("menuitem", { name: "删除密钥", exact: true }).click();

      const dialog = page.getByRole("dialog").filter({ hasText: "删除密钥" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(alias);
      await dialog.getByRole("textbox").fill(alias);
      const deleteButton = dialog.getByRole("button", { name: "删除", exact: true });
      await expect(deleteButton).toBeEnabled();
      const deleteResponsePromise = page.waitForResponse(
        (response) => response.url().includes("/key/delete") && response.request().method() === "POST",
        { timeout: 30000 },
      );
      await deleteButton.click();
      const deleteResponse = await deleteResponsePromise;
      expect(deleteResponse.ok()).toBeTruthy();
      await expect(page.getByRole("button", { name: "更多密钥操作" })).toBeHidden({ timeout: 30000 });

      await expect
        .poll(
          async () => {
            await gotoPage(page, `/ui/api-keys/?key_search=${encodeURIComponent(alias)}`);
            return page.locator("tbody tr").filter({ hasText: alias }).count();
          },
          { timeout: 45000, intervals: [2000, 3000, 5000] },
        )
        .toBe(0);
    });
  } finally {
    await deleteKeyIfPresent(page, alias).catch(() => {});
  }
});
