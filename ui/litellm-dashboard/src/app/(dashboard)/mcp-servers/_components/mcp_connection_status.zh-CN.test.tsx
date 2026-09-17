import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import i18n from "@/lib/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MCPConnectionStatus from "./mcp_connection_status";
import MCPServerCostDisplay from "./mcp_server_cost_display";

const defaultProps = {
  formValues: { url: "https://example.com/mcp" },
  tools: [] as unknown[],
  isLoadingTools: false,
  toolsError: null,
  toolsErrorStackTrace: null,
  canFetchTools: false,
  fetchTools: vi.fn(),
};

describe("MCP 连接状态与费用展示的中文界面", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("把连接状态卡片渲染成中文，并保留服务器 URL", () => {
    render(<MCPConnectionStatus {...defaultProps} />);

    expect(screen.getByText("连接状态")).toBeInTheDocument();
    expect(screen.getByText("请填写必填字段以测试连接")).toBeInTheDocument();
    expect(screen.getByText("请填写 URL、传输方式和认证信息以测试 MCP 服务器连接")).toBeInTheDocument();
  });

  it("把已连接状态与服务器地址渲染成中文", () => {
    render(<MCPConnectionStatus {...defaultProps} canFetchTools={true} tools={[{ name: "tool1" }]} />);

    expect(screen.getByText("连接成功")).toBeInTheDocument();
    expect(screen.getByText("已连接")).toBeInTheDocument();
    expect(screen.getByText("服务器：https://example.com/mcp")).toBeInTheDocument();
  });

  it("把加载中状态渲染成中文", () => {
    render(<MCPConnectionStatus {...defaultProps} canFetchTools={true} isLoadingTools={true} />);

    expect(screen.getByText("正在测试与 MCP 服务器的连接...")).toBeInTheDocument();
    expect(screen.getByText("连接中...")).toBeInTheDocument();
    expect(screen.getByText("正在测试连接并加载工具...")).toBeInTheDocument();
  });

  it("把连接失败的告警、堆栈跟踪按钮和重试按钮渲染成中文", () => {
    render(
      <MCPConnectionStatus {...defaultProps} canFetchTools={true} toolsError="boom" toolsErrorStackTrace="stack" />,
    );

    expect(screen.getAllByText("连接失败")).toHaveLength(2);
    expect(screen.getByText("失败")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "堆栈跟踪" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument();
  });

  it("把没有工具时的成功提示渲染成中文", () => {
    render(<MCPConnectionStatus {...defaultProps} canFetchTools={true} />);

    expect(screen.getByText("连接成功！")).toBeInTheDocument();
    expect(screen.getByText("此 MCP 服务器未发现任何工具")).toBeInTheDocument();
  });

  it("把费用展示渲染成中文，并插值工具数量与金额", () => {
    render(
      <MCPServerCostDisplay
        costConfig={{ default_cost_per_query: 0.0125, tool_name_to_cost_per_query: { search: 0.5, fetch: 0.25 } }}
      />,
    );

    expect(screen.getByText("每次查询默认费用")).toBeInTheDocument();
    expect(screen.getByText("费用汇总：")).toBeInTheDocument();
    expect(screen.getByText("• 默认费用：$0.0125 / 次查询")).toBeInTheDocument();
    expect(screen.getByText("• 2 个工具使用自定义定价")).toBeInTheDocument();
  });

  it("把未配置费用的说明渲染成中文", () => {
    render(<MCPServerCostDisplay costConfig={null} />);

    expect(screen.getByText("此服务器未配置费用。工具调用将按每次 $0.00 收费。")).toBeInTheDocument();
  });
});
