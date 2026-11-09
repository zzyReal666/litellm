import { expect, test } from "@playwright/test";
import { gotoRoute, login } from "./helpers.js";

const DATE_RANGE = /^\d{1,2} \w+, \d{2}:\d{2} - \d{1,2} \w+, \d{2}:\d{2}$/;

const tabPanel = (page, name) => page.getByRole("tabpanel", { name, exact: true });

test("成本优化：总览节省看板与压缩、缓存、自动路由标签页", async ({ page }) => {
  test.setTimeout(180000);

  await test.step("1. 登录并打开成本优化页面", async () => {
    await login(page);
    await gotoRoute(page, "costOptimization", page.getByRole("heading", { level: 1, name: "成本优化" }));
    await expect(page.getByText(/跟踪并配置可为你省钱的机制/)).toBeVisible();
    await expect(page.getByText("这是一个实验性面板")).toBeVisible();
  });

  await test.step("2. 校验四个标签页", async () => {
    for (const tab of ["总览", "提示词压缩", "提示词缓存", "自动路由"]) {
      await expect(page.getByRole("tab", { name: tab })).toBeVisible();
    }
    await expect(page.getByRole("tab", { name: "总览" })).toHaveAttribute("aria-selected", "true");
  });

  await test.step("3. 校验总览节省卡片", async () => {
    const panel = tabPanel(page, "总览");
    for (const tile of ["共计节省", "压缩节省", "提示词缓存节省", "自动路由节省"]) {
      await expect(panel.getByText(tile, { exact: true })).toBeVisible();
    }
    await expect(panel.getByText("网关注入", { exact: true })).toBeVisible();
    await expect(panel.getByText("总计", { exact: true })).toBeVisible();
    await expect(panel.getByText(/已压缩 .+ 个 Token/)).toBeVisible();
    await expect(panel.getByText(/相比它可能选到的最贵模型/)).toBeVisible();
  });

  await test.step("4. 校验节省趋势图与来源/工具分区", async () => {
    const panel = tabPanel(page, "总览");
    await expect(panel.getByText("花费按 UTC 日期分桶")).toBeVisible();
    await expect(panel.locator('[data-slot="advanced-date-picker-trigger"]')).toHaveText(DATE_RANGE);
    await expect(panel.getByText("节省", { exact: true })).toBeVisible();
    await expect(panel.getByText(/累计节省/)).toBeVisible();
    await expect(panel.getByText("Compression", { exact: true })).toBeVisible();
    await expect(panel.getByText("Auto-router", { exact: true })).toBeVisible();
    await expect(panel.getByText("按来源统计的节省", { exact: true })).toBeVisible();
    await expect(panel.getByText("按工具统计的花费", { exact: true })).toBeVisible();
    await expect(panel.getByText(/仅声明而未调用工具不计入/)).toBeVisible();
  });

  await test.step("5. 切换累计与按天视图", async () => {
    const panel = tabPanel(page, "总览");
    await expect(panel.getByRole("tab", { name: "累计" })).toHaveAttribute("aria-selected", "true");
    await panel.getByRole("tab", { name: "按天" }).click();
    await expect(panel.getByRole("tab", { name: "按天" })).toHaveAttribute("aria-selected", "true");
    await panel.getByRole("tab", { name: "累计" }).click();
    await expect(panel.getByRole("tab", { name: "累计" })).toHaveAttribute("aria-selected", "true");
  });

  await test.step("6. 校验提示词压缩标签页", async () => {
    await page.getByRole("tab", { name: "提示词压缩" }).click();
    const panel = tabPanel(page, "提示词压缩");
    await expect(panel.getByText("Headroom 提示词压缩", { exact: true })).toBeVisible();
    await expect(panel.getByText("添加 Headroom 压缩护栏", { exact: true })).toBeVisible();
    await expect(panel.getByText("Headroom API 地址", { exact: true })).toBeVisible();
    await expect(panel.getByText("应用到所有请求", { exact: true })).toBeVisible();
    await expect(panel.getByRole("button", { name: "添加护栏" })).toBeVisible();
  });

  await test.step("7. 校验提示词缓存标签页", async () => {
    await page.getByRole("tab", { name: "提示词缓存" }).click();
    const panel = tabPanel(page, "提示词缓存");
    await expect(panel.getByText("提示词缓存", { exact: true }).first()).toBeVisible();
    await expect(panel.getByText("Anthropic 自动提示词缓存", { exact: true })).toBeVisible();
    await expect(panel.getByText("缓存存活时间（TTL）", { exact: true })).toBeVisible();
    await expect(panel.getByText("请求与缓存泄漏的日期范围", { exact: true })).toBeVisible();
    await expect(panel.getByText("提示缓存请求", { exact: true })).toBeVisible();
    await expect(panel.getByText("按虚拟密钥统计的缓存流失", { exact: true })).toBeVisible();
  });

  await test.step("8. 校验自动路由标签页", async () => {
    await page.getByRole("tab", { name: "自动路由" }).click();
    const panel = tabPanel(page, "自动路由");
    await expect(panel.getByText("自动路由用量", { exact: true })).toBeVisible();
    await expect(panel.getByRole("tab", { name: "用量" })).toBeVisible();
    await expect(panel.getByRole("tab", { name: "影子评估" })).toBeVisible();
    await expect(panel.locator('[data-slot="advanced-date-picker-trigger"]:visible').first()).toBeVisible();
  });

  await test.step("9. 返回总览标签页", async () => {
    await page.getByRole("tab", { name: "总览" }).click();
    await expect(page.getByRole("tab", { name: "总览" })).toHaveAttribute("aria-selected", "true");
    await expect(tabPanel(page, "总览").getByText("共计节省", { exact: true })).toBeVisible();
  });
});
