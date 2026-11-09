import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { BASE_URL, gotoRoute, login, uniqueName, waitForToast } from "./helpers.js";

const createdTeams = [];

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
  const leftovers = createdTeams.splice(0);
  if (leftovers.length === 0) return;
  const key = await adminKey(page);
  if (!key) {
    console.warn(`[清理] 未取得管理员凭据，以下测试团队可能残留：${leftovers.join("、")}`);
    return;
  }
  const headers = { Authorization: `Bearer ${key}` };
  for (const alias of leftovers) {
    try {
      const listResponse = await page.request.get(
        `${BASE_URL}/v2/team/list?page=1&page_size=100&search=${encodeURIComponent(alias)}`,
        { headers },
      );
      const teams = listResponse.ok() ? ((await listResponse.json()).teams ?? []) : [];
      const teamIds = teams.filter((team) => team.team_alias === alias).map((team) => team.team_id);
      if (teamIds.length === 0) continue;
      const deleteResponse = await page.request.post(`${BASE_URL}/team/delete`, {
        headers,
        data: { team_ids: teamIds },
      });
      if (!deleteResponse.ok()) {
        console.warn(`[清理] 删除团队 ${alias} 失败（HTTP ${deleteResponse.status()}），可能残留`);
      }
    } catch (error) {
      console.warn(`[清理] 删除团队 ${alias} 异常：${error.message}，可能残留`);
    }
  }
});

const openTeams = async (page) => {
  await gotoRoute(page, "teams");
  await expect(page.getByText("管理团队、成员及其对模型和预算的访问权限")).toBeVisible();
  await expect(page.getByRole("tab", { name: "我的团队" })).toBeVisible();
};

const searchTeams = async (page, text) => {
  await page.getByTestId("datatable-search").fill(text);
};

const teamRow = (page, alias) => page.locator("tbody tr").filter({ hasText: alias }).first();

