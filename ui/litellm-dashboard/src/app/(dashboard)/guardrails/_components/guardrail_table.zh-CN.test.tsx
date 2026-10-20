import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { Guardrail, GuardrailDefinitionLocation } from "@/components/guardrails/types";
import GuardrailTable from "./guardrail_table";

const baseProps = {
  isLoading: false,
  onDeleteClick: vi.fn(),
  onGuardrailClick: vi.fn(),
};

const makeGuardrail = (overrides: Partial<Guardrail> = {}): Guardrail => ({
  guardrail_id: "gr-1",
  guardrail_name: "PII Redaction",
  litellm_params: { guardrail: "presidio", mode: "pre_call", default_on: true },
  guardrail_info: null,
  created_at: "2021-01-01",
  updated_at: "2021-01-02",
  guardrail_definition_location: GuardrailDefinitionLocation.DB,
  ...overrides,
});

describe("GuardrailTable in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<GuardrailTable guardrailsList={[]} {...baseProps} />);

    for (const header of ["护栏 ID", "名称", "提供商", "模式", "默认启用", "创建时间", "更新时间"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });

  it("renders the default-on status badge in Chinese and keeps provider brand names untranslated", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<GuardrailTable guardrailsList={[makeGuardrail()]} {...baseProps} />);

    expect(screen.getByText("Presidio PII")).toBeInTheDocument();
    expect(screen.getByText("pre_call")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开护栏操作" })).toBeInTheDocument();
  });

  it("renders the empty state in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<GuardrailTable guardrailsList={[]} {...baseProps} />);

    expect(screen.getByText("暂无护栏")).toBeInTheDocument();
    expect(screen.getByText("添加护栏即可开始过滤请求与响应。")).toBeInTheDocument();
  });
});
