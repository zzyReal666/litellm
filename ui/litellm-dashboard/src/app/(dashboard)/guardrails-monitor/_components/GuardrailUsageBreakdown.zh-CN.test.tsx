import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { GuardrailUsageDetail } from "@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage";
import i18n from "@/lib/i18n";
import { GuardrailUsageBreakdown } from "./GuardrailUsageBreakdown";

const detail: GuardrailUsageDetail = {
  guardrail_id: "bedrock-pii-mask",
  guardrail_name: "bedrock-pii-mask",
  type: "pii",
  provider: "Bedrock",
  requestsEvaluated: 5,
  failRate: 0,
  avgScore: null,
  avgLatency: 120,
  status: "healthy",
  trend: "stable",
  description: null,
  time_series: [],
  usage_units: { contentPolicyUnits: 1000, sensitiveInformationPolicyUnits: 300, someFutureCounter: 7 },
  usage_units_daily: [],
  usage_units_by_team: {
    "team-a": { contentPolicyUnits: 900, sensitiveInformationPolicyUnits: 300 },
    "": { contentPolicyUnits: 100, someFutureCounter: 7 },
  },
  usage_units_by_key: {
    "hash-1": { contentPolicyUnits: 1000, sensitiveInformationPolicyUnits: 300 },
    "hash-2": { someFutureCounter: 7 },
  },
  cost: 0.18,
  cost_by_unit: { contentPolicyUnits: 0.15, sensitiveInformationPolicyUnits: 0.03, someFutureCounter: null },
  cost_by_team: { "team-a": 0.165, "": 0.015 },
  cost_by_key: { "hash-1": 0.18, "hash-2": null },
  untracked_usage_units: { someFutureCounter: 7 },
  untracked_usage_units_by_team: { "team-a": {}, "": { someFutureCounter: 7 } },
  untracked_usage_units_by_key: { "hash-1": {}, "hash-2": { someFutureCounter: 7 } },
};

describe("GuardrailUsageBreakdown in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the usage summary and the breakdown tables in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<GuardrailUsageBreakdown detail={detail} />);

    expect(screen.getByText("用量与费用")).toBeInTheDocument();
    expect(screen.getByText("提供商为此护栏上报的可计费单位，以及 LiteLLM 为它们定价的结果")).toBeInTheDocument();

    const cost = screen.getByRole("group", { name: "费用" });
    expect(cost).toHaveTextContent("$0.1800");
    const units = screen.getByRole("group", { name: "用量单位" });
    expect(units).toHaveTextContent("1,307");
    expect(units).toHaveTextContent("3 个计数器");

    expect(screen.getByRole("columnheader", { name: "计数器" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader", { name: "未定价单位" })).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "按团队" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "按密钥" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /无团队/ })).toBeInTheDocument();
  });

  it("explains the cost math in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    render(<GuardrailUsageBreakdown detail={detail} />);

    const cost = screen.getByRole("group", { name: "费用" });
    await user.click(within(cost).getByRole("button", { name: /How is this calculated/ }));

    const dialog = await screen.findByRole("dialog", { name: "此费用是如何计算的" });
    expect(within(dialog).getByText("已定价单位数 × 每单位价格 = 费用，按计数器分别计算")).toBeInTheDocument();
    expect(within(dialog).getByText("每单位价格来自 LiteLLM 内置的费用表。")).toBeInTheDocument();
  });

  it("says the period has no billable units in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <GuardrailUsageBreakdown
        detail={{
          ...detail,
          usage_units: {},
          usage_units_by_team: {},
          usage_units_by_key: {},
          cost: null,
          cost_by_unit: {},
          cost_by_team: {},
          cost_by_key: {},
          untracked_usage_units: {},
          untracked_usage_units_by_team: {},
          untracked_usage_units_by_key: {},
        }}
      />,
    );

    expect(screen.getByText("此时间段内没有记录到可计费用量单位。")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
