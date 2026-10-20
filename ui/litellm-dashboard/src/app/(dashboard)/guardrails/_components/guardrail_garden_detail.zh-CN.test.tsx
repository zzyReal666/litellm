import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "@/lib/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GuardrailDetailView from "./guardrail_garden_detail";
import type { GuardrailCardInfo } from "./guardrail_garden_data";

vi.mock("./add_guardrail_form", () => ({ default: () => null }));

const makeCard = (overrides: Partial<GuardrailCardInfo> = {}): GuardrailCardInfo => ({
  id: "cf_denied_financial",
  name: "拒绝财务建议",
  description: "检测对个性化财务建议、投资建议或财务规划的请求。",
  category: "litellm",
  subcategory: "内容类别",
  logo: "/_next/static/media/litellm_logo.jpg",
  tags: ["内容类别", "主题拦截器"],
  eval: { f1: 100, precision: 100, recall: 100, testCases: 207, latency: "<0.1ms" },
  ...overrides,
});

const renderDetail = (card: GuardrailCardInfo) =>
  render(<GuardrailDetailView card={card} onBack={vi.fn()} accessToken={null} onGuardrailCreated={vi.fn()} />);

describe("GuardrailDetailView 中文界面", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it.each([
    ["概览", "tabOverview"],
    ["护栏详情", "guardrailDetails"],
    ["详细信息如下", "detailsSubtitle"],
    ["属性", "propertyHeader"],
    ["护栏 ID", "guardrailId"],
    ["类型", "typeLabel"],
    ["内容过滤器", "typeContentFilter"],
    ["标签", "tagsLabel"],
    ["创建护栏", "createGuardrail"],
  ])("把 %s 渲染成中文", (expected) => {
    renderDetail(makeCard());

    expect(screen.getAllByText(expected).length).toBeGreaterThan(0);
  });

  it("渲染中文的属性与指标行，并翻译卡片标签与外部依赖", () => {
    renderDetail(makeCard());

    for (const label of ["提供商", "子类别", "费用", "外部依赖", "延迟"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("$0 / 次请求")).toBeInTheDocument();
    expect(screen.getByText("无")).toBeInTheDocument();
    expect(screen.getAllByText("内容类别").length).toBeGreaterThan(0);
    expect(screen.getByText("主题拦截器")).toBeInTheDocument();
  });

  it("在评估结果标签页渲染中文的指标表头", () => {
    renderDetail(makeCard());

    fireEvent.click(screen.getByText("评估结果"));

    for (const header of ["指标", "值", "精确率", "召回率", "F1 分数", "测试用例", "误报", "漏报", "延迟（p50）"]) {
      expect(screen.getAllByText(header).length).toBeGreaterThan(0);
    }
  });
});
