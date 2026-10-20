/* @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import UserInfoView from "./user_info_view";

const mockUserGetInfoV2 = vi.fn();
const mockTeamInfoCall = vi.fn();

const MOCK_USER_DATA = {
  user_id: "user-123",
  user_email: "test@example.com",
  user_alias: "Test Alias",
  user_role: "admin",
  spend: 98.854,
  max_budget: 3_000_000,
  models: [],
  budget_duration: "30d",
  budget_reset_at: null,
  metadata: {},
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-02T00:00:00.000Z",
  sso_user_id: null,
  teams: ["team-1"],
  object_permission: {
    mcp_servers: [],
    mcp_access_groups: [],
    mcp_tool_permissions: {},
    mcp_toolsets: [],
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/users",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("@/components/networking", () => ({
  serverRootPath: "/",
  userGetInfoV2: (...args: unknown[]) => mockUserGetInfoV2(...args),
  userDeleteCall: vi.fn(),
  userUpdateUserCall: vi.fn(),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
  invitationCreateCall: vi.fn(),
  teamInfoCall: (...args: unknown[]) => mockTeamInfoCall(...args),
  teamListCall: vi.fn().mockResolvedValue([]),
  teamMemberAddCall: vi.fn(),
  teamMemberDeleteCall: vi.fn(),
  getProxyBaseUrl: () => "https://litellm.test",
  fetchMCPServers: vi.fn().mockResolvedValue([]),
  fetchMCPToolsets: vi.fn().mockResolvedValue([]),
  listMCPTools: vi.fn().mockResolvedValue({ tools: [] }),
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPAccessGroups", () => ({
  useMCPAccessGroups: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPToolsets", () => ({
  useMCPToolsets: () => ({ data: [], isLoading: false }),
}));

const defaultProps = {
  userId: "user-123",
  onClose: vi.fn(),
  accessToken: "test-token",
  userRole: "proxy_admin",
  possibleUIRoles: null,
};

describe("UserInfoView 中文界面", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUserGetInfoV2.mockResolvedValue(MOCK_USER_DATA);
    mockTeamInfoCall.mockResolvedValue({ team_id: "team-1", team_info: { team_alias: "Alpha Team" } });
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("把加载状态渲染成中文", () => {
    mockUserGetInfoV2.mockReturnValue(new Promise(() => undefined));

    render(<UserInfoView {...defaultProps} />);

    expect(screen.getByText("加载用户数据中...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /返回用户列表/ })).toBeInTheDocument();
  });

  it("把概览页的卡片与页签渲染成中文", async () => {
    render(<UserInfoView {...defaultProps} />);

    expect(await screen.findByText("$98.85")).toBeInTheDocument();
    expect(screen.getByText("花费")).toBeInTheDocument();
    expect(screen.getByText(/共 \$3,000,000\.00/)).toBeInTheDocument();
    expect(screen.getByText("团队")).toBeInTheDocument();
    expect(screen.getAllByText("个人模型").length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "详情" })).toBeInTheDocument();
  });

  it("把详情页的字段标签渲染成中文", async () => {
    render(<UserInfoView {...defaultProps} />);

    await screen.findByText("$98.85");

    expect(screen.getByText("用户设置")).toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.getByText("邮箱")).toBeInTheDocument();
    expect(screen.getByText("用户别名")).toBeInTheDocument();
    expect(screen.getByText("全局代理角色")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.getByText("最后更新")).toBeInTheDocument();
    expect(screen.getByText("最大预算")).toBeInTheDocument();
    expect(screen.getByText("预算重置")).toBeInTheDocument();
    expect(screen.getByText("元数据")).toBeInTheDocument();
    expect(screen.getByText("MCP 权限")).toBeInTheDocument();
  });

  it("把页头操作渲染成中文", async () => {
    render(<UserInfoView {...defaultProps} />);

    await screen.findByText("$98.85");

    expect(screen.getByRole("button", { name: /重置密码/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /删除用户/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /添加团队/ })).toBeInTheDocument();
  });
});
