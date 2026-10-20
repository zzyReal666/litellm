import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import SSOSettings from "./SSOSettings";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

const mockUseSSOSettings = vi.hoisted(() => vi.fn());

vi.mock("@/app/(dashboard)/hooks/sso/useSSOSettings", () => ({
  useSSOSettings: mockUseSSOSettings,
}));

const samlConfiguredValues = {
  google_client_id: null,
  google_client_secret: null,
  microsoft_client_id: null,
  microsoft_client_secret: null,
  microsoft_tenant: null,
  generic_client_id: null,
  generic_client_secret: null,
  generic_authorization_endpoint: null,
  generic_token_endpoint: null,
  generic_userinfo_endpoint: null,
  proxy_base_url: "https://proxy.example.com",
  user_email: null,
  ui_access_mode: null,
  role_mappings: null,
  team_mappings: null,
  saml_idp_metadata_url: null,
  saml_idp_metadata_xml: "<EntityDescriptor/>",
  saml_sp_entity_id: "https://proxy.example.com/sso/saml/metadata",
  saml_allow_unsolicited: "true",
};

describe("SSOSettings zh-CN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSSOSettings.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the SSO card and the empty state in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<SSOSettings />);

    expect(screen.getByText("SSO 配置")).toBeInTheDocument();
    expect(screen.getByText("管理单点登录认证设置")).toBeInTheDocument();
    expect(screen.getByText("未找到 SSO 配置")).toBeInTheDocument();
    expect(screen.getByText("配置单点登录（SSO）可让团队成员通过您的身份提供商进行无缝认证。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "配置 SSO" })).toBeInTheDocument();

    expect(screen.queryByText("SSO Configuration")).not.toBeInTheDocument();
    expect(screen.queryByText("No SSO Configuration Found")).not.toBeInTheDocument();
    expect(screen.queryByText("Configure SSO")).not.toBeInTheDocument();
  });

  it("localizes the configured SAML detail rows and card actions", async () => {
    await i18n.changeLanguage("zh-CN");
    mockUseSSOSettings.mockReturnValue({
      data: { values: samlConfiguredValues },
      isLoading: false,
      refetch: vi.fn(),
    });
    renderWithProviders(<SSOSettings />);

    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.getByText("SAML SSO")).toBeInTheDocument();
    expect(screen.getByText("代理基础 URL")).toBeInTheDocument();
    expect(screen.getByText("已启用")).toBeInTheDocument();
    expect(screen.getByText("IdP 元数据 XML")).toBeInTheDocument();
    expect(screen.getByText("SP 实体 ID")).toBeInTheDocument();
    expect(screen.getByText("已提供")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "复制值" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "编辑 SSO 设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除 SSO 设置" })).toBeInTheDocument();

    expect(screen.queryByText("Provider")).not.toBeInTheDocument();
    expect(screen.queryByText("Enabled")).not.toBeInTheDocument();
    expect(screen.queryByText("Edit SSO Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete SSO Settings")).not.toBeInTheDocument();
  });
});