const createTeam = async (page, alias) => {
  createdTeams.push(alias);
  await page.getByRole("button", { name: "创建团队" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("团队名称")).toBeVisible();
  await dialog.getByLabel("团队名称").fill(alias);
  const created = page.waitForResponse(
    (res) => res.url().endsWith("/team/new") && res.request().method() === "POST",
    { timeout: 30000 },
  );
  await dialog.getByRole("button", { name: "创建团队", exact: true }).click();
  const response = await created;
  await expect(dialog).toBeHidden();
  return response.json();
};

const deleteTeam = async (page, alias) => {
  await searchTeams(page, alias);
  const row = teamRow(page, alias);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "打开团队操作" }).click();
  await page.getByRole("menuitem", { name: "删除团队" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("确定要删除此团队");
  const confirmInput = dialog.getByPlaceholder(alias);
  await expect(confirmInput).toBeVisible();
  const confirmButton = dialog.getByRole("button", { name: "删除", exact: true });
  await expect(confirmButton).toBeDisabled();
  await confirmInput.fill(alias);
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();
  await waitForToast(page, "团队已成功删除");
  await expect(dialog).toBeHidden();
  const tracked = createdTeams.indexOf(alias);
  if (tracked >= 0) createdTeams.splice(tracked, 1);
};

test("团队管理：页面结构与默认表格列", async ({ page }) => {
  await test.step("1. 登录并打开团队管理页", async () => {
    await login(page);
    await openTeams(page);
  });

  await test.step("2. 校验工具栏、标签页与搜索框", async () => {
    await expect(page.getByRole("button", { name: "创建团队" })).toBeVisible();
    await expect(page.getByRole("button", { name: "导出 CSV" })).toBeVisible();
    await expect(page.getByRole("button", { name: "刷新" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "我的团队" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "可用团队" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "默认团队设置" })).toBeVisible();
    await expect(page.getByTestId("datatable-search")).toBeVisible();
    await expect(page.getByTestId("datatable-search")).toHaveAttribute("placeholder", /Search teams|搜索/);
  });

  await test.step("3. 校验默认表格列", async () => {
    for (const name of ["团队", "组织", "资源", "花费 / 预算", "创建时间", "操作"]) {
      await expect(page.getByRole("columnheader", { name, exact: true })).toBeVisible();
    }
  });

  await test.step("4. 刷新按钮重新拉取列表", async () => {
    const refreshed = page.waitForResponse(
      (res) => res.url().includes("/v2/team/list") && res.url().includes("page=1"),
      { timeout: 20000 },
    );
    await page.getByRole("button", { name: "刷新" }).click();
    await refreshed;
    await expect(page.getByRole("columnheader", { name: "团队", exact: true })).toBeVisible();
  });

  await test.step("5. 列设置与筛选面板可打开关闭", async () => {
    await page.getByRole("button", { name: "列" }).click();
    const columnsMenu = page.getByRole("menu");
    await expect(columnsMenu).toBeVisible();
    await expect(columnsMenu).toContainText("速率限制");
    await page.keyboard.press("Escape");
    await expect(columnsMenu).toBeHidden();

    await page.getByRole("button", { name: "筛选" }).click();
    const filterPanel = page.getByRole("dialog");
    await expect(filterPanel).toBeVisible();
    await expect(filterPanel).toContainText("团队别名");
    await expect(filterPanel).toContainText("应用筛选");
    await page.keyboard.press("Escape");
    await expect(filterPanel).toBeHidden();
  });
});

test("团队管理：创建团队并展示在我的团队列表", async ({ page }) => {
  const alias = uniqueName("qa_team");
  let createdTeam;

  await test.step("1. 登录并打开创建团队对话框", async () => {
    await login(page);
    await openTeams(page);
    await page.getByRole("button", { name: "创建团队" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  await test.step("2. 校验关键表单字段", async () => {
    const dialog = page.getByRole("dialog");
    for (const label of [/团队名称/, /Organization/, /选择模型/, /最大预算/, /TPM/, /RPM/]) {
      await expect(dialog.getByLabel(label)).toBeVisible();
    }
  });

  await test.step("3. 团队名称为空时提交被拦截", async () => {
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "创建团队", exact: true }).click();
    await expect(dialog.getByText(/Please input a team name|请输入.*名称|名称.*必填/)).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  await test.step("4. 填写名称创建团队并校验提示", async () => {
    createdTeam = await createTeam(page, alias);
    expect(createdTeam.team_alias).toBe(alias);
    await waitForToast(page, "团队已创建");
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  await test.step("5. 搜索命中并校验列表行展示团队名称与 ID", async () => {
    await searchTeams(page, alias);
    const row = teamRow(page, alias);
    await expect(row).toBeVisible();
    await expect(row).toContainText(alias);
    await expect(row).toContainText(createdTeam.team_id);
  });
});

test("团队管理：搜索与导出 CSV 跟随当前筛选", async ({ page }) => {
  const matchedAlias = uniqueName("qa_team_matched");
  const otherAlias = uniqueName("qa_team_other");
  const missingAlias = uniqueName("qa_team_missing");

  await test.step("1. 登录并创建两个团队", async () => {
    await login(page);
    await openTeams(page);
    await createTeam(page, matchedAlias);
    await createTeam(page, otherAlias);
  });

  await test.step("2. 搜索命中指定团队且不显示其他团队", async () => {
    await searchTeams(page, matchedAlias);
    await expect(teamRow(page, matchedAlias)).toBeVisible();
    await expect(teamRow(page, otherAlias)).toHaveCount(0);
  });

  await test.step("3. 搜索不存在的团队显示空状态", async () => {
    await searchTeams(page, missingAlias);
    await expect(teamRow(page, missingAlias)).toHaveCount(0);
    await expect(page.getByText("No teams found")).toBeVisible();
  });

  await test.step("4. 导出 CSV 只包含当前筛选结果", async () => {
    await searchTeams(page, matchedAlias);
    await expect(teamRow(page, matchedAlias)).toBeVisible();

    const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
    await page.getByRole("button", { name: "导出 CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^teams_export_\d{4}-\d{2}-\d{2}\.csv$/);
    const filePath = await download.path();
    expect(filePath, "导出文件应写入本地磁盘").toBeTruthy();
    const csv = fs.readFileSync(filePath, { encoding: "utf8" });

    expect(csv).toContain("Team Alias");
    expect(csv).toContain("Team ID");
    expect(csv).toContain(matchedAlias);
    expect(csv).not.toContain(otherAlias);
  });
});

test("团队管理：可用团队与默认团队设置视图", async ({ page }) => {
  await test.step("1. 登录并打开团队管理页", async () => {
    await login(page);
    await openTeams(page);
  });

  await test.step("2. 可用团队标签页展示可加入团队列", async () => {
    await page.getByRole("tab", { name: "可用团队" }).click();
    await expect(page.getByRole("tab", { name: "可用团队" })).toHaveAttribute("aria-selected", "true");
    for (const name of ["团队名称", "描述", "成员", "模型", "操作"]) {
      await expect(page.getByRole("columnheader", { name, exact: true })).toBeVisible();
    }
  });

  await test.step("3. 默认团队设置展示只读摘要", async () => {
    await page.getByRole("tab", { name: "默认团队设置" }).click();
    await expect(page.getByRole("tab", { name: "默认团队设置" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("创建新团队时将默认应用这些设置。")).toBeVisible();
    for (const text of ["预算与速率限制", "最大预算", "预算周期", "TPM 限制", "RPM 限制", "访问与权限", "默认组织", "模型", "团队成员权限"]) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "编辑设置" })).toBeVisible();
  });

  await test.step("4. 编辑设置进入可编辑态，取消后恢复只读", async () => {
    await page.getByRole("button", { name: "编辑设置" }).click();
    await expect(page.getByRole("button", { name: "保存更改" })).toBeVisible();
    await expect(page.getByRole("button", { name: "取消" })).toBeVisible();
    await expect(page.getByLabel(/最大预算/)).toBeVisible();
    await expect(page.getByLabel(/TPM/)).toBeVisible();
    await expect(page.getByLabel(/RPM/)).toBeVisible();
    await page.getByRole("button", { name: "取消" }).click();
    await expect(page.getByRole("button", { name: "保存更改" })).toBeHidden();
    await expect(page.getByRole("button", { name: "编辑设置" })).toBeVisible();
  });
});

test("团队管理：删除团队需要输入团队名称确认", async ({ page }) => {
  const alias = uniqueName("qa_team_delete");

  await test.step("1. 登录并创建待删除团队", async () => {
    await login(page);
    await openTeams(page);
    await createTeam(page, alias);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  await test.step("2. 删除确认需要输入团队名称，确认后提示成功", async () => {
    await deleteTeam(page, alias);
  });

  await test.step("3. 删除后搜索不到该团队", async () => {
    await searchTeams(page, alias);
    await expect(teamRow(page, alias)).toHaveCount(0);
    await expect(page.getByText("No teams found")).toBeVisible();
  });
});
