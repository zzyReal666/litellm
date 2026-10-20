import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/lib/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MCPConnect from "./mcp_connect";

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
}));

const activePanel = () => screen.getByRole("tabpanel");

describe("MCP 连接页的中文界面", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("把页面标题与说明渲染成中文", () => {
    render(<MCPConnect />);

    expect(screen.getByText("连接到您的 MCP 客户端")).toBeInTheDocument();
    expect(screen.getByText(/直接在任意 MCP 客户端中使用工具/)).toBeInTheDocument();
  });

  it("把四个标签页与 LiteLLM Proxy 面板渲染成中文，并保留服务器 URL", async () => {
    render(<MCPConnect />);

    expect(screen.getByRole("tab", { name: "OpenAI API" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "LiteLLM Proxy" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "LiteLLM Proxy" }));

    const panel = within(activePanel());
    expect(panel.getByText("虚拟密钥配置")).toBeInTheDocument();
    expect(panel.getByText("MCP 服务器信息")).toBeInTheDocument();
    expect(panel.getAllByText("服务器 URL").length).toBeGreaterThan(0);
    expect(panel.getByText("环境变量")).toBeInTheDocument();
    expect(panel.getByText("http://localhost:4000/mcp")).toBeInTheDocument();
  });

  it("把 Cursor 面板的步骤与快捷键渲染成中文，并保留按键组合原文", async () => {
    render(<MCPConnect />);

    await userEvent.click(screen.getByRole("tab", { name: "Cursor" }));

    const panel = within(activePanel());
    expect(panel.getByText("Cursor IDE 集成")).toBeInTheDocument();
    expect(panel.getByText("配置说明")).toBeInTheDocument();
    expect(panel.getByText("打开 Cursor 设置")).toBeInTheDocument();
    expect(panel.getByText("导航至 MCP 工具")).toBeInTheDocument();
    expect(panel.getByText("添加配置")).toBeInTheDocument();
    expect(panel.getByText(/使用键盘快捷键/)).toBeInTheDocument();
    expect(panel.getByText("Ctrl+Shift+J")).toBeInTheDocument();
    expect(panel.getByText("⇧+⌘+J")).toBeInTheDocument();
    expect(panel.getByText("Cmd+S")).toBeInTheDocument();
    expect(panel.getByText("Ctrl+S")).toBeInTheDocument();
    expect(panel.getByText(/复制下方 JSON 配置并粘贴到 Cursor，然后按/)).toBeInTheDocument();
  });

  it("把 Streamable HTTP 面板渲染成中文", async () => {
    render(<MCPConnect />);

    await userEvent.click(screen.getByRole("tab", { name: "Streamable HTTP" }));

    const panel = within(activePanel());
    expect(panel.getByText("Streamable HTTP 传输")).toBeInTheDocument();
    expect(panel.getByText("通用 MCP 连接")).toBeInTheDocument();
    expect(panel.getByText("请求头配置")).toBeInTheDocument();
    expect(panel.getByRole("button", { name: "了解更多关于 MCP 传输的信息" })).toBeInTheDocument();
  });

  it("把 x-mcp-servers 请求头开关与两种用法说明渲染成中文", async () => {
    render(<MCPConnect />);

    await userEvent.click(screen.getByRole("tab", { name: "LiteLLM Proxy" }));
    await userEvent.click(screen.getByRole("switch"));

    const panel = within(activePanel());
    expect(panel.getByText(/通过传递/)).toBeInTheDocument();
    expect(panel.getByText(/将工具限定到特定 MCP 服务器或 MCP 组/)).toBeInTheDocument();
    expect(panel.getByText("两种方式")).toBeInTheDocument();
    expect(panel.getByText("方式一：")).toBeInTheDocument();
    expect(panel.getByText("指定单个服务器：")).toBeInTheDocument();
    expect(panel.getByText("方式二：")).toBeInTheDocument();
    expect(panel.getByText("指定一组 MCP：")).toBeInTheDocument();
    expect(panel.getByText("也可以混合使用：")).toBeInTheDocument();
  });
});
