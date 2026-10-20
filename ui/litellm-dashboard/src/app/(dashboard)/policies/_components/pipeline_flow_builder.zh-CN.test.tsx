import React from "react";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/lib/i18n";
import PipelineFlowBuilder, { FlowBuilderPage, PipelineInfoDisplay } from "./pipeline_flow_builder";
import { GuardrailPipeline, PipelineStep } from "@/components/policies/types";
import { Guardrail } from "@/components/guardrails/types";

vi.mock("@/components/networking");

const step = (overrides: Partial<PipelineStep> = {}): PipelineStep => ({
  guardrail: "pii-masker",
  on_pass: "next",
  on_fail: "block",
  on_error: null,
  modify_response_message: null,
  ...overrides,
});

const pipeline = (steps: PipelineStep[]): GuardrailPipeline => ({ mode: "pre_call", steps });

const guardrails = [
  { guardrail_id: "g1", guardrail_name: "pii-masker" },
  { guardrail_id: "g2", guardrail_name: "prompt-injection" },
] as Guardrail[];

describe("PipelineFlowBuilder in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the step editor in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(
      <PipelineFlowBuilder pipeline={pipeline([step()])} onChange={vi.fn()} availableGuardrails={guardrails} />,
    );

    expect(screen.getByText("触发器")).toBeInTheDocument();
    expect(screen.getByText("传入 LLM 请求")).toBeInTheDocument();
    expect(screen.getByText("当请求匹配此策略时，该流程将运行")).toBeInTheDocument();
    expect(screen.getByText("步骤 1")).toBeInTheDocument();
    expect(screen.getByText("通过时")).toBeInTheDocument();
    expect(screen.getByText("失败时")).toBeInTheDocument();
    expect(screen.getByText("API 故障时")).toBeInTheDocument();
    expect(screen.getAllByText("动作")).toHaveLength(3);
    expect(screen.getAllByText("护栏")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "删除步骤" })).toBeInTheDocument();
    expect(screen.getByText("结束")).toBeInTheDocument();
    expect(screen.getByText("继续至 LLM")).toBeInTheDocument();
    expect(screen.getByText("请求将继续发送到模型")).toBeInTheDocument();
  });

  it("maps step actions to their Chinese labels in the read-only view", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(
      <PipelineInfoDisplay pipeline={pipeline([step({ on_pass: "next", on_fail: "block", on_error: "allow" })])} />,
    );

    expect(screen.getByText("通过 → 下一步")).toBeInTheDocument();
    expect(screen.getByText("失败时 → 拦截")).toBeInTheDocument();
    expect(screen.getByText("API 故障时 → 允许")).toBeInTheDocument();
  });

  it("falls back to the on-fail action in Chinese when no API-failure action is set", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<PipelineInfoDisplay pipeline={pipeline([step({ on_error: null })])} />);

    expect(screen.getByText("API 故障时 → 拦截（与失败时相同）")).toBeInTheDocument();
  });

  it("renders the flow builder header and draw the test panel in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderWithProviders(
      <FlowBuilderPage
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        accessToken="sk-test"
        availableGuardrails={guardrails}
        createPolicy={vi.fn()}
        updatePolicy={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存策略" })).toBeInTheDocument();
    expect(screen.getByText("流程")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("策略名称...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("添加描述（可选）...")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "测试流水线" }));

    expect(await screen.findByText("测试方式")).toBeInTheDocument();
    expect(screen.getByText("消息")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入测试消息...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "运行测试" })).toBeInTheDocument();
    expect(screen.getByText("请在上方选择测试源（快速对话或合规数据集），然后点击「运行测试」")).toBeInTheDocument();
  });
});
