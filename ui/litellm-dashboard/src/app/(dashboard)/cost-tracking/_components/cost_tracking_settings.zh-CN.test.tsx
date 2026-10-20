import React from "react";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../../tests/test-utils";
import i18n from "@/lib/i18n";
import CostTrackingSettings from "./cost_tracking_settings";

vi.mock("./use_discount_config", () => ({
  useDiscountConfig: () => ({
    discountConfig: {},
    fetchDiscountConfig: vi.fn().mockResolvedValue(undefined),
    handleAddProvider: vi.fn().mockResolvedValue(true),
    handleRemoveProvider: vi.fn().mockResolvedValue(undefined),
    handleDiscountChange: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("./use_margin_config", () => ({
  useMarginConfig: () => ({
    marginConfig: {},
    fetchMarginConfig: vi.fn().mockResolvedValue(undefined),
    handleAddMargin: vi.fn().mockResolvedValue(true),
    handleRemoveMargin: vi.fn().mockResolvedValue(undefined),
    handleMarginChange: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("./use_block_unpriced_config", () => ({
  useBlockUnpricedConfig: () => ({
    blockUnpriced: false,
    isUpdating: false,
    fetchBlockUnpriced: vi.fn().mockResolvedValue(undefined),
    setBlockUnpriced: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/HelpLink", () => ({
  DocsMenu: () => null,
}));

vi.mock("./pricing_calculator/index", () => ({
  default: () => <div data-testid="pricing-calculator" />,
}));

vi.mock("./how_it_works", () => ({
  default: () => <div data-testid="how-it-works" />,
}));

const ADMIN_PROPS = {
  userID: "user-1",
  userRole: "proxy_admin",
  accessToken: "test-token",
};

describe("CostTrackingSettings in Chinese", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the page and section headers in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    expect(await screen.findByText("成本追踪设置")).toBeInTheDocument();
    expect(screen.getByText("提供商折扣")).toBeInTheDocument();
    expect(screen.getByText("费用/价格利润率")).toBeInTheDocument();
    expect(screen.getByText("价格计算器")).toBeInTheDocument();
  });

  it("renders the block unpriced models section in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await user.click(screen.getByText("拦截未定价模型").closest("button")!);

    expect(await screen.findByText("拦截未定价模型的请求")).toBeInTheDocument();
  });

  it("renders the discount panel in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await user.click(screen.getByText("提供商折扣").closest("button")!);

    expect(await screen.findByRole("button", { name: "+ 添加提供商折扣" })).toBeInTheDocument();
    expect(await screen.findByText("未配置提供商折扣")).toBeInTheDocument();
    expect(await screen.findByText("点击「添加提供商折扣」开始配置")).toBeInTheDocument();
  });

  it("renders the margin panel in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderWithProviders(<CostTrackingSettings {...ADMIN_PROPS} />);

    await user.click(screen.getByText("费用/价格利润率").closest("button")!);

    expect(await screen.findByRole("button", { name: "+ 添加提供商利润率" })).toBeInTheDocument();
    expect(await screen.findByText("未配置提供商利润率")).toBeInTheDocument();
    expect(await screen.findByText("点击「添加提供商利润率」开始配置")).toBeInTheDocument();
  });
});
