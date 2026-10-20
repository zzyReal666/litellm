import { PaginationState } from "@tanstack/react-table";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { MemoryRow } from "@/components/networking";

import { MemoryTable } from "./MemoryTable";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const makeMemory = (overrides: Partial<MemoryRow> = {}): MemoryRow => ({
  memory_id: "mem-1",
  key: "user:profile",
  value: "The user prefers concise answers.",
  metadata: null,
  user_id: "user-42",
  team_id: "team-7",
  updated_at: "2024-05-01T12:00:00Z",
  ...overrides,
});

const baseProps = {
  data: [makeMemory()],
  isLoading: false,
  rowCount: 1,
  pagination: { pageIndex: 0, pageSize: 50 } as PaginationState,
  onPaginationChange: vi.fn(),
  searchValue: "",
  onSearchChange: vi.fn(),
  isRefreshing: false,
  onRefresh: vi.fn(),
  hasActiveSearch: false,
  onViewClick: vi.fn(),
  onEditClick: vi.fn(),
  onDeleteClick: vi.fn(),
};

describe("MemoryTable in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers and search placeholder in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<MemoryTable {...baseProps} />);

    for (const header of ["ID", "名称", "预览", "用户 ID", "团队 ID", "更新时间"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
    expect(screen.getByPlaceholderText("按键前缀或记忆 ID 搜索…")).toBeInTheDocument();
  });

  it("renders both empty states in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<MemoryTable {...baseProps} data={[]} rowCount={0} hasActiveSearch={false} />);
    expect(screen.getByText("暂无存储的记忆")).toBeInTheDocument();
    expect(screen.getByText("Agent 存储在 /v1/memory 下的记忆将显示在此处。")).toBeInTheDocument();

    cleanup();
    render(<MemoryTable {...baseProps} data={[]} rowCount={0} hasActiveSearch={true} />);
    expect(screen.getByText("没有匹配的记忆")).toBeInTheDocument();
    expect(screen.getByText("没有记忆与您的搜索匹配。")).toBeInTheDocument();
  });
});
