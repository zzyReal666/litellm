import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/../tests/test-utils";

import { useRoutingGroups, useSaveRoutingGroups } from "@/app/(dashboard)/hooks/routingGroups/useRoutingGroups";
import i18n from "@/lib/i18n";
import { toast } from "@/lib/toast";

import RoutingGroups from "./index";
import RoutingGroupModal from "./RoutingGroupModal";
import RoutingGroupsTable from "./RoutingGroupsTable";
import type { RoutingGroup } from "./types";

vi.mock("@/app/(dashboard)/hooks/routingGroups/useRoutingGroups", () => ({
  useRoutingGroups: vi.fn(),
  useSaveRoutingGroups: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/router/useRouterFields", () => ({
  useRouterFields: () => ({ data: undefined }),
}));

vi.mock("@/app/(dashboard)/hooks/models/useModels", () => ({
  useModelHub: () => ({ data: undefined }),
}));

vi.mock("@/app/(dashboard)/hooks/proxySettings/useProxySettings", () => ({
  __esModule: true,
  default: () => ({ PROXY_BASE_URL: "https://proxy.example.com" }),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), fromError: vi.fn() },
}));

const prodGroup: RoutingGroup = {
  group_name: "prod-group",
  models: ["gpt-4o", "claude-sonnet-4-5"],
  routing_strategy: "usage-based-routing",
};

const noop = () => {};

const renderModal = (overrides: Partial<React.ComponentProps<typeof RoutingGroupModal>> = {}) =>
  renderWithProviders(
    <RoutingGroupModal
      open
      mode="create"
      initialValue={null}
      availableStrategies={["simple-shuffle", "usage-based-routing"]}
      strategyDescriptions={{}}
      modelOptions={["gpt-4o"]}
      existingGroupNames={[]}
      onClose={noop}
      onSubmit={noop}
      {...overrides}
    />,
  );

const setupGroupsPage = () => {
  vi.mocked(useRoutingGroups).mockReturnValue({
    data: { routingGroups: [prodGroup], availableStrategies: [] },
    isLoading: false,
    refetch: vi.fn(),
    isFetching: false,
  } as unknown as ReturnType<typeof useRoutingGroups>);
  vi.mocked(useSaveRoutingGroups).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useSaveRoutingGroups>);
};

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
});

describe("routing groups in Chinese", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh-CN");
  });

  it("should render the table headers, the group row, and the strategy label in Chinese", () => {
    render(<RoutingGroupsTable groups={[prodGroup]} onEdit={noop} onDelete={noop} />);

    expect(screen.getByText("组名")).toBeInTheDocument();
    expect(screen.getByText("模型")).toBeInTheDocument();
    expect(screen.getByText("策略")).toBeInTheDocument();
    expect(screen.getByText("基于用量")).toBeInTheDocument();
  });

  it("should render the empty state in Chinese", () => {
    render(<RoutingGroupsTable groups={[]} onEdit={noop} onDelete={noop} />);

    expect(screen.getByText("暂无路由组")).toBeInTheDocument();
    expect(screen.getByText("创建一个组，将一组模型负载均衡到同一个名称下。")).toBeInTheDocument();
  });

  it("should render the usage panel in Chinese, with the translated strategy inside the sentence", async () => {
    const user = userEvent.setup();
    render(<RoutingGroupsTable groups={[prodGroup]} onEdit={noop} onDelete={noop} />);

    await user.click(screen.getByRole("button", { name: "prod-group" }));

    expect(await screen.findByText("此组的路由方式")).toBeInTheDocument();
    expect(screen.getByText(/LiteLLM 在后台使用/)).toBeInTheDocument();
    expect(screen.getByText(/策略选取部署/)).toBeInTheDocument();
    expect(screen.getByText("Python（OpenAI SDK）")).toBeInTheDocument();
    expect(screen.getByText("JavaScript（OpenAI SDK）")).toBeInTheDocument();
  });

  it("should render the modal labels and buttons in Chinese", () => {
    renderModal();

    expect(screen.getByText("创建路由组")).toBeInTheDocument();
    expect(screen.getByLabelText("组名")).toBeInTheDocument();
    expect(screen.getByLabelText("模型")).toBeInTheDocument();
    expect(screen.getByLabelText("路由策略")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建组" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByText("未被明确指定到组的模型将回退到代理的顶级路由策略。")).toBeInTheDocument();
  });

  it("should render the modal validation message in Chinese", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "创建组" }));

    expect(await screen.findByText("组名不能为空")).toBeInTheDocument();
  });

  it("should render the strategy arguments label and example in Chinese", () => {
    renderModal({ mode: "edit", initialValue: { ...prodGroup, routing_strategy: "latency-based-routing" } });

    expect(screen.getByText("编辑 prod-group")).toBeInTheDocument();
    expect(screen.getByLabelText("策略参数（JSON）")).toBeInTheDocument();
    expect(screen.getByText('示例：{ "ttl": 3600, "lowest_latency_buffer": 0 }')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
  });

  it("should translate the invalid JSON message the payload builder raises", async () => {
    const user = userEvent.setup();
    renderModal({ mode: "edit", initialValue: { ...prodGroup, routing_strategy: "latency-based-routing" } });

    const textarea = screen.getByLabelText("策略参数（JSON）");
    await user.clear(textarea);
    await user.type(textarea, "not json");
    await user.click(screen.getByRole("button", { name: "保存更改" }));

    expect(await screen.findByText("必须是有效的 JSON")).toBeInTheDocument();
  });

  it("should render the page chrome and the delete confirmation in Chinese", async () => {
    const user = userEvent.setup();
    setupGroupsPage();
    render(<RoutingGroups />);

    expect(screen.getByPlaceholderText("搜索组...")).toBeInTheDocument();
    expect(screen.getByText("显示 1 条结果")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "刷新" })).toBeInTheDocument();

    await user.click(screen.getByTestId("routing-group-actions-prod-group"));
    await user.click(await screen.findByTestId("routing-group-action-delete"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("删除路由组？")).toBeInTheDocument();
    expect(within(dialog).getByText(/中的模型将回退到代理的顶级路由策略/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "删除" }));

    expect(toast.success).toHaveBeenCalledWith('已删除路由组"prod-group"');
  });
});
