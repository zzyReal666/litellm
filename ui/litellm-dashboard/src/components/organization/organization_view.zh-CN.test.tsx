import React from "react";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../tests/test-utils";
import i18n from "@/lib/i18n";
import { useOrganization } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import OrganizationInfoView from "./organization_view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/organizations",
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("../networking", () => ({
  __esModule: true,
  organizationMemberAddCall: vi.fn(),
  organizationMemberUpdateCall: vi.fn(),
  organizationMemberDeleteCall: vi.fn(),
  organizationUpdateCall: vi.fn(),
  serverRootPath: "",
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganization: vi.fn(),
  organizationKeys: {
    all: ["organizations"],
    list: () => ["organizations", "list", { params: {} }],
    detail: (id: string) => ["organizations", "detail", id],
  },
}));

vi.mock("../object_permissions_view", () => ({
  __esModule: true,
  default: () => <div data-testid="object-permissions-view" />,
}));
vi.mock("../team/edit_membership", () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock("../common_components/user_search_modal", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => ({ data: [] }),
  useTeam: () => ({ data: undefined }),
}));

const mockUseOrganization = vi.mocked(useOrganization);

const mockOrg = {
  organization_alias: "Acme Corp",
  organization_id: "org_123",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: "admin@example.com",
  spend: 0,
  models: ["gpt-4o-mini"],
  litellm_budget_table: {
    tpm_limit: null,
    rpm_limit: null,
    max_budget: 1000,
    budget_duration: "30d",
    max_parallel_requests: null,
  },
  object_permission: {},
  members: [],
  teams: [],
  metadata: null,
};

const renderOrgView = () =>
  renderWithProviders(
    <OrganizationInfoView
      organizationId="org_123"
      onClose={() => {}}
      accessToken="test-token"
      is_org_admin
      is_proxy_admin
      userModels={[]}
      editOrg={false}
    />,
  );

describe("OrganizationInfoView in Chinese", () => {
  beforeEach(() => {
    mockUseOrganization.mockReset();
    mockUseOrganization.mockReturnValue({ data: mockOrg, isLoading: false } as unknown as ReturnType<
      typeof useOrganization
    >);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the tabs and the overview cards in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderOrgView();

    expect(await screen.findByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "成员" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制组织 ID" })).toBeInTheDocument();

    const overview = screen.getByRole("tabpanel", { name: "概览" });
    expect(within(overview).getByText("组织详情")).toBeInTheDocument();
    expect(within(overview).getByText("预算状态")).toBeInTheDocument();
    expect(within(overview).getByText("速率限制")).toBeInTheDocument();
    expect(within(overview).getByText("创建人：admin@example.com")).toBeInTheDocument();
    expect(within(overview).getByText("gpt-4o-mini")).toBeInTheDocument();
    expect(within(overview).getByText("TPM：无限制")).toBeInTheDocument();
    expect(within(overview).getByText("RPM：无限制")).toBeInTheDocument();
    expect(within(overview).getByText("重置：30d")).toBeInTheDocument();
  });

  it("names the all-proxy-models badge in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    mockUseOrganization.mockReturnValue({
      data: { ...mockOrg, models: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useOrganization>);
    renderOrgView();

    const overview = screen.getByRole("tabpanel", { name: "概览" });
    expect(within(overview).getByText("所有代理模型")).toBeInTheDocument();
  });

  it("renders an unlimited budget and a never-resetting budget in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    mockUseOrganization.mockReturnValue({
      data: {
        ...mockOrg,
        litellm_budget_table: { ...mockOrg.litellm_budget_table, max_budget: null, budget_duration: null },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useOrganization>);
    renderOrgView();

    await user.click(await screen.findByRole("tab", { name: "设置" }));

    const settings = screen.getByRole("tabpanel", { name: "设置" });
    expect(within(settings).getByText("最大值：无限制")).toBeInTheDocument();
    expect(within(settings).getByText("重置：不重置")).toBeInTheDocument();
  });

  it("renders the members tab in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderOrgView();

    await user.click(await screen.findByRole("tab", { name: "成员" }));

    const members = screen.getByRole("tabpanel", { name: "成员" });
    expect(within(members).getByText("未找到成员")).toBeInTheDocument();
  });

  it("renders the settings tab in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderOrgView();

    await user.click(await screen.findByRole("tab", { name: "设置" }));

    const settings = screen.getByRole("tabpanel", { name: "设置" });
    expect(within(settings).getByText("组织设置")).toBeInTheDocument();
    expect(within(settings).getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(within(settings).getByText("组织名称")).toBeInTheDocument();
    expect(within(settings).getByText("组织 ID")).toBeInTheDocument();
    expect(within(settings).getByText("预算")).toBeInTheDocument();
    expect(within(settings).getByText("最大值：$1,000.0000")).toBeInTheDocument();
    expect(within(settings).getByText("重置：30d")).toBeInTheDocument();
  });

  it("renders the settings form in Chinese once editing starts", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderOrgView();

    await user.click(await screen.findByRole("tab", { name: "设置" }));
    await user.click(await screen.findByRole("button", { name: "编辑设置" }));

    expect(await screen.findByLabelText("组织名称")).toHaveValue("Acme Corp");
    expect(screen.getByLabelText("最大预算（USD）")).toBeInTheDocument();
    expect(screen.getByLabelText("每分钟 Token 限制（TPM）")).toBeInTheDocument();
    expect(screen.getByLabelText("每分钟请求限制（RPM）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });
});
