import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import CloudZeroCostTracking from "./CloudZeroCostTracking";

const mockUseCloudZeroSettings = vi.fn();

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  __esModule: true,
  default: () => ({ accessToken: "test-token" }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings", () => ({
  useCloudZeroSettings: () => mockUseCloudZeroSettings(),
}));

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: () => "http://test-proxy",
}));

const renderCostTracking = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CloudZeroCostTracking />
    </QueryClientProvider>,
  );
};

describe("CloudZeroCostTracking in Chinese", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the loading message in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    mockUseCloudZeroSettings.mockReturnValue({ data: null, isLoading: true, error: null });
    renderCostTracking();

    expect(await screen.findByText("正在加载 CloudZero 设置...")).toBeInTheDocument();
  });

  it("renders the error message in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    mockUseCloudZeroSettings.mockReturnValue({ data: null, isLoading: false, error: new Error("boom") });
    renderCostTracking();

    expect(await screen.findByText("加载 CloudZero 设置时出错：boom")).toBeInTheDocument();
  });

  it("renders the empty state in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    mockUseCloudZeroSettings.mockReturnValue({ data: null, isLoading: false, error: null });
    renderCostTracking();

    expect(await screen.findByText("未找到 CloudZero 集成")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加 CloudZero 集成" })).toBeInTheDocument();
    expect(screen.getByText("连接您的 CloudZero 账户，即可直接在 LiteLLM 中追踪和分析云端成本。")).toBeInTheDocument();
  });
});
