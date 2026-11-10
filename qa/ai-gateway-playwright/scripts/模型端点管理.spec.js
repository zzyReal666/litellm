import { expect, test } from "@playwright/test";
import { gotoRoute, login, uniqueName, waitForToast } from "./helpers.js";

const MODEL_TABS = [
  "已部署模型",
  "添加模型",
  "LLM 凭证",
  "透传端点",
  "健康状态",
  "模型重试设置",
  "模型组别名",
];

const MODEL_HEADERS = ["模型 ID", "模型信息", "凭据", "创建者", "更新时间", "费用", "团队 ID", "模型访问组", "操作"];

const SUB_PAGE_MARKERS = {
  "LLM 凭证": "添加凭据",
  "健康状态": "运行所有检查",
  "模型组别名": "添加别名",
};

async function deleteModelIfPresent(page, modelName) {
  await gotoRoute(page, "models");
  await expect(page.getByRole("heading", { name: "模型管理" })).toBeVisible();
  const row = page.locator("tbody tr").filter({ hasText: modelName }).first();
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: "删除模型" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "删除模型" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "删除", exact: true }).click();
  await expect(row).toHaveCount(0);
}

test("模型端点管理：列表展示、添加自定义模型与删除闭环", async ({ page }) => {
  test.setTimeout(180000);
  const modelName = uniqueName("qa_model");

  try {
    await test.step("1. 登录并打开模型与端点页面", async () => {
      await login(page);
      await gotoRoute(page, "models", page.getByRole("heading", { name: "模型管理" }));
      for (const tab of MODEL_TABS) {
        await expect(page.getByRole("tab", { name: tab, exact: true })).toBeVisible();
      }
    });

    await test.step("2. 校验已部署模型表格列头", async () => {
      for (const header of MODEL_HEADERS) {
        await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
      }
    });

    await test.step("3. 打开添加模型并校验空表单提示", async () => {
      await page.getByRole("tab", { name: "添加模型", exact: true }).click();
      await expect(page.getByRole("combobox", { name: "提供商" })).toBeVisible();
      await expect(page.locator("label").filter({ hasText: "网关模型名称" })).toBeVisible();
      await expect(page.locator("label").filter({ hasText: "模型映射" })).toBeVisible();
      await page.getByRole("button", { name: "添加模型", exact: true }).click();
      await expect(page.getByText("请至少输入一个模型")).toBeVisible();
      await expect(page.getByText("至少需要一个模型映射")).toBeVisible();
    });

    await test.step("4. 添加自定义模型并在列表中校验", async () => {
      const provider = page.getByRole("combobox", { name: "提供商" });
      await provider.fill("openai");
      await page.locator("[role='option']").filter({ hasText: /^OpenAI$/ }).first().click();
      await expect(provider).toHaveValue("OpenAI");
      await expect(page.locator("[role='option']:visible")).toHaveCount(0);

      const customModelOption = page.locator("[role='option']").filter({ hasText: /自定义模型名称/ }).first();
      await page.locator("#model").click();
      try {
        await expect(customModelOption).toBeVisible({ timeout: 10000 });
      } catch {
        await page.keyboard.press("Escape");
        await page.locator("#model").click();
        await expect(customModelOption).toBeVisible({ timeout: 15000 });
      }
      await customModelOption.click();
      await expect(page.locator("#custom_model_name")).toBeVisible();
      await page.locator("#custom_model_name").fill(modelName);
      await page.locator("#api_key").fill("sk-qa-autotest-placeholder");
      await page.getByRole("button", { name: "添加模型", exact: true }).click();

      await waitForToast(page, modelName);
      await page.getByRole("tab", { name: "已部署模型", exact: true }).click();
      const row = page.locator("tbody tr").filter({ hasText: modelName }).first();
      await expect(row).toBeVisible();
      await expect(row).toContainText(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    await expect(row).not.toContainText("未知日期");
    });

    await test.step("5. 切换 LLM 凭证、健康状态、模型组别名子页签", async () => {
      for (const [tab, marker] of Object.entries(SUB_PAGE_MARKERS)) {
        await page.getByRole("tab", { name: tab, exact: true }).click();
        await expect(page.getByRole("button", { name: marker, exact: true })).toBeVisible();
      }
    });

    await test.step("6. 删除模型并校验列表清除", async () => {
      await page.getByRole("tab", { name: "已部署模型", exact: true }).click();
      const row = page.locator("tbody tr").filter({ hasText: modelName }).first();
      await expect(row).toBeVisible();
      await row.getByRole("button", { name: "删除模型" }).click();
      const dialog = page.getByRole("dialog").filter({ hasText: "删除模型" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(modelName);
      await dialog.getByRole("button", { name: "删除", exact: true }).click();
      await waitForToast(page, "模型已成功删除");
      await expect(page.locator("tbody tr").filter({ hasText: modelName })).toHaveCount(0);
    });
  } finally {
    await deleteModelIfPresent(page, modelName).catch(() => {});
  }
});
