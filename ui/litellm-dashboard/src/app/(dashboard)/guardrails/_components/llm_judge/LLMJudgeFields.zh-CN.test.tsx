import { cleanup, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/lib/i18n";
import type { GuardrailFormValues } from "../GuardrailFormField";
import LLMJudgeFields from "./LLMJudgeFields";

const criterion = { name: "Policy accuracy", weight: 100, description: "Flags policy violations" };

const Harness = () => {
  const form = useForm<GuardrailFormValues>({ defaultValues: { criteria: [criterion] } });
  return <LLMJudgeFields availableModels={["gpt-4o"]} control={form.control} />;
};

describe("LLMJudgeFields in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the judge description, including the emphasised Judge Model, in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<Harness />);

    expect(screen.getByText(/每次 LLM 响应后/)).toBeInTheDocument();
    expect(screen.getByText(/若加权平均分低于阈值，响应将被拦截（或记录）。/)).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.tagName === "STRONG" && element.textContent === "Judge Model"),
    ).toBeInTheDocument();
  });

  it("renders the field labels and placeholders in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<Harness />);

    expect(screen.getByText("最低通过分数")).toBeInTheDocument();
    expect(screen.getByText("失败时的处理")).toBeInTheDocument();
    expect(screen.getByText("评估标准")).toBeInTheDocument();
    expect(screen.getByText("权重")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("选择模型")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("标准名称（例如：策略准确性）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("例如 50")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Judge 应针对此标准检查什么？")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加标准" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除标准" })).toBeInTheDocument();
  });

  it("renders the weight total and the on-failure option in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<Harness />);

    expect(screen.getByText(/权重合计：100%/)).toBeInTheDocument();
    expect(screen.getByText("拦截（返回 422）")).toBeInTheDocument();
  });

  it("keeps the criterion values supplied by the form untranslated", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<Harness />);

    expect(screen.getByDisplayValue("Policy accuracy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Flags policy violations")).toBeInTheDocument();
  });
});
