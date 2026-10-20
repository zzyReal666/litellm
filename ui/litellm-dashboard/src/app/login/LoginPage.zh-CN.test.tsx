import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import LoginPage from "./LoginPage";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, replace: mockReplace })),
}));

vi.mock("@/app/(dashboard)/hooks/uiConfig/useUIConfig", () => ({
  useUIConfig: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/login/useLogin", () => ({
  useLogin: vi.fn(() => ({ mutate: vi.fn(), isPending: false, error: null })),
}));

vi.mock("@/hooks/useWorker", () => ({
  useWorker: vi.fn(() => ({
    isControlPlane: false,
    workers: [],
    selectedWorkerId: null,
    selectedWorker: null,
    selectWorker: vi.fn(),
    disconnectFromWorker: vi.fn(),
  })),
}));

vi.mock("@/utils/cookieUtils", () => ({
  clearTokenCookies: vi.fn(),
  getCookieFromDocument: vi.fn(() => null),
}));

vi.mock("@/utils/jwtUtils", () => ({
  isJwtExpired: vi.fn(() => true),
}));

vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return { ...actual, getProxyBaseUrl: vi.fn(() => "http://localhost:4000") };
});

import { useUIConfig } from "@/app/(dashboard)/hooks/uiConfig/useUIConfig";

const renderLoginPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
      <LoginPage />
    </QueryClientProvider>,
  );

describe("LoginPage in zh-CN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: false,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: false,
      },
      isLoading: false,
    });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the login form in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderLoginPage();

    expect(await screen.findByRole("heading", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByText("访问您的 LiteLLM 管理界面。")).toBeInTheDocument();
    expect(screen.getByText("默认凭据")).toBeInTheDocument();
    expect(screen.getByLabelText("用户名")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入用户名")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用 SSO 登录" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看文档" })).toBeInTheDocument();
  });

  it("renders the default credentials hint in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderLoginPage();

    const hint = await screen.findByText(/默认情况下，用户名为/);

    expect(hint).toHaveTextContent("默认情况下，用户名为 admin，密码为您设置的 LiteLLM Proxy MASTER_KEY。");
  });

  it("renders the same English copy when the language is English", async () => {
    await i18n.changeLanguage("en");
    renderLoginPage();

    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByText("Access your LiteLLM Admin UI.")).toBeInTheDocument();
    expect(screen.getByText(/By default, Username is/)).toHaveTextContent(
      "By default, Username is admin and Password is your set LiteLLM ProxyMASTER_KEY.",
    );
    expect(screen.getByText(/Need to set UI credentials or SSO\?/)).toHaveTextContent(
      "Need to set UI credentials or SSO? Check the documentation.",
    );
    expect(screen.getByRole("link", { name: "Check the documentation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login with SSO" })).toBeInTheDocument();
  });
});
