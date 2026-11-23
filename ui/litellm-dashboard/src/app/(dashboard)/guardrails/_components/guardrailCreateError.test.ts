import { describe, expect, it } from "vitest";
import i18n from "@/lib/i18n";

import { buildGuardrailCreateErrorReport } from "./guardrailCreateError";

const t = i18n.getFixedT("zh-CN");

const fastApiError = (detail: unknown): Error => new Error(JSON.stringify({ detail }));

describe("buildGuardrailCreateErrorReport", () => {
  it("names the failing field, its reason and a fix suggestion from a 422 response", () => {
    const report = buildGuardrailCreateErrorReport(
      fastApiError([
        {
          loc: ["body", "litellm_params", "api_base"],
          msg: "Input should be a valid URL",
          type: "url_parsing",
        },
      ]),
      t,
    );

    expect(report.problems).toHaveLength(1);
    expect(report.problems[0].fieldLabel).toBe("API 基础地址");
    expect(report.problems[0].reason).toBe("Input should be a valid URL");
    expect(report.problems[0].suggestion).toBe("invalidUrl");
    expect(report.message).toContain("API 基础地址");
    expect(report.message).toContain("http://");
  });

  it("maps server field names back to form fields so the input can be highlighted", () => {
    const report = buildGuardrailCreateErrorReport(
      fastApiError([
        { loc: ["body", "guardrail_name"], msg: "Field required", type: "missing" },
        { loc: ["body", "litellm_params", "mode"], msg: "Field required", type: "missing" },
      ]),
      t,
    );

    expect(report.problems.map((problem) => problem.formField)).toEqual(["guardrail_name", "mode"]);
    expect(report.problems.map((problem) => problem.suggestion)).toEqual(["required", "required"]);
  });

  it("reports every failing field, not just the first", () => {
    const report = buildGuardrailCreateErrorReport(
      fastApiError([
        { loc: ["body", "guardrail_name"], msg: "String should have at most 20 characters", type: "string_too_long" },
        { loc: ["body", "litellm_params", "default_on"], msg: "Input should be a valid boolean", type: "bool_parsing" },
      ]),
      t,
    );

    expect(report.problems).toHaveLength(2);
    expect(report.problems[0].suggestion).toBe("tooLong");
    expect(report.problems[1].fieldLabel).toBe("默认启用");
    expect(report.message).toContain("String should have at most 20 characters");
    expect(report.message).toContain("Input should be a valid boolean");
  });

  it("keeps the server's plain error text when the failure is not field-scoped", () => {
    const report = buildGuardrailCreateErrorReport(fastApiError("Guardrail already exists"), t);

    expect(report.problems).toEqual([]);
    expect(report.message).toContain("Guardrail already exists");
    expect(report.message).toContain("请检查");
  });

  it("still asks the operator to check the form when the error carries no message", () => {
    const report = buildGuardrailCreateErrorReport(undefined, t);

    expect(report.problems).toEqual([]);
    expect(report.message).toContain("创建护栏失败");
    expect(report.message).toContain("重试");
  });
});
