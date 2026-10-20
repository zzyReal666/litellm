/* @vitest-environment jsdom */
import type { PaginationState, RowSelectionState, SortingState } from "@tanstack/react-table";
import { cleanup, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { UserInfo } from "@/components/networking";

import { UsersTable } from "./UsersTable";

const possibleUIRoles = {
  proxy_admin: { ui_label: "Admin" },
  internal_user: { ui_label: "Internal User" },
};

const makeUser = (overrides: Partial<UserInfo> = {}): UserInfo =>
  ({
    user_id: "user-1",
    user_email: "ada@example.com",
    user_alias: null,
    user_role: "proxy_admin",
    spend: 12.5,
    max_budget: null,
    models: [],
    key_count: 2,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
    sso_user_id: null,
    budget_duration: null,
    ...overrides,
  }) as UserInfo;

function Harness({
  data = [makeUser()],
  rowCount = 1,
  isLoading = false,
}: {
  data?: UserInfo[];
  rowCount?: number;
  isLoading?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "created_at", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return (
    <UsersTable
      data={data}
      rowCount={rowCount}
      isLoading={isLoading}
      possibleUIRoles={possibleUIRoles}
      teams={[]}
      sorting={sorting}
      onSortingChange={setSorting}
      pagination={pagination}
      onPaginationChange={setPagination}
      columnFilters={[]}
      onColumnFiltersChange={vi.fn()}
      searchValue=""
      onSearchChange={vi.fn()}
      selectionEnabled={false}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      onUserClick={vi.fn()}
      onDeleteUser={vi.fn()}
      onResetPassword={vi.fn()}
    />
  );
}

describe("UsersTable 中文界面", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("把用户列表的表头渲染成中文", () => {
    render(<Harness />);

    const headerRow = screen.getAllByRole("row")[0];

    [
      "用户 ID",
      "邮箱",
      "状态",
      "全局代理角色",
      "用户别名",
      "花费（USD）",
      "预算（USD）",
      "虚拟密钥",
      "创建时间",
    ].forEach((header) => {
      expect(headerRow).toHaveTextContent(header);
    });
  });

  it("把状态徽标与密钥数量渲染成中文", () => {
    const { rerender } = render(<Harness />);

    expect(screen.getByTestId("user-status-user-1")).toHaveTextContent("已激活");
    expect(screen.getByText("2 个密钥")).toBeInTheDocument();

    rerender(<Harness data={[makeUser({ metadata: { scim_active: false }, key_count: 0 } as Partial<UserInfo>)]} />);
    expect(screen.getByTestId("user-status-user-1")).toHaveTextContent("未激活");
    expect(screen.getByText("无密钥")).toBeInTheDocument();
  });

  it("把行内操作菜单与筛选抽屉渲染成中文", async () => {
    render(<Harness />);

    expect(screen.getByLabelText("打开用户操作菜单")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按邮箱或 ID 搜索…")).toBeInTheDocument();
  });

  it("把空状态与筛选占位符渲染成中文", async () => {
    const { rerender } = render(<Harness data={[]} rowCount={0} />);

    expect(screen.getByText("未找到用户")).toBeInTheDocument();
    expect(screen.getByText("请尝试调整搜索条件或筛选。")).toBeInTheDocument();

    rerender(<Harness />);
    expect(screen.getByText("筛选")).toBeInTheDocument();
  });

  it("把加载中的提示渲染成中文", () => {
    render(<Harness data={[]} rowCount={0} isLoading />);

    expect(screen.getByText("正在加载用户…")).toBeInTheDocument();
  });
});
