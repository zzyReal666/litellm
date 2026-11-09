import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { BASE_URL, gotoRoute, login, waitForToast, waitForToastsToClear } from "./helpers.js";

const createdUsers = [];

const adminKey = async (page) => {
  const jwt = (await page.context().cookies()).find((cookie) => cookie.name === "token")?.value;
  if (!jwt) return null;
  try {
    return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()).key ?? null;
  } catch {
    return null;
  }
};

test.afterEach(async ({ page }) => {
  const leftovers = createdUsers.splice(0);
  if (leftovers.length === 0) return;
  const key = await adminKey(page);
  if (!key) {
    console.warn(`[清理] 未取得管理员凭据，以下测试用户可能残留：${leftovers.join("、")}`);
    return;
  }
  const headers = { Authorization: `Bearer ${key}` };
  for (const email of leftovers) {
    try {
      const listResponse = await page.request.get(
        `${BASE_URL}/user/list?page=1&page_size=100&search=${encodeURIComponent(email)}`,
        { headers },
      );
      const users = listResponse.ok() ? ((await listResponse.json()).users ?? []) : [];
      const userIds = users.filter((user) => user.user_email === email).map((user) => user.user_id);
      if (userIds.length === 0) continue;
      const deleteResponse = await page.request.post(`${BASE_URL}/user/delete`, {
        headers,
        data: { user_ids: userIds },
      });
      if (!deleteResponse.ok()) {
        console.warn(`[清理] 删除用户 ${email} 失败（HTTP ${deleteResponse.status()}），可能残留`);
      }
    } catch (error) {
      console.warn(`[清理] 删除用户 ${email} 异常：${error.message}，可能残留`);
    }
  }
});

const openUsers = async (page) => {
  await gotoRoute(page, "users");
  await expect(page.getByText(/内部用户|Internal Users/).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: "用户", exact: true })).toBeVisible();
};

const searchUsers = async (page, text) => {
  await page.getByTestId("datatable-search").fill(text);
};

const userRow = (page, email) => page.locator("tbody tr").filter({ hasText: email }).first();

const closeAllDialogs = async (page) => {
  for (let i = 0; i < 4; i += 1) {
    const closeButtons = page.getByRole("dialog").getByRole("button", { name: "关闭", exact: true });
    if ((await closeButtons.count()) === 0) break;
    await closeButtons.last().click();
    await page.waitForTimeout(300);
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
};

const inviteUser = async (page, email) => {
  const dialog = await openInviteDialog(page);
  const sendEmail = dialog.getByRole("checkbox", { name: "发送邀请邮件" });
  await sendEmail.click();
  await expect(sendEmail).toHaveAttribute("aria-checked", "false");
  return submitInvite(page, dialog, email);
};

const openInviteDialog = async (page) => {
  await page.getByRole("button", { name: "+ 邀请用户" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("用户邮箱")).toBeVisible();
  return dialog;
};

const submitInvite = async (page, dialog, email) => {
  createdUsers.push(email);
  await dialog.getByLabel("用户邮箱").fill(email);
  const created = page.waitForResponse(
    (res) => res.url().endsWith("/user/new") && res.request().method() === "POST",
    { timeout: 30000 },
  );
  await dialog.getByRole("button", { name: "邀请用户", exact: true }).click();
  await Promise.all([created, waitForToast(page, "API 用户已创建")]);

  const invitation = page.getByRole("dialog").filter({ hasText: "Invitation Link" });
  await expect(invitation).toBeVisible();
  await expect(invitation.getByRole("button", { name: /Copy/ })).toBeVisible();
  const userId = (await invitation.innerText()).match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  )?.[0];
  expect(userId, "邀请成功对话框应展示新用户 ID").toBeTruthy();

  await closeAllDialogs(page);
  await waitForToastsToClear(page);
  return userId;
};

const clickDeleteMenuItem = async (page, row) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await row.getByRole("button", { name: "打开用户操作菜单" }).click();
    const menuItem = page.getByRole("menuitem", { name: "删除用户" });
    try {
      await menuItem.waitFor({ state: "visible", timeout: 5000 });
      await menuItem.click({ timeout: 5000 });
      return;
    } catch {
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(500);
    }
  }
  throw new Error("删除用户菜单项始终无法点击");
};

const deleteUser = async (page, email, userId) => {
  await searchUsers(page, email);
  const row = userRow(page, email);
  await expect(row).toBeVisible();
  await clickDeleteMenuItem(page, row);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("确定要删除此用户吗");
  await expect(dialog).toContainText(email);
  await expect(dialog).toContainText(userId);
  const deleteResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/user/delete") && response.request().method() === "POST",
    { timeout: 30000 },
  );
  await dialog.getByRole("button", { name: "删除", exact: true }).click();
  const deleteResponse = await deleteResponsePromise;
  expect(deleteResponse.ok()).toBeTruthy();
  await waitForToast(page, "用户已成功删除");
  await expect(dialog).toBeHidden({ timeout: 30000 });
  await waitForToastsToClear(page);
  const tracked = createdUsers.indexOf(email);
  if (tracked >= 0) createdUsers.splice(tracked, 1);
};

