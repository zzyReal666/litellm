import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import i18n from "@/lib/i18n";
import { toast } from "@/lib/toast";
import type { ToolRow } from "@/components/networking";

import { chooseSelectOption, renderWithProviders, testQueryClient } from "../../../tests/test-utils";
import { ToolPoliciesPanel } from "./ToolPoliciesPanel";

const fetchToolsList = vi.fn();
const updateToolPolicy = vi.fn();

vi.mock("@/components/networking", () => ({
  fetchToolsList: (...args: unknown[]) => fetchToolsList(...args),
  updateToolPolicy: (...args: unknown[]) => updateToolPolicy(...args),
}));

const can = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({
  default: (...args: unknown[]) => can(...args),
}));

const fromBackend = vi.mocked(toast.fromError);

const TOOLS: ToolRow[] = [
  {
    tool_id: "tool-1",
    tool_name: "get_weather",
    input_policy: "untrusted",
    output_policy: "untrusted",
    call_count: 12,
    team_id: "team-alpha",
    key_alias: "prod-key",
    key_hash: "hash-aaa",
    user_agent: "curl/8.7.1",
    created_at: new Date().toISOString(),
  },
  {
    tool_id: "tool-2",
    tool_name: "search_web",
    input_policy: "trusted",
    output_policy: "trusted",
    call_count: 5,
    team_id: "team-beta",
    key_alias: "dev-key",
    key_hash: "hash-bbb",
    user_agent: "curl/8.7.1",
    created_at: "2020-01-02T10:00:00Z",
  },
];

const row = (toolId: string): HTMLElement => {
  const element = document.querySelector(`[data-row-id="${toolId}"]`);
  if (element === null) throw new Error(`row ${toolId} is not rendered`);
  return element as HTMLElement;
};

const renderPanel = () => renderWithProviders(<ToolPoliciesPanel accessToken="sk-token" onSelectTool={vi.fn()} />);

const waitForRows = () => waitFor(() => expect(document.querySelector('[data-row-id="tool-1"]')).not.toBeNull());

beforeEach(() => {
  testQueryClient.clear();
  fetchToolsList.mockReset().mockResolvedValue(TOOLS);
  updateToolPolicy.mockReset().mockResolvedValue({});
  fromBackend.mockReset();
  can.mockReset().mockReturnValue(true);
});

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
});

describe("ToolPoliciesPanel Chinese copy", () => {
  it("renders the heading, the metric cards and the column headers in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderPanel();
    await waitForRows();

    expect(screen.getByText("工具策略")).toBeInTheDocument();
    expect(screen.getByText("今日新增")).toBeInTheDocument();
    expect(screen.getByText("已发现工具总数")).toBeInTheDocument();
    expect(screen.getByText("已屏蔽工具")).toBeInTheDocument();
    expect(screen.getByText("活跃团队")).toBeInTheDocument();
    expect(screen.getByText("较昨日 +1")).toBeInTheDocument();

    expect(screen.getByRole("columnheader", { name: /发现时间/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /工具名称/ })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader", { name: /输入策略/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("columnheader", { name: /输出策略/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: /调用次数/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /团队名称/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /密钥哈希/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /密钥名称/ })).toBeInTheDocument();

    expect(screen.getByPlaceholderText("按工具名称搜索")).toBeInTheDocument();
    expect(screen.queryByText("Total Tools Discovered")).not.toBeInTheDocument();
  });

  it("renders the policy values in the cells in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderPanel();
    await waitForRows();

    expect(within(row("tool-1")).getAllByText("不受信任").length).toBeGreaterThan(0);
    expect(within(row("tool-2")).getAllByText("受信任").length).toBeGreaterThan(0);
    expect(screen.queryByText("untrusted")).not.toBeInTheDocument();
  });

  it("lists the tools that need a decision in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderPanel();
    await waitForRows();

    expect(screen.getByText("待审核")).toBeInTheDocument();
    expect(screen.getByText("发现 1 个新工具，需要制定策略。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "审核" })).toBeInTheDocument();
  });

  it("renders the filter drawer in Chinese", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh-CN");
    renderPanel();
    await waitForRows();

    await user.click(screen.getByTestId("datatable-filters-trigger"));

    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).getByText("筛选已发现的工具")).toBeInTheDocument();
    expect(within(drawer).getByText("所有输入策略")).toBeInTheDocument();
    expect(within(drawer).getByText("所有输出策略")).toBeInTheDocument();
    expect(within(drawer).getByText("所有团队")).toBeInTheDocument();
    expect(within(drawer).getByText("所有密钥")).toBeInTheDocument();
  });

  it("renders the empty state in Chinese", async () => {
    fetchToolsList.mockResolvedValue([]);
    await i18n.changeLanguage("zh-CN");
    renderPanel();

    expect(await screen.findByText("未发现工具")).toBeInTheDocument();
    expect(screen.getByText("发起一次返回 tool_calls 的对话补全即可启动自动发现。")).toBeInTheDocument();
  });

  it("reports a load failure in Chinese", async () => {
    fetchToolsList.mockRejectedValue("nope");
    await i18n.changeLanguage("zh-CN");
    renderPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent("加载工具失败");
  });

  it("reports a rejected policy update in Chinese", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh-CN");
    renderPanel();
    await waitForRows();
    updateToolPolicy.mockRejectedValue("nope");

    await chooseSelectOption(user, within(row("tool-1")).getAllByRole("combobox")[0], "受信任");

    await waitFor(() => expect(fromBackend).toHaveBeenCalledWith("更新输入策略失败：未知错误"));
  });
});
