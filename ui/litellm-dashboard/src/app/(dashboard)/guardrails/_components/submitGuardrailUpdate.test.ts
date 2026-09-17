import { beforeEach, describe, expect, it, vi } from "vitest";

import * as networking from "@/components/networking";
import { toast } from "@/lib/toast";

import { buildGuardrailUpdateData, submitGuardrailUpdate } from "./submitGuardrailUpdate";

vi.mock("@/components/networking", () => ({
  updateGuardrailCall: vi.fn(),
}));

const guardrail = (litellmParams: Record<string, unknown> = {}) => ({
  guardrail_id: "gr-1",
  guardrail_name: "Test Guardrail",
  guardrail_info: null,
  litellm_params: { guardrail: "bedrock", mode: "pre_call", default_on: true, ...litellmParams },
});

const baseContext = (overrides: Record<string, unknown> = {}) => ({
  accessToken: "token",
  guardrailId: "gr-1",
  guardrailData: guardrail(),
  guardrailProviderSpecificParams: null,
  values: { guardrail_name: "Test Guardrail", default_on: true, guardrail_info: "" },
  selectedPiiEntities: [],
  selectedPiiActions: {},
  hasUnsavedContentFilterChanges: false,
  contentFilterData: { patterns: [], blockedWords: [], categories: [] },
  toolPermissionConfig: {
    rules: [],
    default_action: "deny" as const,
    on_disallowed_action: "block" as const,
    violation_message_template: "",
  },
  toolPermissionDirty: false,
  t: ((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key) as any,
  ...overrides,
});

const contextWith = (values: Record<string, unknown>, overrides: Record<string, unknown> = {}) =>
  baseContext({
    ...overrides,
    values: { guardrail_name: "Test Guardrail", default_on: true, guardrail_info: "", ...values },
  });

describe("buildGuardrailUpdateData", () => {
  it("sends nothing when the form matches the stored guardrail", () => {
    expect(buildGuardrailUpdateData(baseContext() as any)).toEqual({ guardrail_info: undefined });
  });

  it("sends nothing at all when the stored guardrail information matches the seeded textarea", () => {
    const context = contextWith({ guardrail_name: "" }) as any;
    context.guardrailData = { ...guardrail(), guardrail_name: "", guardrail_info: {} };
    context.values = { guardrail_name: "", default_on: true, guardrail_info: "{}" };

    expect(buildGuardrailUpdateData(context)).toBeNull();
  });

  it("sends only the renamed guardrail and drops the empty litellm_params object", () => {
    expect(buildGuardrailUpdateData(contextWith({ guardrail_name: "Renamed" }) as any)).toEqual({
      guardrail_name: "Renamed",
      guardrail_info: undefined,
    });
  });

  it("maps the tri-state skip choices onto explicit booleans and null", () => {
    expect(buildGuardrailUpdateData(contextWith({ skip_system_message_choice: "yes" }) as any)).toEqual({
      litellm_params: { skip_system_message_in_guardrail: true },
      guardrail_info: undefined,
    });

    expect(buildGuardrailUpdateData(contextWith({ skip_tool_message_choice: "no" }) as any)).toEqual({
      litellm_params: { skip_tool_message_in_guardrail: false },
      guardrail_info: undefined,
    });
  });
});

describe("submitGuardrailUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports no update and skips the API call when nothing changed", async () => {
    const context = contextWith({}) as any;
    context.guardrailData = { ...guardrail(), guardrail_name: "Test Guardrail", guardrail_info: {} };
    context.values = { guardrail_name: "Test Guardrail", default_on: true, guardrail_info: "{}" };

    const result = await submitGuardrailUpdate(context);

    expect(result).toEqual({ updated: false });
    expect(networking.updateGuardrailCall).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalled();
  });

  it("posts the changed payload and reports success", async () => {
    vi.mocked(networking.updateGuardrailCall).mockResolvedValue({ status: "success" });

    const result = await submitGuardrailUpdate(contextWith({ guardrail_name: "Renamed" }) as any);

    expect(result).toEqual({ updated: true });
    expect(networking.updateGuardrailCall).toHaveBeenCalledWith("token", "gr-1", { guardrail_name: "Renamed" });
    expect(toast.success).toHaveBeenCalled();
  });
});