test("内部用户管理：页面结构与默认表格列", async ({ page }) => {
  await test.step("1. 登录并打开内部用户页", async () => {
    await login(page);
    await openUsers(page);
  });

  await test.step("2. 校验工具栏、标签页与搜索框", async () => {
    await expect(page.getByRole("button", { name: "+ 邀请用户" })).toBeVisible();
    await expect(page.getByRole("button", { name: "+ 批量邀请用户" })).toBeVisible();
    await expect(page.getByRole("button", { name: "选择用户" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "用户", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "默认用户设置" })).toBeVisible();
    await expect(page.getByTestId("datatable-search")).toBeVisible();
    await expect(page.getByTestId("datatable-search")).toHaveAttribute("placeholder", /按邮箱或 ID 搜索/);
  });

  await test.step("3. 校验默认表格列", async () => {
    for (const name of [
      "用户 ID",
      "邮箱",
      "状态",
      "全局代理角色",
      "用户别名",
      "花费（元）",
      "预算（元）",
      "虚拟密钥",
      "创建时间",
      "更新时间",
      "操作",
    ]) {
      await expect(page.getByRole("columnheader", { name, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("columnheader", { name: /^SSO ID/ })).toBeVisible();
  });

  await test.step("4. 列设置与筛选面板可打开关闭", async () => {
    await page.getByRole("button", { name: "列" }).click();
    const columnsMenu = page.getByRole("menu");
    await expect(columnsMenu).toBeVisible();
    await expect(columnsMenu).toContainText("SSO ID");
    await expect(columnsMenu).toContainText("虚拟密钥");
    await page.keyboard.press("Escape");
    await expect(columnsMenu).toBeHidden();

    await page.getByRole("button", { name: "筛选" }).click();
    const filterPanel = page.getByRole("dialog");
    await expect(filterPanel).toBeVisible();
    await expect(filterPanel).toContainText("SSO ID");
    await expect(filterPanel).toContainText("应用筛选");
    await page.keyboard.press("Escape");
    await expect(filterPanel).toBeHidden();
  });
});

test("内部用户管理：邀请用户时邮箱必填且校验格式", async ({ page }) => {
  await test.step("1. 登录并打开邀请对话框", async () => {
    await login(page);
    await openUsers(page);
    await openInviteDialog(page);
  });

  await test.step("2. 邮箱留空提交被拦截且不创建用户", async () => {
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "邀请用户", exact: true }).click();
    await expect(dialog.getByText("请填写用户邮箱")).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/邀请链接|Invitation Link/)).toHaveCount(0);
  });

  await test.step("3. 邮箱格式非法提交被拦截", async () => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("用户邮箱").fill("not-an-email");
    await dialog.getByRole("button", { name: "邀请用户", exact: true }).click();
    await expect(dialog.getByText("请输入有效的邮箱地址")).toBeVisible();
    await expect(dialog).toBeVisible();
    await expect(page.getByText(/邀请链接|Invitation Link/)).toHaveCount(0);
  });

  await test.step("4. 关闭对话框", async () => {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test("内部用户管理：邀请用户后出现在用户列表", async ({ page }) => {
  const email = `qa+${Date.now()}@example.com`;
  let userId;
  let dialog;

  await test.step("1. 登录并打开内部用户页", async () => {
    await login(page);
    await openUsers(page);
  });

  await test.step("2. 打开邀请对话框并校验默认勾选发送邀请邮件", async () => {
    dialog = await openInviteDialog(page);
    const sendEmail = dialog.getByRole("checkbox", { name: "发送邀请邮件" });
    await expect(sendEmail).toHaveAttribute("aria-checked", "true");
    await sendEmail.click();
    await expect(sendEmail).toHaveAttribute("aria-checked", "false");
  });

  await test.step("3. 提交邀请并校验邀请链接对话框", async () => {
    userId = await submitInvite(page, dialog, email);
    expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/i);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  await test.step("3.1 再次打开邀请表单时字段已清空", async () => {
    const reopened = await openInviteDialog(page);
    await expect(reopened.getByLabel("用户邮箱")).toHaveValue("");
    await reopened.getByRole("button", { name: "取消", exact: true }).click().catch(async () => {
      await page.keyboard.press("Escape");
    });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  await test.step("4. 搜索邮箱并校验列表行信息", async () => {
    await searchUsers(page, email);
    const row = userRow(page, email);
    await expect(row).toBeVisible();
    await expect(row).toContainText(userId);
    await expect(row).toContainText("已激活");
    await expect(row).toContainText("Internal User (View Only)");
    await expect(row).toContainText("无密钥");
  });
});

test("内部用户管理：搜索支持邮箱与用户 ID", async ({ page }) => {
  const email = `qa+${Date.now()}@example.com`;
  const missingEmail = `qa+missing-${Date.now()}@example.com`;
  let userId;

  await test.step("1. 登录并创建一个测试用户", async () => {
    await login(page);
    await openUsers(page);
    userId = await inviteUser(page, email);
  });

  await test.step("2. 按邮箱精确搜索能命中", async () => {
    await searchUsers(page, email);
    await expect(userRow(page, email)).toBeVisible();
  });

  await test.step("3. 按用户 ID 搜索能命中", async () => {
    await searchUsers(page, userId);
    await expect(userRow(page, email)).toBeVisible();
    await expect(userRow(page, email)).toContainText(userId);
  });

  await test.step("4. 搜索不存在的邮箱显示空状态", async () => {
    await searchUsers(page, missingEmail);
    await expect(userRow(page, missingEmail)).toHaveCount(0);
    await expect(page.getByText("未找到用户")).toBeVisible();
  });
});

test("内部用户管理：删除用户需二次确认", async ({ page }) => {
  const email = `qa+${Date.now()}@example.com`;
  let userId;

  await test.step("1. 登录并创建待删除用户", async () => {
    await login(page);
    await openUsers(page);
    userId = await inviteUser(page, email);
  });

  await test.step("2. 二次确认后删除用户", async () => {
    await deleteUser(page, email, userId);
  });

  await test.step("3. 删除后搜索不到该用户", async () => {
    await expect
      .poll(
        async () => {
          await gotoRoute(page, "users");
          await searchUsers(page, email);
          return userRow(page, email).count();
        },
        { timeout: 45000, intervals: [2000, 3000, 5000] },
      )
      .toBe(0);
    await expect(page.getByText("未找到用户")).toBeVisible();
  });
});

test("内部用户管理：默认用户设置摘要与编辑态", async ({ page }) => {
  await test.step("1. 登录并打开默认用户设置", async () => {
    await login(page);
    await openUsers(page);
    await page.getByRole("tab", { name: "默认用户设置" }).click();
    await expect(page.getByRole("tab", { name: "默认用户设置" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("应用于通过 SSO 或用户管理 API 创建的每个新内部用户。")).toBeVisible();
  });

  await test.step("2. 校验默认设置摘要", async () => {
    for (const text of ["默认角色", "最大预算（元）", "重置预算", "默认模型", "默认团队"]) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
    await expect(
      page.getByRole("tabpanel", { name: "默认用户设置" }).getByText("Internal User (View Only)"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "编辑设置" })).toBeVisible();
  });

  await test.step("3. 编辑设置进入可编辑态，取消后恢复只读", async () => {
    await page.getByRole("button", { name: "编辑设置" }).click();
    await expect(page.getByRole("button", { name: "保存更改" })).toBeVisible();
    await expect(page.getByRole("button", { name: "取消" })).toBeVisible();
    await expect(page.getByLabel(/默认角色/)).toBeVisible();
    await expect(page.getByLabel(/最大预算/)).toBeVisible();
    await expect(page.getByLabel(/重置预算/)).toBeVisible();
    await expect(page.getByRole("button", { name: "添加团队" })).toBeVisible();
    await page.getByRole("button", { name: "取消" }).click();
    await expect(page.getByRole("button", { name: "保存更改" })).toBeHidden();
    await expect(page.getByRole("button", { name: "编辑设置" })).toBeVisible();
  });
});

test("内部用户管理：批量邀请对话框与非法文件拦截", async ({ page }) => {
  await test.step("1. 登录并打开批量邀请对话框", async () => {
    await login(page);
    await openUsers(page);
    await page.getByRole("button", { name: "+ 批量邀请用户" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("下载并填写模板");
    await expect(dialog).toContainText("上传填写好的 CSV");
    await expect(dialog).toContainText("模板列名说明");
    await expect(dialog).toContainText("user_email");
    await expect(dialog).toContainText("budget_duration");
  });

  await test.step("2. 下载 CSV 模板并校验文件名与表头", async () => {
    const dialog = page.getByRole("dialog");
    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await dialog.getByRole("button", { name: "下载 CSV 模板" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("bulk_users_template.csv");
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const content = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const [header, exampleRow] = content.trim().split("\n");
    expect(header).toBe("user_email,user_role,teams,max_budget,budget_duration,models");
    expect(exampleRow.split(",")[0]).toContain("@");
  });

  await test.step("3. 上传非 CSV 文件被拒绝", async () => {
    const dialog = page.getByRole("dialog");
    const fileInput = dialog.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);
    await expect(fileInput).toHaveAttribute("accept", ".csv");
    await fileInput.setInputFiles({
      name: "not-a-csv.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("user_email\n"),
    });
    await expect(dialog.getByText(/文件类型无效|请上传 CSV 文件/)).toBeVisible();
  });

  await test.step("4. 关闭对话框", async () => {
    await page.getByRole("dialog").getByRole("button", { name: "关闭", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
