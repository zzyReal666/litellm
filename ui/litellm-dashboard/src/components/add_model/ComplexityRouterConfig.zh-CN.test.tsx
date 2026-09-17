import { cleanup, fireEvent, renderWithProviders, screen } from "../../../tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import ComplexityRouterConfig, { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

vi.mock(
  "@/app/(dashboard)/hooks/autoRouter/useComplexityScorerDefaults",
  async () => await import("../../../tests/mocks/complexityScorerDefaults"),
);

const modelInfo = [
  { model_group: "gpt-4", mode: "chat", supports_reasoning: true, supported_reasoning_efforts: ["medium", "high"] },
  { model_group: "gpt-3.5-turbo", mode: "chat" },
] as any[];

const value: ComplexityRouterConfigValue = {
  tiers: {
    SIMPLE: ["gpt-3.5-turbo"],
    MEDIUM: ["gpt-3.5-turbo"],
    COMPLEX: ["gpt-4"],
    REASONING: ["gpt-4"],
  },
  classifier_type: "heuristic",
};

const baseProps = {
  modelInfo,
  value,
  onChange: vi.fn(),
  keywordTierRules: [],
  onKeywordTierRulesChange: vi.fn(),
  semanticMatchingEnabled: false,
  onSemanticMatchingEnabledChange: vi.fn(),
  embeddingModel: undefined,
  onEmbeddingModelChange: vi.fn(),
  matchThreshold: 0.5,
  onMatchThresholdChange: vi.fn(),
};

describe("ComplexityRouterConfig zh-CN", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the card title, tier names and example queries in Chinese", () => {
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    expect(screen.getByText("复杂度层级配置")).toBeInTheDocument();
    expect(screen.getByText("简单层级")).toBeInTheDocument();
    expect(screen.getByText("中等层级")).toBeInTheDocument();
    expect(screen.getByText("复杂层级")).toBeInTheDocument();
    expect(screen.getByText("推理层级")).toBeInTheDocument();
    expect(screen.getAllByText(/示例：/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Complexity Tier Configuration")).not.toBeInTheDocument();
  });

  it("renders the default model section and its hint in Chinese", () => {
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    expect(screen.getByText("默认模型")).toBeInTheDocument();
    expect(screen.getByLabelText("默认模型")).toBeInTheDocument();
  });

  it("renders the classification breakdown in Chinese once the section is open", () => {
    renderWithProviders(<ComplexityRouterConfig {...baseProps} />);

    fireEvent.click(screen.getByText("高级：分类方法"));

    expect(screen.getByText("分类原理")).toBeInTheDocument();
    expect(screen.getAllByText("简单").length).toBeGreaterThan(0);
  });
});
