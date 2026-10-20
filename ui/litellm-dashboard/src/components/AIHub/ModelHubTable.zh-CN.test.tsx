import * as networking from "@/components/networking";
import userEvent from "@testing-library/user-event";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/lib/i18n";
import ModelHubTable from "./ModelHubTable";

const mockUseUISettings = vi.hoisted(() => vi.fn());

vi.mock("@/components/networking", () => ({
  getUiConfig: vi.fn(),
  modelHubPublicModelsCall: vi.fn(),
  modelHubCall: vi.fn(),
  getConfigFieldSetting: vi.fn(),
  getProxyBaseUrl: vi.fn(() => "http://localhost:4000"),
  getAgentsList: vi.fn(),
  fetchMCPServers: vi.fn(),
  getUiSettings: vi.fn(),
  getClaudeCodeMarketplace: vi.fn(),
  getClaudeCodePluginsList: vi.fn(() => Promise.resolve({ plugins: [] })),
  getPublicModelHubInfo: vi.fn(() => Promise.resolve({})),
  updateUsefulLinksCall: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/public_model_hub", () => ({
  default: () => <div>Public Model Hub</div>,
}));

vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: mockUseUISettings,
}));

const renderHub = async (models: object[] = [], agents: object[] = []) => {
  vi.mocked(networking.modelHubCall).mockResolvedValue({ data: models });
  vi.mocked(networking.getConfigFieldSetting).mockResolvedValue({ field_value: false });
  vi.mocked(networking.getAgentsList).mockResolvedValue({ agents });
  vi.mocked(networking.fetchMCPServers).mockResolvedValue([]);
  vi.mocked(networking.getUiSettings).mockResolvedValue({ values: {} });
  mockUseUISettings.mockReturnValue({ data: { values: {} }, isLoading: false });

  renderWithProviders(
    <ModelHubTable accessToken="test-token" publicPage={false} premiumUser={false} userRole="Admin" />,
  );
  return userEvent.setup();
};

const oneModel = [{ model_group: "claude-opus-4-8", providers: ["anthropic"], mode: "chat" }];
const oneAgent = [
  {
    agent_id: "a1",
    agent_card_params: { name: "Billing Router", description: "routes billing questions" },
    litellm_params: { is_public: false },
  },
];

describe("ModelHubTable in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the hub header, tabs and make-public actions in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = await renderHub(oneModel);

    expect(await screen.findByText("模型 Hub URL：")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "模型 Hub" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Agent Hub" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "MCP Hub" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "技能 Hub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "选择要公开的模型" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Agent Hub" }));
    expect(screen.getByRole("button", { name: "选择要公开的 Agent" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "MCP Hub" }));
    expect(screen.getByRole("button", { name: "选择要公开的 MCP 服务器" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "技能 Hub" }));
    expect(screen.getByRole("button", { name: "选择要公开的技能" })).toBeInTheDocument();
  });

  it("renders the per-tab model, agent, skill and link labels in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    await renderHub(oneModel, oneAgent);

    expect(await screen.findByText("显示 1 / 1 个模型")).toBeInTheDocument();
    expect(screen.getByText("显示 1 / 1 个 Agent")).toBeInTheDocument();
    expect(screen.getByText("技能总数")).toBeInTheDocument();
    expect(screen.getByText("命名空间")).toBeInTheDocument();
    expect(screen.getByText("全部技能")).toBeInTheDocument();
    expect(screen.getByText("显示 0 / 0 个技能")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("按名称、命名空间或标签搜索…")).toBeInTheDocument();
    expect(await screen.findByText("链接管理")).toBeInTheDocument();
    expect(screen.getByText("暂无链接，请在上方添加新链接。")).toBeInTheDocument();
  });

  it("renders the tab empty states and the clear-search control in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = await renderHub([], []);

    expect(await screen.findByText("暂无模型")).toBeInTheDocument();
    expect(screen.getByText("添加到该代理的模型将显示在这里。")).toBeInTheDocument();
    expect(await screen.findByText("暂无 Agent")).toBeInTheDocument();
    expect(screen.getByText("暂无 MCP 服务器")).toBeInTheDocument();
    expect(screen.getByText("暂无技能")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Agent Hub" }));
    await user.type(screen.getByPlaceholderText("搜索 Agent 名称或描述..."), "billing");
    expect(await screen.findByRole("button", { name: "清除搜索" })).toBeInTheDocument();
  });

  it("filters the agent hub by the Chinese search box and reports the count in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = await renderHub(oneModel, oneAgent);

    await user.click(screen.getByRole("tab", { name: "Agent Hub" }));

    expect(await screen.findByText("搜索 Agent：")).toBeInTheDocument();
    const search = screen.getByPlaceholderText("搜索 Agent 名称或描述...");
    await user.type(search, "billing");
    expect(await screen.findByText("显示 1 / 1 个 Agent")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzzz");
    expect(await screen.findByText("显示 0 / 1 个 Agent")).toBeInTheDocument();
  });
});
