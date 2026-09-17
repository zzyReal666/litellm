import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import { AccessGroupsTable } from "./AccessGroupsTable";
import type { AccessGroup } from "./types";

const group: AccessGroup = {
  id: "ag-1",
  name: "Admin Group",
  description: "Administrators with full access",
  modelIds: ["m1", "m2"],
  mcpServerIds: ["s1"],
  agentIds: ["a1", "a2", "a3"],
  keyIds: [],
  teamIds: [],
  createdAt: "2024-01-15T10:00:00Z",
  createdBy: "user-1",
  updatedAt: "2024-01-20T12:00:00Z",
  updatedBy: "user-1",
};

const defaultProps = {
  groups: [group],
  isLoading: false,
  isFiltered: false,
  canModify: true,
  onGroupClick: vi.fn(),
  onDeleteClick: vi.fn(),
};

describe("AccessGroupsTable in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the columns and the resource counts in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<AccessGroupsTable {...defaultProps} />);

    expect(screen.getByRole("columnheader", { name: "名称" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "资源" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "创建时间" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "更新时间" })).toBeInTheDocument();
    expect(screen.getByTitle("2 个模型")).toBeInTheDocument();
    expect(screen.getByTitle("1 个 MCP 服务器")).toBeInTheDocument();
    expect(screen.getByTitle("3 个 Agent")).toBeInTheDocument();
  });

  it("offers the row actions in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderWithProviders(<AccessGroupsTable {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "打开访问组操作" }));

    expect(await screen.findByText("删除访问组")).toBeInTheDocument();
  });

  it("explains an empty filtered table in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<AccessGroupsTable {...defaultProps} groups={[]} isFiltered />);

    expect(screen.getByText("没有匹配的访问组")).toBeInTheDocument();
    expect(screen.getByText("请尝试其他搜索词。")).toBeInTheDocument();
  });

  it("invites the admin to create a group in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<AccessGroupsTable {...defaultProps} groups={[]} />);

    expect(screen.getByText("还没有访问组")).toBeInTheDocument();
    expect(screen.getByText("创建访问组以管理组织的资源访问权限。")).toBeInTheDocument();
  });
});
