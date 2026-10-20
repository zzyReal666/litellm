import { cleanup, fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import AddAutoRouterTab from "./add_auto_router_tab";
import { getMissingTiersError } from "./build_complexity_router_config";

const mockFetchAvailableModels = vi.hoisted(() => vi.fn());
const mockFetchAllModelDeployments = vi.hoisted(() => vi.fn());

vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../../tests/mocks/complexityScorerDefaults"),
);
vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useAutoRouterPresets",
  async () => await import("../../../tests/mocks/autoRouterPresets"),
);
vi.mock("../networking", () => ({
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
  testAutoRouterRouting: vi.fn(),
  validateAutoRouterConfig: vi.fn().mockResolvedValue({ valid: true }),
}));
vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: mockFetchAvailableModels,
}));
vi.mock("@/app/(dashboard)/hooks/models/useModels", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/(dashboard)/hooks/models/useModels")>();
  return { ...actual, fetchAllModelDeployments: mockFetchAllModelDeployments };
});
vi.mock("./handle_add_auto_router_submit", () => ({ handleAddAutoRouterSubmit: vi.fn() }));
// Real by default, so the tier gate still answers; one case clears it to reach the name field.
vi.mock("./build_complexity_router_config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./build_complexity_router_config")>();
  return { ...actual, getMissingTiersError: vi.fn(actual.getMissingTiersError) };
});

const renderTab = (createScope?: "team-required") =>
  renderWithProviders(
    <AddAutoRouterTab handleOk={vi.fn()} accessToken="token" userRole="Admin" createScope={createScope} />,
  );

describe("AddAutoRouterTab zh-CN", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetchAvailableModels.mockResolvedValue([]);
    mockFetchAllModelDeployments.mockResolvedValue([]);
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the router name field and its actions in Chinese", () => {
    renderTab();

    expect(screen.getByText("自动路由器名称")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如：smart_router、auto_router_1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试连接" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加自动路由器" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "需要帮助？" })).toBeInTheDocument();
    expect(screen.queryByText("Auto Router Name")).not.toBeInTheDocument();
  });

  it("renders the access group field and the team selector in Chinese", () => {
    renderTab("team-required");

    expect(screen.getByText("模型访问组")).toBeInTheDocument();
    expect(screen.getByText("选择团队")).toBeInTheDocument();
  });

  it("names the missing router name in Chinese once the tiers stop blocking the submit", async () => {
    vi.mocked(getMissingTiersError).mockReturnValue(null);
    renderTab();

    fireEvent.click(screen.getByRole("button", { name: "添加自动路由器" }));

    expect(await screen.findByText("自动路由器名称为必填项")).toBeInTheDocument();
  });

  it("renders the tier editor it opens in Chinese", () => {
    renderTab();

    fireEvent.click(screen.getByTestId("detailed-configuration-toggle"));

    expect(screen.getByText("复杂度层级配置")).toBeInTheDocument();
    expect(screen.getByText("简单层级")).toBeInTheDocument();
    expect(screen.getAllByText(/示例：/).length).toBeGreaterThan(0);
  });
});
