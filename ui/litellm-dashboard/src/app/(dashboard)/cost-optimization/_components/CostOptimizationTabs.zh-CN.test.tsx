import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import type { DailyData, KeyMetricWithMetadata, SpendMetrics } from "@/components/UsagePage/types";
import type { ToolSpendResponse } from "@/components/networking";

const { useAuthorizedMock } = vi.hoisted(() => ({ useAuthorizedMock: vi.fn() }));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({ default: useAuthorizedMock }));
vi.mock("@/app/(dashboard)/hooks/useCan", () => ({ default: () => true }));
vi.mock("@/app/(dashboard)/hooks/useIsOrgAdmin", () => ({ default: () => false }));
vi.mock("@/app/(dashboard)/hooks/keys/useKeys", () => ({
  useInfiniteKeys: vi.fn(() => ({
    data: { pages: [{ keys: [{ token: "hash-alpha", key_alias: "prod-alpha" }], total_count: 1, total_pages: 1 }] },
    isPending: false,
    isError: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));
vi.mock("@/app/(dashboard)/hooks/users/useUsers", () => ({
  useInfiniteUsers: vi.fn(() => ({
    data: { pages: [{ users: [{ user_id: "dev-alice", user_email: "alice@example.com" }], page: 1, total_pages: 1 }] },
    isPending: false,
    isError: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
}));
vi.mock("@/app/(dashboard)/hooks/models/useModels", () => ({
  useAutoRouters: vi.fn(() => ({ data: [{ model_name: "claude-auto", litellm_params: {} }] })),
  usePlainModelGroups: vi.fn(() => new Set<string>()),
  usePlainChatModelGroups: vi.fn(() => new Set<string>()),
  usePlainChatModelDeployments: vi.fn(() => []),
}));

const guardrails = [
  {
    guardrail_id: "g-1",
    guardrail_name: "always-on-one",
    litellm_params: { guardrail: "headroom", api_base: "https://a.example.com", default_on: true },
  },
  {
    guardrail_id: "g-2",
    guardrail_name: "opt-in-one",
    litellm_params: { guardrail: "headroom", api_base: "https://b.example.com", default_on: false },
  },
];

const promptCachingSettings = [
  {
    field_name: "enable_anthropic_prompt_caching",
    field_type: "Boolean",
    field_value: true,
    field_description: "enables caching",
    stored_in_db: true,
    field_tab: "prompt_caching",
  },
  {
    field_name: "anthropic_prompt_caching_ttl",
    field_type: "Select",
    field_value: null,
    field_description: "how long a cache entry lives",
    stored_in_db: null,
    field_options: ["5m", "1h"],
    field_tab: "prompt_caching",
  },
];

vi.mock("@/components/networking", () => ({
  getToolSpend: vi.fn(
    async (): Promise<ToolSpendResponse> => ({ by_tool: [], daily: [], start_date: null, end_date: null }),
  ),
  getGuardrailsList: vi.fn(async () => ({ guardrails })),
  createGuardrailCall: vi.fn(async () => ({})),
  getGeneralSettingsCall: vi.fn(async () => promptCachingSettings),
  organizationListCall: vi.fn(async () => []),
}));

vi.mock("@/components/shared/advanced_date_picker", () => ({
  __esModule: true,
  default: () => <div data-testid="date-picker" />,
}));

vi.mock("@/components/shared/charts", () => ({
  AreaChart: ({ categories, data }: { categories: string[]; data: unknown }) => (
    <div data-testid="area-chart" data-categories={categories.join(",")} data-series={JSON.stringify(data)} />
  ),
  BarChart: ({ categories, data }: { categories: string[]; data: unknown }) => (
    <div data-testid="bar-chart" data-categories={categories.join(",")} data-series={JSON.stringify(data)} />
  ),
  DonutChart: ({ data, label }: { data: unknown; label: string }) => (
    <div data-testid="donut-chart" data-label={label} data-slices={JSON.stringify(data)} />
  ),
  CustomLegend: ({ categories }: { categories: readonly string[] }) => (
    <div data-testid="chart-legend">{categories.join(",")}</div>
  ),
  SEQUENTIAL_COLOR_RAMP: ["indigo", "blue", "sky", "cyan"],
  DEFAULT_COLOR_CYCLE: ["indigo", "blue", "sky", "cyan"],
  chartColorValue: (color: string) => color,
}));

vi.mock("./useAutoRouterBenchmarks", () => ({ useAutoRouterBenchmarks: vi.fn() }));
vi.mock("./useShadowEval", () => ({
  useShadowEvalJobs: vi.fn(),
  useShadowEvalJob: vi.fn(),
  useStartShadowEval: vi.fn(),
  useStopShadowEval: vi.fn(),
}));
vi.mock("./ShadowEvalStartForm", () => ({ StartForm: () => <div data-testid="start-form" /> }));

import { useAutoRouterBenchmarks } from "./useAutoRouterBenchmarks";
import { useShadowEvalJob, useShadowEvalJobs, useStartShadowEval, useStopShadowEval } from "./useShadowEval";

import AutoRouterBenchmarksTab from "./AutoRouterBenchmarksTab";
import CacheLeakageCard from "./CacheLeakageCard";
import PromptCachingTab from "./PromptCachingTab";
import PromptCompressionTab from "./PromptCompressionTab";
import ShadowEvalSection from "./ShadowEvalSection";
import TierTurnsChart from "./TierTurnsChart";
import UsageTab from "./UsageTab";
import type { DailyActivityRange } from "./useDailyActivityRange";
import type { AutoRouterBenchmarksResponse, AutoRouterCacheStats, BenchmarkView } from "./autoRouterBenchmarks";

const baseMetrics = (overrides: Partial<SpendMetrics>): SpendMetrics => ({
  spend: 0,
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
  api_requests: 0,
  successful_requests: 0,
  failed_requests: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
  ...overrides,
});

const keyWith = (alias: string, metrics: Partial<SpendMetrics>): KeyMetricWithMetadata => ({
  metrics: baseMetrics(metrics),
  metadata: { key_alias: alias, team_id: null },
});

const dayWithKeys = (date: string, apiKeys: Record<string, KeyMetricWithMetadata>): DailyData => ({
  date,
  metrics: baseMetrics({
    compression_savings_spend: 0.04,
    gateway_injected_caching_savings_spend: 0.01,
    autorouter_savings_spend: 0.07,
  }),
  breakdown: {
    models: {},
    model_groups: {},
    mcp_servers: {},
    providers: {},
    api_keys: apiKeys,
    entities: {},
  },
});

const activity = (): DailyActivityRange => ({
  dateValue: { from: new Date(2026, 6, 1), to: new Date(2026, 6, 14) },
  onDateChange: vi.fn(),
  results: [
    dayWithKeys("2026-07-01", {
      "hash-alpha": keyWith("prod-alpha", {
        prompt_tokens: 1000,
        cache_read_input_tokens: 100,
        prompt_caching_savings_spend: 1,
      }),
    }),
  ],
  loading: false,
  isFetchingMore: false,
  progress: { currentPage: 1, totalPages: 1 },
  cancelled: false,
  cancel: vi.fn(),
});

const cacheStats = (): AutoRouterCacheStats => ({
  coverage_pct: 99.6,
  hit_rate_pct: 93.3,
  same_model: { turns: 400, hits: 391, hit_rate_pct: 97.7 },
  first_visit: { turns: 37, hits: 9, hit_rate_pct: 24.3 },
  return_to_tier: { turns: 381, hits: 311, hit_rate_pct: 81.6 },
  unordered_turns: 5,
  return_misses_expired: 19,
  return_misses_within_ttl: 51,
  return_misses_unknown: 0,
  ttl_5m_turns: 0,
  ttl_1h_turns: 818,
});

const benchmarksResponse = () =>
  ({
    start_date: "2026-07-06",
    end_date: "2026-08-05",
    routers_in_scope: 0,
    totals: {
      sessions: 94,
      turns: 3073,
      avg_turns_per_session: 32.7,
      avg_session_seconds: 7560,
      avg_tokens_per_session: 5_300_000,
      spend: 359.86,
      classifier_cost: 6.146,
      saved_spend: 2174.59,
      baseline_spend: 2534.45,
      saved_pct: 85.8,
      saved_per_session: 23.13,
      cache: cacheStats(),
    },
    groups: [],
  }) as unknown as AutoRouterBenchmarksResponse;

const shadowEvalJob = (overrides: Record<string, unknown> = {}) => ({
  job_id: "job-1",
  status: "running",
  router_name: "claude-auto",
  router_names: ["claude-auto"],
  models: [],
  direction: "forward",
  baseline_model: null,
  judge_model: "prod-judge",
  shadow_percentage: 10,
  targets: [
    {
      target_type: "team",
      target_id: "team-eng",
      max_turns: 10000,
      max_budget: 10,
      spend: 3.21,
      stopped_at: null,
      target_alias: null,
      key_name: null,
    },
    {
      target_type: "key",
      target_id: "hashed-key-abc",
      max_turns: 10000,
      max_budget: 10,
      spend: 0,
      stopped_at: null,
      target_alias: "prod-alpha",
      key_name: "sk-...alpha",
    },
  ],
  judged_count: 42,
  error_count: 1,
  results: {
    by_tier: [
      {
        group: "SIMPLE",
        turn_count: 12,
        real_win_rate_pct: 20,
        shadow_win_rate_pct: 55,
        tie_rate_pct: 25,
        avg_judge_confidence: 0.81,
        real_spend: 0.4,
        shadow_spend: 0.1,
        cache_hit_turns: 2,
      },
    ],
    by_current_model: [],
    overall_shadow_win_rate_pct: 48,
    overall_tie_rate_pct: 22,
    sampled_real_spend: 0.6,
    sampled_shadow_spend: 0.3,
  },
  created_at: "2026-08-07T00:00:00Z",
  ends_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  last_error: null,
  ...overrides,
});

const renderWithQuery = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

// Copy that used to be hardcoded English on this page. Brand names (LiteLLM, Headroom,
// Anthropic), the UTC/TTL/API/Token units, model and router ids the proxy sends, and the
// en-US date labels the shared formatter produces are not copy and are deliberately out.
const FORMER_ENGLISH = [
  "Cost Optimization",
  "This is an experimental dashboard",
  "Track and configure the mechanisms",
  "Total saved",
  "Savings by driver",
  "Spend by tool",
  "Spend is bucketed by UTC day",
  "Running total saved",
  "Saved per day",
  "Add guardrail",
  "Always on",
  "Opt-in",
  "Loading...",
  "Headroom API base",
  "No prompt compression guardrails",
  "Cache leakage by",
  "Uncached input tokens",
  "Potential savings",
  "Data is still loading",
  "Routing by tier",
  "Share of turns",
  "turns measured",
  "Auto-router prompt caching",
  "every turn falls in exactly one bucket",
  "Total estimated savings",
  "Previous evaluations",
  "Loading evaluations...",
  "Share of turns by bucket",
  "Sort by",
  "No verdicts yet",
  "low sample",
  "ends in 3 days",
  "eval spend",
  "judged responses",
  "cache-served turns excluded",
  "Loading results...",
  "Stopping...",
  "Stop",
  "Hide",
  "Show",
  "1K turns)",
];

const expectNoEnglishLeftovers = (container: HTMLElement) => {
  const visible = container.textContent ?? "";
  expect(FORMER_ENGLISH.filter((phrase) => visible.includes(phrase))).toEqual([]);
};

describe("Cost Optimization tabs in Chinese", () => {
  beforeEach(() => {
    useAuthorizedMock.mockReturnValue({
      accessToken: "test-token",
      userId: "u1",
      userRole: "Admin",
      isViewOnly: false,
    });
    vi.mocked(useShadowEvalJobs).mockReturnValue({ data: [], error: null, isPending: false } as never);
    vi.mocked(useShadowEvalJob).mockReturnValue({ data: undefined, isError: false } as never);
    vi.mocked(useStartShadowEval).mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
    vi.mocked(useStopShadowEval).mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
    vi.mocked(useAutoRouterBenchmarks).mockReturnValue({
      data: benchmarksResponse(),
      isPending: false,
      error: null,
    } as never);
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the overall tab, the tiles and the tool paragraph in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { container } = renderWithQuery(<UsageTab accessToken="test-token" activity={activity()} />);

    expect(screen.getByText("共计节省")).toBeInTheDocument();
    expect(screen.getByText("按来源统计的节省")).toBeInTheDocument();
    expect(screen.getByText("按工具统计的花费")).toBeInTheDocument();
    expect(screen.getByText(/调用过各工具/)).toBeInTheDocument();
    expectNoEnglishLeftovers(container);
  });

  it("hands the charts Chinese series names, and the donut Chinese driver slices", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithQuery(<UsageTab accessToken="test-token" activity={activity()} />);

    expect(screen.getByTestId("chart-legend")).toHaveTextContent("压缩,提示词缓存,自动路由");
    const area = screen.getByTestId("area-chart");
    expect(area).toHaveAttribute("data-categories", "压缩,提示词缓存,自动路由");
    expect(area.getAttribute("data-series")).toContain("压缩");
    expect(area.getAttribute("data-series")).not.toContain("Compression");
    expect(screen.getByTestId("donut-chart").getAttribute("data-slices")).toContain("压缩");
  });

  it("renders the compression tab, its labels and its badges in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { container } = renderWithQuery(<PromptCompressionTab accessToken="test-token" />);

    expect(await screen.findByText("始终启用")).toBeInTheDocument();
    expect(screen.getByText("按需启用")).toBeInTheDocument();
    expect(screen.getByLabelText("Headroom API 地址")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加护栏" })).toBeInTheDocument();
    expect(screen.getByText(/Headroom 是 LiteLLM 原生的护栏/)).toBeInTheDocument();
    expectNoEnglishLeftovers(container);
  });

  it("renders the prompt caching tab, the shared settings panel included, in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { container } = renderWithQuery(<PromptCachingTab accessToken="test-token" activity={activity()} />);

    expect(await screen.findByText("Anthropic 自动提示词缓存")).toBeInTheDocument();
    expect(screen.getByText("缓存存活时间（TTL）")).toBeInTheDocument();
    expect(screen.getAllByText("5m（默认）").length).toBeGreaterThan(0);
    expect(screen.getByText("未缓存输入 Token")).toBeInTheDocument();
    expectNoEnglishLeftovers(container);
  });

  it("renders the cache leakage card, its headers and its tooltips in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { container } = renderWithQuery(<CacheLeakageCard activity={activity()} />);

    expect(screen.getByText("未缓存输入 Token")).toBeInTheDocument();
    expect(screen.getByText("缓存命中率")).toBeInTheDocument();
    expect(screen.getByText("潜在节省")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "按虚拟密钥" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "按模型" })).toBeInTheDocument();
    expect(screen.getByLabelText(/从缓存读取的输入 Token 占比/)).toBeInTheDocument();
    expect(screen.getByLabelText(/如果这些未缓存输入改用提示词缓存/)).toBeInTheDocument();
    expectNoEnglishLeftovers(container);
  });

  it("renders the auto-router tab, its metrics and its bucket copy in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { container } = renderWithQuery(
      <AutoRouterBenchmarksTab
        accessToken="test-token"
        activity={{ dateValue: { from: new Date(2026, 6, 1), to: new Date(2026, 6, 14) }, onDateChange: vi.fn() }}
      />,
    );

    expect(screen.getByText("自动路由用量")).toBeInTheDocument();
    expect(screen.getByText("全部自动路由")).toBeInTheDocument();
    expect(screen.getByText("按最高层级模型估算的花费")).toBeInTheDocument();
    expect(screen.getByText("每会话平均节省")).toBeInTheDocument();
    expect(screen.getAllByText(/每 1K 轮/).length).toBeGreaterThan(0);
    expect(screen.getByText("自动路由提示词缓存")).toBeInTheDocument();
    expect(screen.getByText("每一轮都按其路由行为归入唯一的分桶")).toBeInTheDocument();
    expect(screen.getByText("轮次占比")).toBeInTheDocument();
    expect(screen.getByText(/已统计/)).toBeInTheDocument();
    expect(screen.getByText("上一轮 → 同一层级")).toBeInTheDocument();
    expect(screen.getByText(/因跨 Pod 到达顺序错乱而未纳入分桶/)).toBeInTheDocument();
    expectNoEnglishLeftovers(container);
  });

  it("renders the shadow eval results and history in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    vi.mocked(useShadowEvalJobs).mockReturnValue({
      data: [shadowEvalJob(), shadowEvalJob({ job_id: "job-2", status: "completed" })],
      error: null,
      isPending: false,
    } as never);

    const { container } = renderWithQuery(<ShadowEvalSection />);

    expect(screen.getByText("影子评估")).toBeInTheDocument();
    expect(screen.getByText(/用密钥、团队或用户的真实流量对自动路由做盲评/)).toBeInTheDocument();
    expect(screen.getAllByText("运行中").length).toBeGreaterThan(0);
    expect(screen.getByText(/已评判 42 轮 · 1 次出错 · 评估花费 \$3\.21，预算 \$20\.00/)).toBeInTheDocument();
    expect(screen.getByText(/3 天后结束/)).toBeInTheDocument();
    expect(screen.getAllByText("路由胜出").length).toBeGreaterThan(0);
    expect(screen.getAllByText("平局").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/占 42 条已评判回答/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/基于相同的已评判轮次/).length).toBeGreaterThan(0);
    expect(screen.getByText("（样本偏少）")).toBeInTheDocument();
    expect(screen.getByText("历史评估（1）")).toBeInTheDocument();
    expect(screen.getByText("2 个对象")).toBeInTheDocument();
    expect(screen.getByText("团队")).toBeInTheDocument();
    expectNoEnglishLeftovers(container);
  });

  it("renders the tier chart description in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const view = {
      label: "claude-auto",
      stats: {
        ...benchmarksResponse().totals,
        router_name: "claude-auto",
        router_type: "complexity",
        tier_turns: { SIMPLE: 20, REASONING: 20 },
      },
    } as unknown as BenchmarkView;

    const { container } = renderWithQuery(<TierTurnsChart view={view} autoRouters={[]} />);

    expect(screen.getByText("按层级路由")).toBeInTheDocument();
    expect(screen.getByText(/各层级服务的轮次/)).toBeInTheDocument();
    expectNoEnglishLeftovers(container);
  });
});
