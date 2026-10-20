import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

const { useAuthorizedMock } = vi.hoisted(() => ({ useAuthorizedMock: vi.fn() }));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: useAuthorizedMock }));
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({ default: () => true }));
vi.mock("@/components/networking", () => ({
  organizationListCall: vi.fn(async () => []),
  userDailyActivityCall: vi.fn(async () => ({ results: [], metadata: { total_pages: 1, has_more: false, page: 1 } })),
  userDailyActivityAggregatedCall: vi.fn(async () => ({
    results: [],
    metadata: { total_pages: 1, has_more: false, page: 1 },
  })),
}));
vi.mock("./UsageTab", () => ({ __esModule: true, default: () => <div data-testid="usage-tab" /> }));
vi.mock("./PromptCompressionTab", () => ({ __esModule: true, default: () => <div data-testid="compression-tab" /> }));
vi.mock("./PromptCachingTab", () => ({ __esModule: true, default: () => <div data-testid="caching-tab" /> }));
vi.mock("./AutoRouterBenchmarksTab", () => ({ __esModule: true, default: () => <div data-testid="autorouter-tab" /> }));

import CostOptimizationView from "./CostOptimizationView";

const renderView = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <CostOptimizationView accessToken="test-token" userId="u1" userRole="Admin" />
    </QueryClientProvider>,
  );

describe("Cost Optimization page chrome in Chinese", () => {
  beforeEach(() => {
    useAuthorizedMock.mockReturnValue({
      accessToken: "test-token",
      userId: "u1",
      userRole: "Admin",
      isViewOnly: false,
    });
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the header, the subtitle, the tabs and the notices in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { container } = renderView();

    expect(screen.getByRole("heading", { level: 1, name: "成本优化" })).toBeInTheDocument();
    expect(screen.getByText(/跟踪并配置可为你省钱的机制/)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "总览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "提示词压缩" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "提示词缓存" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "自动路由" })).toBeInTheDocument();
    expect(screen.getByText("这是一个实验性面板")).toBeInTheDocument();
    expect(screen.getByText(/有反馈？/)).toBeInTheDocument();

    const visible = container.textContent ?? "";
    for (const english of ["Cost Optimization", "Overall", "Prompt Compression", "This is an experimental"]) {
      expect(visible).not.toContain(english);
    }
  });
});
