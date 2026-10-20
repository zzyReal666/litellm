import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import UISettings from "./UISettings";
import { toast } from "@/lib/toast";
import { act, cleanup, fireEvent, renderWithProviders, screen } from "@/../tests/test-utils";

const mockUseAuthorized = vi.hoisted(() => vi.fn());
const mockUseUISettings = vi.hoisted(() => vi.fn());
const mockUseUpdateUISettings = vi.hoisted(() => vi.fn());

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  __esModule: true,
  default: mockUseAuthorized,
}));

vi.mock("@/app/(dashboard)/hooks/uiSettings/useUISettings", () => ({
  useUISettings: mockUseUISettings,
}));

vi.mock("@/app/(dashboard)/hooks/uiSettings/useUpdateUISettings", () => ({
  useUpdateUISettings: mockUseUpdateUISettings,
}));

const buildSettingsResponse = (overrides?: Record<string, unknown>) => ({
  data: {
    field_schema: {
      properties: {
        enable_projects_ui: {},
        enable_chat_ui: {},
      },
    },
    values: {
      disable_model_add_for_internal_users: false,
      disable_team_admin_delete_team_user: false,
      require_auth_for_public_ai_hub: false,
      forward_client_headers_to_llm_api: false,
      forward_llm_provider_auth_headers: false,
      enable_projects_ui: false,
      enable_chat_ui: false,
      disable_agents_for_internal_users: false,
      allow_agents_for_team_admins: false,
      disable_vector_stores_for_internal_users: false,
      allow_vector_stores_for_team_admins: false,
      scope_user_search_to_org: false,
      disable_custom_api_keys: false,
    },
  },
  isLoading: false,
  isError: false,
  error: null,
  ...overrides,
});

describe("UISettings zh-CN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthorized.mockReturnValue({ accessToken: "test-token" });
    mockUseUISettings.mockReturnValue(buildSettingsResponse());
    mockUseUpdateUISettings.mockReturnValue({ mutate: vi.fn(), isPending: false, error: null });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every settings row and the page visibility section in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<UISettings />);

    expect(screen.getByText("界面设置")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "禁止内部用户添加模型" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "禁止团队管理员删除团队用户" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "公共 AI Hub 需要认证" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "将客户端请求头转发到 LLM API" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "转发 LLM 提供商认证请求头" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "禁止内部用户使用 Agent" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "允许团队管理员使用 Agent" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "禁止内部用户使用向量存储" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "允许团队管理员使用向量存储" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "将用户搜索范围限定到组织" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "禁用自定义虚拟密钥值" })).toBeInTheDocument();

    expect(screen.getByText("[BETA] 启用项目功能（页面将刷新）")).toBeInTheDocument();
    expect(screen.getByText("启用后，将在界面侧边栏显示项目功能，并在密钥管理中显示项目字段。")).toBeInTheDocument();
    expect(screen.getByText("[BETA] 启用 Chat 页面（页面将刷新）")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "启用 Chat 页面" })).toBeInTheDocument();
    expect(screen.getByText("内部用户页面可见性")).toBeInTheDocument();
    expect(screen.getByText("未设置（所有页面可见）")).toBeInTheDocument();

    fireEvent.click(screen.getByText("配置页面可见性"));

    expect(screen.getByRole("button", { name: "保存页面可见性设置" })).toBeInTheDocument();
    expect(screen.getByText("默认情况下，所有页面对内部用户可见。选择特定页面可限制可见性。")).toBeInTheDocument();

    expect(screen.queryByText("UI Settings")).not.toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Disable model add for internal users" })).not.toBeInTheDocument();
  });

  it("reports the toggle success toast in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const mutateMock = vi.fn((_settings, options) => {
      options?.onSuccess?.();
    });
    mockUseUpdateUISettings.mockReturnValue({ mutate: mutateMock, isPending: false, error: null });

    renderWithProviders(<UISettings />);

    act(() => {
      fireEvent.click(screen.getByRole("switch", { name: "禁止内部用户添加模型" }));
    });

    expect(mutateMock).toHaveBeenCalledWith(
      { disable_model_add_for_internal_users: true },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(toast.success).toHaveBeenCalledWith("界面设置更新成功");
  });

  it("localizes the load failure alert", async () => {
    await i18n.changeLanguage("zh-CN");
    mockUseUISettings.mockReturnValue(
      buildSettingsResponse({ data: undefined, isError: true, error: new Error("boom") }),
    );

    renderWithProviders(<UISettings />);

    expect(screen.getByText("无法加载界面设置")).toBeInTheDocument();
    expect(screen.queryByText("Could not load UI settings")).not.toBeInTheDocument();
  });
});
