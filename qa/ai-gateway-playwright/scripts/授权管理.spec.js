import { expect, test } from "@playwright/test";
import { gotoRoute, login } from "./helpers.js";

const PRODUCT_NAME = "中安云科 AI 安全网关";
const BEIJING_OFFSET = "+08:00";
const BEIJING_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const beijingDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  expect(match, `授权时间格式应为 YYYY-MM-DD HH:mm:ss，实际为 ${value}`).not.toBeNull();
  return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}${BEIJING_OFFSET}`);
};

const beijingDay = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

test("授权管理：已授权状态、授权信息字段与北京时间显示", async ({ page }) => {
  test.setTimeout(180000);

  await test.step("1. 登录并打开授权管理页面", async () => {
    await login(page);
    await gotoRoute(page, "license", page.getByRole("heading", { level: 1, name: "授权信息" }));
    await expect(page.getByText("本产品尚未授权")).toHaveCount(0);
    await expect(page.getByText("无法获取授权信息")).toHaveCount(0);
  });

  let license;
  await test.step("2. 校验产品名、版本与已授权状态", async () => {
    license = await page.evaluate(async () => {
      const response = await fetch("/product/license/info");
      return response.json();
    });
    expect(license.auth_state).toBe("authorized");
    await expect(page.getByText(`${PRODUCT_NAME} · 版本 ${license.product_version}`, { exact: true })).toBeVisible();
    await expect(page.getByTestId("product-license-status")).toHaveText(license.status);
    await expect(page.getByTestId("product-license-status")).toHaveText("正式授权");
  });

  await test.step("3. 校验授权信息字段与接口返回一致", async () => {
    const column = (label) => page.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) });
    const value = (label) => column(label).locator("dd");
    const fields = [
      ["产品名称", license.product_name],
      ["产品版本", license.product_version],
      ["机器码", license.machine_code],
      ["授权状态", license.status],
      ["有效期", license.time],
      ["授权日期", license.create_time],
      ["授权版本", String(license.license_version)],
      ["授权用户数", String(license.user_count)],
      ["授权线程数", String(license.thread_count)],
      ["用户描述", license.user_desc],
      ["授权文件", license.license_file],
    ];
    for (const [label, expected] of fields) {
      await expect(value(label), `${label}应与接口返回一致`).toHaveText(expected);
    }
    await expect(value("产品名称")).toHaveText(PRODUCT_NAME);
    await expect(value("机器码")).toHaveText(/^[0-9A-F]{4}(-[0-9A-F]{4}){3}$/);
    await expect(value("机器码")).toHaveText(license.serial_number);
    await expect(page.locator("dl > div").filter({ has: page.getByText("产品序列号", { exact: true }) })).toHaveCount(0);
    await expect(value("授权状态")).toHaveText("正式授权");
    await expect(value("有效期")).toHaveText("长期有效");
    await expect(value("授权文件")).toHaveText(/\.lic$/);
  });

  await test.step("4. 校验授权日期按北京时间显示", async () => {
    const createTime = await page.locator("dl > div").filter({ has: page.getByText("授权日期", { exact: true }) }).locator("dd").innerText();
    expect(createTime).toMatch(BEIJING_TIME);
    expect(createTime).toBe(license.create_time);
    const ageMs = Date.now() - beijingDate(createTime).getTime();
    expect(ageMs).toBeGreaterThan(-5 * 60 * 1000);
    // 时区回归：授权时间若按 UTC 渲染，会比北京时间早 8 小时，同一天内即可用该阈值发现
    if (createTime.startsWith(beijingDay())) {
      expect(ageMs).toBeLessThan(8 * 60 * 60 * 1000);
    }
  });

  await test.step("5. 校验授权操作入口与刷新状态", async () => {
    await expect(page.getByRole("button", { name: "下载授权申请码" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "上传授权文件" })).toBeEnabled();
    const refresh = page.getByRole("button", { name: "刷新状态" });
    await expect(refresh).toBeEnabled();
    const [response] = await Promise.all([
      page.waitForResponse((item) => item.url().includes("/product/license/info") && item.status() === 200),
      refresh.click(),
    ]);
    expect(response.url()).toContain("/product/license/info");
    await expect(page.getByTestId("product-license-status")).toHaveText("正式授权");
  });
});
