import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import { renderWithProviders } from "../../tests/test-utils";
import Sidebar, { getBreadcrumb } from "./leftnav";

vi.mock("../utils/roles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/roles")>();
  return {
    ...actual,
    all_admin_roles: ["admin", "admin_viewer"],
    old_admin_roles: ["admin", "admin_viewer"],
    internalUserRoles: ["internal"],
    rolesWithWriteAccess: ["admin", "internal"],
    rolesAllowedToViewWriteScopedPages: ["admin", "internal", "admin_viewer"],
    isAdminRole: (role: string) => role === "admin" || role === "admin_viewer",
    isUserTeamAdminForAnyTeam: () => false,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/ui/api-keys",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({
    userId: "test-user-id",
    accessToken: "test-access-token",
    userRole: "admin",
    isViewOnly: false,
    token: "test-token",
    userEmail: "test@example.com",
    premiumUser: false,
    disabledPersonalKeyCreation: false,
    showSSOBanner: false,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/uiConfig/useUIConfig", () => ({
  useUIConfig: () => ({ data: { admin_ui_disabled: false }, isLoading: false }),
}));

vi.mock("@/app/(dashboard)/hooks/organizations/useOrganizations", () => ({
  useOrganizations: () => ({ data: [], isLoading: false, error: null }),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => ({ data: [], isLoading: false, error: null }),
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    logoUrl: null,
    logoUrlDark: null,
    faviconUrl: null,
    setLogoUrl: vi.fn(),
    setLogoUrlDark: vi.fn(),
    setFaviconUrl: vi.fn(),
  }),
}));

vi.mock("@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails", () => ({
  useHealthReadinessDetails: () => ({ data: undefined }),
}));

vi.mock("@/app/(dashboard)/hooks/useLogout", () => ({
  useLogout: () => vi.fn(),
}));

describe("Sidebar Chinese copy", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the navigation items, group label and logo alt text in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<Sidebar collapsed={false} />);

    expect(await screen.findByText("虚拟密钥")).toBeInTheDocument();
    expect(screen.getByText("AI 网关")).toBeInTheDocument();
    expect(screen.getByText("成本优化")).toBeInTheDocument();
    expect(screen.getByAltText("LiteLLM 品牌")).toBeInTheDocument();
    expect(screen.queryByText("Virtual Keys")).not.toBeInTheDocument();
    expect(screen.queryByText("Cost Optimization")).not.toBeInTheDocument();
  });

  it("translates the breadcrumb section and title in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    expect(getBreadcrumb("/ui/cost-optimization", i18n.t)).toEqual({ section: "可观测性", title: "成本优化" });
    expect(getBreadcrumb("/ui/tag-management", i18n.t)).toEqual({ section: "开发者工具", title: "标签管理" });
  });
});
