import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import AgentInfoView from "./agent_info";
import * as networking from "@/components/networking";
import type { Agent } from "@/components/agents/types";

vi.mock("@/components/networking", () => ({
  getAgentInfo: vi.fn(),
  getAgentCreateMetadata: vi.fn(),
  patchAgentCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/keys/useKeys", () => ({
  useKeys: () => ({ data: { keys: [] }, isLoading: false, refetch: vi.fn() }),
}));

vi.mock("./agent_card_discovery", () => ({
  default: () => <div data-testid="agent-card-discovery" />,
}));

vi.mock("./agent_form_fields", () => ({
  default: () => <div data-testid="agent-form-fields" />,
  unmountedA2AFieldNames: () => [],
}));

vi.mock("@/app/(dashboard)/hooks/mcpServers/useMCPServers", () => ({
  useMCPServers: () => ({ data: [{ server_id: "srv-1", server_name: "github" }] }),
}));

vi.mock("@/components/mcp_server_management/MCPServerSelector", () => ({
  default: () => <div data-testid="mcp-server-selector" />,
}));

vi.mock("@/components/mcp_server_management/MCPToolPermissions", () => ({
  default: () => <div data-testid="mcp-tool-permissions" />,
}));

const agent = {
  agent_id: "agent-1",
  agent_name: "support-agent",
  agent_card_params: {
    name: "Support Agent",
    description: "Answers support questions",
    url: "http://localhost:9999/",
    version: "1.0.0",
    protocolVersion: "1.0",
    capabilities: { streaming: false },
    skills: [],
  },
  tpm_limit: 100,
} as unknown as Agent;

describe("AgentInfoView in zh-CN", () => {
  beforeEach(() => {
    vi.mocked(networking.getAgentInfo).mockReset().mockResolvedValue(agent);
    vi.mocked(networking.getAgentCreateMetadata).mockReset().mockResolvedValue([]);
    vi.mocked(networking.patchAgentCall).mockReset().mockResolvedValue({});
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the tabs, the back button and the overview field labels in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<AgentInfoView agentId="agent-1" onClose={vi.fn()} accessToken="sk-test" isAdmin={true} />);

    expect(await screen.findByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /返回 Agent 列表/ })).toBeInTheDocument();

    for (const label of ["Agent ID", "显示名称", "描述", "版本", "协议版本", "流式输出", "TPM 限制"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("虚拟密钥")).toBeInTheDocument();
  });

  it("renders the settings header and the edit affordance in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<AgentInfoView agentId="agent-1" onClose={vi.fn()} accessToken="sk-test" isAdmin={true} />);

    fireEvent.click(await screen.findByRole("tab", { name: "设置" }));

    expect(screen.getByText("Agent 设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.getByText("点击「编辑设置」修改 Agent 配置。")).toBeInTheDocument();
  });
});
