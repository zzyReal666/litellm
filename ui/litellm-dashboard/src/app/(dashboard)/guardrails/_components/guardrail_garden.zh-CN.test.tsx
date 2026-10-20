import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/lib/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GuardrailGarden from "./guardrail_garden";

vi.mock("./guardrail_garden_detail", () => ({
  __esModule: true,
  default: ({ card, onBack }: { card: { name: string }; onBack: () => void }) => (
    <div>
      <span>Detail for {card.name}</span>
      <button onClick={onBack}>Back to garden</button>
    </div>
  ),
}));

const renderGarden = () => render(<GuardrailGarden accessToken="test-token" onGuardrailCreated={vi.fn()} />);

describe("GuardrailGarden 中文界面", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("把搜索占位符与两个分区标题渲染成中文", () => {
    renderGarden();

    expect(screen.getByPlaceholderText("搜索护栏")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM 内容过滤器")).toBeInTheDocument();
    expect(screen.getByText("合作伙伴护栏")).toBeInTheDocument();
    expect(screen.getByText("来自领先 AI 安全提供商的第三方护栏集成。")).toBeInTheDocument();
  });

  it("把卡片名称与描述渲染成中文，并保留提供商品牌名", () => {
    renderGarden();

    expect(screen.getByText("拒绝财务建议")).toBeInTheDocument();
    expect(screen.getByText("检测对个性化财务建议、投资建议或财务规划的请求。")).toBeInTheDocument();
    expect(screen.getByText("Presidio PII")).toBeInTheDocument();
    expect(
      screen.getByText("Microsoft Presidio 用于 PII 检测和匿名化。支持 30 多种实体类型，操作可配置。"),
    ).toBeInTheDocument();
    expect(screen.getByText("F1：94.9% · 5384 个测试用例")).toBeInTheDocument();
  });

  it("用基名 + count 解析 showAll，而不是复数后缀键", () => {
    // i18next 在传 count 时若词条表只有基名，会直接命中基名并插值；没有 showAll_other 也不会回退英文
    expect(i18n.t("guardrails.guardrailGarden.showAll", { count: 22 })).toBe("显示全部（22）");
    expect(i18n.t("guardrails.guardrailGarden.showAll", { count: 22, lng: "en" })).toBe("Show all (22)");
    expect(i18n.t("guardrails.guardrailGarden.showAll", { count: 1 })).toBe("显示全部（1）");
  });

  it("显示中文的展开全部计数，点击后展开剩余的 LiteLLM 卡片", async () => {
    const user = userEvent.setup();
    renderGarden();

    const showAll = screen.getByText("显示全部（22）");
    expect(showAll).toBeInTheDocument();
    expect(screen.queryByText("拦截竞争对手名称")).not.toBeInTheDocument();

    await user.click(showAll);

    expect(screen.getByText("收起")).toBeInTheDocument();
    expect(screen.getByText("拦截竞争对手名称")).toBeInTheDocument();
  });
});
