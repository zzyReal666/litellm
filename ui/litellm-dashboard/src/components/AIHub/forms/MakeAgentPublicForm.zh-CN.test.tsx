import { render, screen, fireEvent, act, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import i18n from "@/lib/i18n";
import MakeAgentPublicForm from "./MakeAgentPublicForm";
import { AgentHubData } from "@/components/AIHub/AgentHubTableColumns";

vi.mock("../../networking", () => ({
  makeAgentsPublicCall: vi.fn(),
}));

const mockProps = {
  visible: true,
  onClose: vi.fn(),
  accessToken: "test-token",
  agentHubData: [
    {
      agent_id: "agent-1",
      name: "Test Agent 1",
      description: "Description 1",
      version: "1.0",
      is_public: false,
      skills: [],
      protocolVersion: "1.0",
    },
    {
      agent_id: "agent-2",
      name: "Test Agent 2",
      description: "Description 2",
      version: "2.0",
      is_public: false,
      skills: [],
      protocolVersion: "1.0",
    },
  ] as AgentHubData[],
  onSuccess: vi.fn(),
};

describe("MakeAgentPublicForm in Chinese", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the selection step in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<MakeAgentPublicForm {...mockProps} />);

    expect(screen.getByText("将 Agent 设为公开")).toBeInTheDocument();
    expect(screen.getByText("选择要公开的 Agent")).toBeInTheDocument();
    expect(screen.getByText("确认")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "全选 (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("renders the confirmation step with Chinese counts and warning", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<MakeAgentPublicForm {...mockProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: "全选 (2)" }));
    });

    expect(screen.getByText("已选择 2 个 Agent")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    });

    await waitFor(() => {
      expect(screen.getByText("确认将 Agent 设为公开")).toBeInTheDocument();
    });
    expect(screen.getByText("即将设为公开的 Agent：")).toBeInTheDocument();
    expect(screen.getByText("共 2 个 Agent 将被设为公开")).toBeInTheDocument();
    expect(screen.getByText("警告:")).toBeInTheDocument();
    expect(screen.getByText("/ui/model_hub_table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一步" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设为公开" })).toBeInTheDocument();
  });

  it("renders the empty agent list in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<MakeAgentPublicForm {...mockProps} agentHubData={[]} />);

    expect(screen.getByText("暂无可用 Agent。")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "全选" })).toBeInTheDocument();
  });
});
