import { describe, expect, it } from "vitest";

import { providerParamsForUpdate } from "./providerParamsForUpdate";

const bedrockParams = {
  guardrailIdentifier: { description: "The guardrail id on Bedrock" },
  optional_params: {
    fields: {
      severity_threshold: { description: "Severity threshold" },
    },
  },
};

describe("providerParamsForUpdate", () => {
  it("collects root level and nested optional_params fields that changed", () => {
    expect(
      providerParamsForUpdate({
        formValues: { guardrailIdentifier: "gr-new", optional_params: { severity_threshold: 4 } },
        providerSpecificParams: bedrockParams,
        originalParams: { guardrailIdentifier: "gr-abc" },
      }),
    ).toEqual({ guardrailIdentifier: "gr-new", severity_threshold: 4 });
  });

  it("leaves out params that are unchanged and params the provider does not accept", () => {
    expect(
      providerParamsForUpdate({
        formValues: { guardrailIdentifier: "gr-abc", unrelated: "x" },
        providerSpecificParams: bedrockParams,
        originalParams: { guardrailIdentifier: "gr-abc" },
      }),
    ).toEqual({});
  });

  it("clears a stored value to null when no form field binds it", () => {
    expect(
      providerParamsForUpdate({
        formValues: {},
        providerSpecificParams: bedrockParams,
        originalParams: { guardrailIdentifier: "gr-abc" },
      }),
    ).toEqual({ guardrailIdentifier: null });
  });

  it("never forwards the content filter collections", () => {
    expect(
      providerParamsForUpdate({
        formValues: { patterns: ["a"], blocked_words: ["b"], categories: ["c"] },
        providerSpecificParams: { patterns: {}, blocked_words: {}, categories: {} },
        originalParams: {},
      }),
    ).toEqual({});
  });

  it("keeps a raw string a numeric input produced instead of normalising it", () => {
    expect(
      providerParamsForUpdate({
        formValues: { max_tokens: "5" },
        providerSpecificParams: { max_tokens: {} },
        originalParams: {},
      }),
    ).toEqual({ max_tokens: "5" });
  });
});
