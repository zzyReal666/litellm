import { expect, test } from "@playwright/test";
import { gotoRoute, login } from "./helpers.js";

const REQUEST_LOG_COLUMNS = [
  "时间",
  "类型",
  "状态",
  "会话 ID",
  "请求 ID",
  "费用",
  "耗时（秒）",
  "TTFT（秒）",
  "团队名称",
  "密钥哈希",
  "密钥别名",
  "模型",
  "Token",
  "内部用户",
  "终端用户",
  "标签",
];

test("日志：请求日志检索与筛选、四类日志标签页", async ({ page }) => {
  test.setTimeout(180000);

  await test.step("1. 登录并打开日志页面", async () => {
    await login(page);
    await gotoRoute(page, "logs", page.getByRole("tab", { name: "请求日志" }));
    await expect(page.getByRole("tabpanel", { name: "请求日志" })).toBeVisible();
  });

  await test.step("2. 校验请求日志表格列", async () => {
    const panel = page.getByRole("tabpanel", { name: "请求日志" });
    await expect(panel.locator("table:visible").first().locator("tbody tr:visible").first()).toBeVisible();
    const headers = (await panel.locator("thead th:visible").allInnerTexts()).map((text) => text.trim());
    expect(headers).toEqual(REQUEST_LOG_COLUMNS);
    await expect(panel.locator('[data-testid="pagination-range"]:visible')).toContainText(/显示第 .* 条，共 .* 条/);
  });

  await test.step("3. 按请求 ID 检索日志", async () => {
    const panel = page.getByRole("tabpanel", { name: "请求日志" });
    const table = panel.locator("table:visible").first();
    const timeColumn = REQUEST_LOG_COLUMNS.indexOf("时间");
    const firstRowCells = (await table.locator("tbody tr:visible").first().locator("td").allInnerTexts()).map((text) => text.trim());
    expect(firstRowCells[timeColumn]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    for (const column of ["团队名称", "内部用户", "终端用户", "标签"]) {
      const index = REQUEST_LOG_COLUMNS.indexOf(column);
      expect(firstRowCells[index], `${column}列不应显示裸短横线`).not.toBe("-");
    }
    const idColumn = REQUEST_LOG_COLUMNS.indexOf("请求 ID");
    const requestId = firstRowCells[idColumn];
    expect(requestId).toMatch(/^[0-9a-f-]{8,}$/);
    const search = panel.getByPlaceholder("Search logs by ID…");
    await search.fill(requestId);
    await expect(panel.locator('[data-testid="pagination-range"]:visible')).toContainText("共 1 条");
    const filteredCells = (await table.locator("tbody tr:visible").first().locator("td").allInnerTexts()).map((text) => text.trim());
    expect(filteredCells[idColumn]).toBe(requestId);
    await search.fill("");
    await expect(panel.locator('[data-testid="pagination-range"]:visible')).not.toContainText("共 1 条");
  });

  await test.step("4. 校验时间范围快捷筛选", async () => {
    const panel = page.getByRole("tabpanel", { name: "请求日志" });
    const rangeButton = panel.getByRole("button", { name: /^最近 24 小时$/ });
    await rangeButton.click();
    const popover = page.locator("[data-slot='popover-content']");
    await expect(popover).toBeVisible();
    for (const option of ["最近 1 分钟", "最近 15 分钟", "最近 1 小时", "最近 4 小时", "最近 24 小时", "最近 7 天", "自定义范围"]) {
      await expect(popover.getByText(option, { exact: true })).toBeVisible();
    }
    await popover.getByRole("button", { name: "最近 1 小时", exact: true }).click();
    await expect(panel.getByRole("button", { name: /^最近 1 小时$/ })).toBeVisible();
    await panel.getByRole("button", { name: /^最近 1 小时$/ }).click();
    await expect(popover.getByRole("button", { name: "最近 24 小时", exact: true })).toBeVisible();
    await popover.getByRole("button", { name: "最近 24 小时", exact: true }).click();
    await expect(panel.getByRole("button", { name: /^最近 24 小时$/ })).toBeVisible();
  });

  await test.step("5. 校验自定义时间范围输入", async () => {
    const panel = page.getByRole("tabpanel", { name: "请求日志" });
    await panel.getByRole("button", { name: /^最近 24 小时$/ }).click();
    const popover = page.locator("[data-slot='popover-content']");
    await popover.getByRole("button", { name: "自定义范围", exact: true }).click();
    await expect(panel.locator('input[type="datetime-local"]')).toHaveCount(2);
    await page.keyboard.press("Escape");
    await expect(popover).toBeHidden();
  });

  await test.step("6. 校验筛选抽屉字段", async () => {
    const panel = page.getByRole("tabpanel", { name: "请求日志" });
    await panel.locator('[data-testid="datatable-filters-trigger"]:visible').click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/^筛选$/)).toBeVisible();
    for (const label of ["团队 ID", "密钥别名", "用户 ID", "终端用户", "错误码", "错误信息", "密钥哈希", "会话 ID", "模型", "公共模型 / 搜索工具"]) {
      await expect(dialog.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(dialog.getByRole("button", { name: "重置" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "应用筛选" })).toBeVisible();
    await dialog.getByRole("button", { name: "关闭" }).click();
    await expect(dialog).toBeHidden();
  });

  await test.step("7. 校验实时追踪与隐藏健康检查开关", async () => {
    const panel = page.getByRole("tabpanel", { name: "请求日志" });
    const liveTail = panel.getByRole("switch", { name: "实时追踪" });
    await expect(liveTail).toBeChecked();
    await expect(panel.getByText("每 15 秒刷新")).toBeVisible();
    await liveTail.click();
    await expect(liveTail).not.toBeChecked();
    await expect(panel.getByText("每 15 秒刷新")).toBeHidden();
    await liveTail.click();
    await expect(liveTail).toBeChecked();
    const hideHealth = panel.getByRole("switch", { name: "隐藏健康检查" });
    await expect(hideHealth).not.toBeChecked();
    await hideHealth.click();
    await expect(hideHealth).toBeChecked();
    await hideHealth.click();
    await expect(hideHealth).not.toBeChecked();
  });

  await test.step("8. 切换审计日志标签页", async () => {
    await page.getByRole("tab", { name: "审计日志" }).click();
    const panel = page.getByRole("tabpanel", { name: "审计日志" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/企业版功能/).first()).toBeVisible();
  });

  await test.step("9. 切换已删除密钥标签页", async () => {
    await page.getByRole("tab", { name: "已删除密钥" }).click();
    const panel = page.getByRole("tabpanel", { name: "已删除密钥" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/即将进入企业版/).first()).toBeVisible();
    for (const column of ["密钥 ID", "密钥别名", "团队别名", "花费（元）", "预算（元）", "用户邮箱", "用户 ID", "创建时间", "创建人", "删除时间", "删除人"]) {
      await expect(panel.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
    }
  });

  await test.step("10. 切换已删除团队标签页", async () => {
    await page.getByRole("tab", { name: "已删除团队" }).click();
    const panel = page.getByRole("tabpanel", { name: "已删除团队" });
    await expect(panel).toBeVisible();
    for (const column of ["团队名称", "团队 ID", "创建时间", "花费（元）", "预算（元）", "模型", "组织", "删除时间", "删除人"]) {
      await expect(panel.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
    }
    await expect(panel.getByRole("table").locator("tbody tr:visible").first()).toBeVisible();
  });

  await test.step("11. 返回请求日志标签页", async () => {
    await page.getByRole("tab", { name: "请求日志" }).click();
    const panel = page.getByRole("tabpanel", { name: "请求日志" });
    await expect(panel).toBeVisible();
    const headers = (await panel.locator("thead th:visible").allInnerTexts()).map((text) => text.trim());
    expect(headers).toEqual(REQUEST_LOG_COLUMNS);
  });
});
