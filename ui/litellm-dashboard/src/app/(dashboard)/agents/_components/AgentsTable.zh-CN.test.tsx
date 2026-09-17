import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { Agent } from "@/components/agents/types";
import AgentsTable from "./AgentsTable";

const baseProps = {
  isLoading: false,
  isAdmin: true,
  healthCheckEnabled: false,
  isHealthCheckLoading: false,
  onHealthCheckToggle: vi.fn(),
  onAgentClick: vi.fn(),
  onDeleteClick: vi.fn(),
};

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
  agent_id: "agent-1",
  agent_name: "Test Agent",
  litellm_params: { model: "gpt-4" },
  spend: 0,
  keys: [{ token: "hash-1", key_alias: "primary", key_name: "sk-...1" }],
  created_at: "2023-01-01T00:00:00Z",
  ...overrides,
});

describe("AgentsTable in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers and toolbar in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<AgentsTable agents={[]} {...baseProps} />);

    for (const header of ["Agent 名称", "Agent ID", "花费（USD）", "模型", "创建时间", "状态"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
    expect(screen.getByText("健康检查")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "操作" })).toBeInTheDocument();
  });

  it("renders the row status badges in Chinese while keeping the model name untranslated", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <AgentsTable
        agents={[
          makeAgent({ agent_id: "keyed", agent_name: "Keyed Agent", keys: [{ token: "k" }] }),
          makeAgent({ agent_id: "keyless", agent_name: "Keyless Agent", keys: [] }),
        ]}
        {...baseProps}
      />,
    );

    expect(within(screen.getByText("Keyed Agent").closest("tr")!).getByText("活跃")).toBeInTheDocument();
    expect(within(screen.getByText("Keyless Agent").closest("tr")!).getByText("待配置")).toBeInTheDocument();
    expect(screen.getAllByText("gpt-4")).toHaveLength(2);
  });

  it("translates the row actions menu in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    render(<AgentsTable agents={[makeAgent({ agent_id: "agent-7" })]} {...baseProps} />);

    await user.click(screen.getByTestId("agent-actions-agent-7"));
    expect(await screen.findByTestId("agent-action-delete")).toHaveTextContent("删除");
  });
});
