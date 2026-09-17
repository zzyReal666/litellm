import { cleanup, render, screen } from "@testing-library/react";
import i18n from "@/lib/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateMCPServer from "./CreateMCPServer";
import { selectOption } from "./testUtils";

vi.mock("@/components/networking", () => ({
  createMCPServer: vi.fn(),
  fetchOpenAPIRegistry: vi.fn().mockResolvedValue({ apis: [] }),
  registerMCPServer: vi.fn(),
  storeMCPOAuthUserCredential: vi.fn().mockResolvedValue({}),
  testMCPToolsListRequest: vi.fn().mockResolvedValue({ tools: [], error: null }),
}));

vi.mock("@/utils/mcpTokenStore", () => ({
  setToken: vi.fn(),
}));

vi.mock("./OpenAPIQuickPicker", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useMcpOAuthFlow", () => ({
  useMcpOAuthFlow: () => ({
    startOAuthFlow: vi.fn(),
    status: "idle",
    error: null,
    tokenResponse: null,
    reset: vi.fn(),
  }),
}));

vi.mock("./mcp_server_cost_config", () => ({
  default: () => <div data-testid="mcp-cost-config" />,
}));

vi.mock("./MCPPermissionManagement", () => ({
  default: () => <div data-testid="mcp-permissions" />,
}));

vi.mock("./mcp_tool_configuration", () => ({
  default: () => <div data-testid="mcp-tool-config" />,
}));

vi.mock("./mcp_connection_status", () => ({
  default: () => <div data-testid="mcp-connection-status" />,
}));

vi.mock("./StdioConfiguration", () => ({
  default: () => <div data-testid="stdio-config" />,
}));

const defaultProps = {
  userRole: "Admin",
  accessToken: "test-token",
  onCreateSuccess: vi.fn(),
  isModalVisible: true,
  setModalVisible: vi.fn(),
  availableAccessGroups: ["group-a", "group-b"],
};

describe("CreateMCPServer 新增表单的中文界面", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("把弹窗标题、字段标签与底部按钮渲染成中文", () => {
    render(<CreateMCPServer {...defaultProps} />);

    expect(screen.getByText("添加新 MCP 服务器")).toBeInTheDocument();
    expect(screen.getByLabelText("MCP 服务器名称")).toBeInTheDocument();
    expect(screen.getByLabelText("别名")).toBeInTheDocument();
    expect(screen.getByLabelText("GitHub / 源码 URL")).toBeInTheDocument();
    expect(screen.getByLabelText("传输类型")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加 MCP 服务器" })).toBeInTheDocument();
  });

  it("把非管理员弹窗标题渲染成中文", () => {
    render(<CreateMCPServer {...defaultProps} userRole="Internal User" />);

    expect(screen.getByText("提交 MCP 服务器审核")).toBeInTheDocument();
    expect(screen.queryByText("添加新 MCP 服务器")).not.toBeInTheDocument();
  });

  it("把传输类型下拉的选项渲染成中文", async () => {
    render(<CreateMCPServer {...defaultProps} />);

    await selectOption("传输类型", "Streamable HTTP（推荐）");

    expect(screen.getByLabelText("MCP 服务器 URL")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://your-mcp-server.com")).toBeInTheDocument();
  });

  it("把身份验证区域与认证方式的占位文案渲染成中文", async () => {
    render(<CreateMCPServer {...defaultProps} />);

    await selectOption("传输类型", "Streamable HTTP（推荐）");

    expect(screen.getByLabelText("认证")).toBeInTheDocument();
    expect(screen.getByText("选择认证类型")).toBeInTheDocument();
  });
});
