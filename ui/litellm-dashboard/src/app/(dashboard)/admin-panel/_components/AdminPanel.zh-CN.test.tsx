import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import AdminPanel from "./AdminPanel";

const mockGetSSOSettings = vi.fn();
const mockGetAllowedIPs = vi.fn();

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "http://localhost:4000",
  getGlobalLitellmHeaderName: () => "Authorization",
  getSSOSettings: (...args: unknown[]) => mockGetSSOSettings(...args),
  getAllowedIPs: (...args: unknown[]) => mockGetAllowedIPs(...args),
  addAllowedIP: vi.fn(),
  deleteAllowedIP: vi.fn(),
}));

vi.mock("@/components/constants", () => ({
  useBaseUrl: () => "http://localhost:4000",
}));

vi.mock("@/components/Settings/AdminSettings/SSOSettings/SSOSettings", () => ({
  default: () => <div>SSO Settings</div>,
}));

vi.mock("@/components/Settings/AdminSettings/UISettings/UISettings", () => ({
  default: () => <div>UI Settings</div>,
}));

vi.mock("@/components/SCIM", () => ({
  default: () => <div>SCIM Config</div>,
}));

vi.mock("@/components/SSOModals", () => ({
  default: () => <div>SSO Modals</div>,
}));

vi.mock("@/components/UIAccessControlForm", () => ({
  default: () => <div>UI Access Control Form</div>,
}));

const mockUseAuthorized = vi.fn();
vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => mockUseAuthorized(),
}));

describe("AdminPanel in zh-CN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthorized.mockReturnValue({
      premiumUser: false,
      accessToken: "test-token",
      userId: "user-1",
    });
    mockGetSSOSettings.mockResolvedValue({ values: {} });
    mockGetAllowedIPs.mockResolvedValue([]);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the heading, description and tab labels in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<AdminPanel />);

    expect(screen.getByRole("heading", { name: "管理员访问" })).toBeInTheDocument();
    expect(screen.getByText("前往「内部用户」页面添加其他管理员。")).toBeInTheDocument();
    for (const tab of ["SSO 设置", "安全设置", "界面设置", "日志设置"]) {
      expect(screen.getByRole("tab", { name: tab })).toBeInTheDocument();
    }
  });

  it("renders the security card and its deprecation notice in Chinese", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh-CN");
    render(<AdminPanel />);

    await user.click(screen.getByRole("tab", { name: "安全设置" }));

    expect(screen.getByRole("heading", { name: "✨ 安全设置" })).toBeInTheDocument();
    expect(screen.getByText("SSO 配置已弃用")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加 SSO" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "允许的 IP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "界面访问控制" })).toBeInTheDocument();
    expect(screen.getByText("不使用 SSO 登录")).toBeInTheDocument();
  });
});
