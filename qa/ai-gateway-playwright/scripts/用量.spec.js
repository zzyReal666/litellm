import { expect, test } from "@playwright/test";
import { gotoRoute, login } from "./helpers.js";

const DATE_RANGE = /^\d{1,2} \w+, \d{2}:\d{2} - \d{1,2} \w+, \d{2}:\d{2}$/;

test("用量：总览与四类活动标签页、日期范围、导出入口", async ({ page }) => {
  test.setTimeout(180000);

  await test.step("1. 登录并打开用量页面", async () => {
    await login(page);
    await gotoRoute(page, "usage", page.getByRole("heading", { level: 1, name: "Usage" }));
    await expect(page.getByText("选择时间范围")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "选择您要查看的用量数据" })).toHaveText(/Global Usage/);
  });

  await test.step("2. 校验总览统计卡片与看板分区", async () => {
    for (const stat of ["Spend", "总请求数", "总 Token 数", "平均成本 / 请求", "平均延迟"]) {
      await expect(page.getByText(stat, { exact: true }).first()).toBeVisible();
    }
    for (const section of ["热门模型", "热门 agent", "按提供商统计花费", "热门虚拟密钥"]) {
      await expect(page.getByRole("heading", { name: section })).toBeVisible();
    }
  });

  await test.step("3. 校验按提供商统计花费表格", async () => {
    const providerTable = page.getByRole("table").filter({
      has: page.getByRole("columnheader", { name: "提供商", exact: true }),
    });
    await expect(providerTable).toBeVisible();
    for (const column of ["提供商", "花费", "成功", "失败", "Token"]) {
      await expect(providerTable.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
    }
    await expect(page.getByText("显示零花费")).toBeVisible();
    await expect(page.getByText("显示未知")).toBeVisible();
  });

  await test.step("4. 校验热门虚拟密钥表格与视图切换", async () => {
    const keyTable = page.getByRole("table").filter({
      has: page.getByRole("columnheader", { name: "密钥 ID", exact: true }),
    });
    await expect(keyTable).toBeVisible();
    for (const column of ["密钥 ID", "密钥别名", "花费（元）"]) {
      await expect(keyTable.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
    }
    const viewSwitch = page.getByRole("radiogroup", { name: "视图" });
    await expect(viewSwitch.getByRole("radio", { name: "表格视图", exact: true })).toBeChecked();
    await expect(viewSwitch.getByRole("radio", { name: "图表视图", exact: true })).toBeVisible();
    const keyLimit = page.getByRole("radiogroup", { name: "显示的热门密钥数量" });
    for (const limit of ["5", "10", "25", "50"]) {
      await expect(keyLimit.getByRole("radio", { name: limit, exact: true })).toBeVisible();
    }
  });

  await test.step("5. 校验热门模型图表控件", async () => {
    const metric = page.getByRole("radiogroup", { name: "Metric" });
    for (const toggle of ["Spend", "Tokens", "Requests"]) {
      await expect(metric.getByRole("radio", { name: toggle, exact: true })).toBeVisible();
    }
    const bucket = page.getByRole("radiogroup", { name: "分桶粒度" });
    for (const toggle of ["Daily", "Weekly"]) {
      await expect(bucket.getByRole("radio", { name: toggle, exact: true })).toBeVisible();
    }
    const scale = page.getByRole("radiogroup", { name: "Scale" });
    for (const toggle of ["Linear", "Log"]) {
      await expect(scale.getByRole("radio", { name: toggle, exact: true })).toBeVisible();
    }
    const agentMetric = page.getByRole("radiogroup", { name: "Agent 指标" });
    for (const toggle of ["Tokens", "Spend", "Requests"]) {
      await expect(agentMetric.getByRole("radio", { name: toggle, exact: true })).toBeVisible();
    }
  });

  await test.step("6. 切换 Global 用量视图下拉", async () => {
    await page.getByRole("combobox", { name: "选择您要查看的用量数据" }).click();
    for (const option of ["Global Usage", "Your Usage", "Team Usage", "User Usage"]) {
      await expect(page.getByRole("option", { name: new RegExp(`^${option}`) })).toBeVisible();
    }
    await page.getByRole("option", { name: /^Global Usage/ }).click();
    await expect(page.getByRole("combobox", { name: "选择您要查看的用量数据" })).toHaveText(/Global Usage/);
  });

  await test.step("7. 校验日期范围选择与应用", async () => {
    const trigger = page.locator('[data-slot="advanced-date-picker-trigger"]');
    await expect(trigger).toHaveText(DATE_RANGE);
    await trigger.click();
    const panel = page.locator('[data-slot="advanced-date-picker-panel"]');
    await expect(panel).toBeVisible();
    for (const preset of ["今天", "过去 7 天", "过去 30 天", "本月至今", "今年至今"]) {
      await expect(panel.getByRole("button").filter({ hasText: preset })).toBeVisible();
    }
    await expect(panel.getByText("开始日期", { exact: true })).toBeVisible();
    await expect(panel.getByText("结束日期", { exact: true })).toBeVisible();
    await panel.getByRole("button").filter({ hasText: "过去 30 天" }).click();
    await panel.getByRole("button", { name: "应用" }).click();
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveText(DATE_RANGE);
  });

  await test.step("8. 切换模型活动标签页", async () => {
    await page.getByRole("tab", { name: "模型活动" }).click();
    const panel = page.getByRole("tabpanel", { name: "模型活动" });
    for (const label of ["公开模型名称", "网关模型名称", "整体用量", "总成功请求数", "Token 总量随时间变化", "请求总量随时间变化"]) {
      await expect(panel.getByText(label, { exact: true }).first()).toBeVisible();
    }
  });

  await test.step("9. 切换密钥活动标签页", async () => {
    await page.getByRole("tab", { name: "密钥活动" }).click();
    const panel = page.getByRole("tabpanel", { name: "密钥活动" });
    await expect(panel.getByText("整体用量", { exact: true })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "虚拟密钥" })).toBeVisible();
    await expect(panel.getByRole("textbox", { name: "搜索密钥" })).toBeVisible();
    await expect(panel.getByText(/\d+ 个密钥/)).toBeVisible();
    await expect(panel.getByRole("button").filter({ hasText: "请求数" }).first()).toBeVisible();
  });

  await test.step("10. 切换 MCP 服务器活动标签页", async () => {
    await page.getByRole("tab", { name: "MCP 服务器活动" }).click();
    const panel = page.getByRole("tabpanel", { name: "MCP 服务器活动" });
    await expect(panel.getByText("整体用量", { exact: true })).toBeVisible();
    await expect(panel.getByText("总请求数", { exact: true })).toBeVisible();
    await expect(panel.getByText("Total Tokens", { exact: true })).toBeVisible();
  });

  await test.step("11. 切换端点活动标签页", async () => {
    await page.getByRole("tab", { name: "端点活动" }).click();
    const panel = page.getByRole("tabpanel", { name: "端点活动" });
    await expect(panel.getByText("按端点统计成功与失败请求", { exact: true })).toBeVisible();
    await expect(panel.getByText("端点用量趋势", { exact: true })).toBeVisible();
    for (const column of ["端点", "成功 / 失败", "总请求数", "成功率", "总令牌数", "花费"]) {
      await expect(panel.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
    }
  });

  await test.step("12. 返回总览并校验导出弹窗", async () => {
    await page.getByRole("tab", { name: "Overview" }).click();
    await expect(page.getByRole("heading", { name: "热门虚拟密钥" })).toBeVisible();
    await page.getByRole("button", { name: "导出数据" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("导出用量数据", { exact: true })).toBeVisible();
    await expect(dialog.getByText("导出类型", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Format", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Export CSV" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
