import React from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, testQueryClient } from "@/../tests/test-utils";
import i18n from "@/lib/i18n";
import { ApiError } from "@/lib/http/client";
import type { budgetItem } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import type { ResourceListResult } from "@/app/(dashboard)/hooks/common/useResourceList";
import BudgetTable from "./BudgetTable";

const makeBudget = (overrides: Partial<budgetItem> = {}): budgetItem => ({
  budget_id: "budget-1",
  max_budget: 100,
  soft_budget: null,
  tpm_limit: 1000,
  rpm_limit: 10,
  budget_duration: "30d",
  budget_reset_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const makeList = (overrides: Partial<ResourceListResult<budgetItem>> = {}): ResourceListResult<budgetItem> => ({
  rows: [makeBudget()],
  rowCount: 1,
  isLoading: false,
  isFetching: false,
  error: null,
  refetch: vi.fn(),
  sorting: [{ id: "created_at", desc: true }],
  onSortingChange: vi.fn(),
  pagination: { pageIndex: 0, pageSize: 50 },
  onPaginationChange: vi.fn(),
  columnFilters: [],
  onColumnFiltersChange: vi.fn(),
  searchValue: "",
  onSearchChange: vi.fn(),
  ...overrides,
});

const defaultProps = {
  canModify: true,
  onEditClick: vi.fn(),
  onDeleteClick: vi.fn(),
};

const showColumn = async (user: ReturnType<typeof userEvent.setup>, columnId: string) => {
  await user.click(screen.getByTestId("view-options-trigger"));
  await user.click(await screen.findByTestId(`view-option-${columnId}`));
};

const openFilters = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId("datatable-filters-trigger"));
  await screen.findByTestId("filter-drawer-body");
};

const FORBIDDEN_PROBLEM = {
  type: "about:blank",
  title: "Forbidden",
  status: 403,
  detail: "Only proxy admins can view budgets",
};

describe("BudgetTable in Chinese", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testQueryClient.clear();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<BudgetTable {...defaultProps} list={makeList()} />);

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual(expect.arrayContaining(["预算 ID", "最大预算", "TPM", "RPM", "操作"]));
    expect(screen.getByPlaceholderText("按预算 ID 搜索…")).toBeInTheDocument();
  });

  it("renders the empty and no-match states in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { unmount } = renderWithProviders(
      <BudgetTable {...defaultProps} list={makeList({ rows: [], rowCount: 0 })} />,
    );

    expect(screen.getByText("暂无预算")).toBeInTheDocument();
    expect(screen.getByText("创建预算以为客户设置花费、TPM 和 RPM 限制。")).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <BudgetTable {...defaultProps} list={makeList({ rows: [], rowCount: 0, searchValue: "nope" })} />,
    );
    expect(screen.getByText("没有匹配的预算")).toBeInTheDocument();
    expect(screen.getByText("没有预算符合你的搜索或筛选条件。")).toBeInTheDocument();
  });

  it("renders the access denied and load failure states in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const forbidden = new ApiError("Only proxy admins can view budgets", 403, FORBIDDEN_PROBLEM);
    const { unmount } = renderWithProviders(
      <BudgetTable {...defaultProps} list={makeList({ rows: [], rowCount: 0, error: forbidden })} />,
    );

    expect(screen.getByText("你无权访问预算")).toBeInTheDocument();
    expect(screen.getByText("请联系代理管理员为你授予管理员查看者角色。")).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <BudgetTable
        {...defaultProps}
        list={makeList({ rows: [], rowCount: 0, error: new ApiError("boom", 500, null) })}
      />,
    );
    expect(screen.getByText("无法加载预算")).toBeInTheDocument();
  });

  it("renders the row actions and a missing reset duration in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderWithProviders(
      <BudgetTable {...defaultProps} list={makeList({ rows: [makeBudget({ budget_duration: null })] })} />,
    );

    expect(screen.getByRole("button", { name: "打开预算操作" })).toBeInTheDocument();
    await user.click(screen.getByTestId("budget-actions-budget-1"));
    expect(await screen.findByText("编辑预算")).toBeInTheDocument();
    expect(screen.getByText("删除预算")).toBeInTheDocument();

    await showColumn(user, "budget_duration");
    expect(screen.getByText("未设置")).toBeInTheDocument();
  });

  it("labels the filter drawer and the filter chips in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    const onColumnFiltersChange = vi.fn();
    const { unmount } = renderWithProviders(
      <BudgetTable {...defaultProps} list={makeList({ onColumnFiltersChange })} />,
    );

    await openFilters(user);
    expect(screen.getByText("缩小预算范围")).toBeInTheDocument();
    const drawer = within(screen.getByTestId("filter-drawer-body"));
    expect(drawer.getByText("重置")).toBeInTheDocument();
    expect(drawer.getByText("最大预算（美元）")).toBeInTheDocument();
    expect(drawer.getByText("仅显示无限制")).toBeInTheDocument();
    expect(drawer.getByPlaceholderText("最小值")).toBeInTheDocument();
    expect(drawer.getByPlaceholderText("最大值")).toBeInTheDocument();

    fireEvent.change(drawer.getByTestId("budget-filter-max-budget-min"), { target: { value: "10" } });
    fireEvent.change(drawer.getByTestId("budget-filter-max-budget-max"), { target: { value: "500" } });
    await user.click(screen.getByTestId("filter-drawer-apply"));

    await waitFor(() => expect(onColumnFiltersChange).toHaveBeenCalled());
    const applyUpdater = onColumnFiltersChange.mock.calls[0][0] as (previous: ColumnFiltersState) => ColumnFiltersState;
    expect(applyUpdater([])).toEqual([{ id: "max_budget", value: { min: "10", max: "500" } }]);
    unmount();

    renderWithProviders(
      <BudgetTable
        {...defaultProps}
        list={makeList({
          columnFilters: [
            { id: "max_budget", value: { min: "10", max: "500" } },
            { id: "created_at", value: { from: "2026-01-05" } },
          ],
        })}
      />,
    );

    expect(screen.getByTestId("filter-chip-max_budget")).toHaveTextContent("最大预算:$10 至 $500");
    expect(screen.getByTestId("filter-chip-created_at")).toHaveTextContent("创建时间:2026-01-05 至 任意");
  });
});
