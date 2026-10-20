import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/lib/i18n";

import { deriveKeyModelScope } from "./key_scope";

const FULL_ACCESS = { hasModelAccess: true, labelKey: null, label: null };
const SCIM = { hasModelAccess: false, labelKey: "keyScope.scim", label: "SCIM" };
const MANAGEMENT = { hasModelAccess: false, labelKey: "keyScope.management", label: "Management" };
const READ_ONLY = { hasModelAccess: false, labelKey: "keyScope.readOnly", label: "Read-only" };

describe("deriveKeyModelScope", () => {
  it("treats unrestricted keys (null/empty allowed_routes) as full model access", () => {
    expect(deriveKeyModelScope(null)).toEqual(FULL_ACCESS);
    expect(deriveKeyModelScope(undefined)).toEqual(FULL_ACCESS);
    expect(deriveKeyModelScope([])).toEqual(FULL_ACCESS);
  });

  it("classifies SCIM keys as no model access", () => {
    expect(deriveKeyModelScope(["/scim/*"])).toEqual(SCIM);
    expect(deriveKeyModelScope(["/scim/v2/Users", "/scim/v2/Groups"])).toEqual(SCIM);
  });

  it("classifies management-only keys as no model access", () => {
    expect(deriveKeyModelScope(["management_routes"])).toEqual(MANAGEMENT);
  });

  it("classifies read-only keys as no model access", () => {
    expect(deriveKeyModelScope(["info_routes"])).toEqual(READ_ONLY);
  });

  it("leaves LLM-API and custom scopes with model access (default rendering)", () => {
    expect(deriveKeyModelScope(["llm_api_routes"])).toEqual(FULL_ACCESS);
    expect(deriveKeyModelScope(["/chat/completions"])).toEqual(FULL_ACCESS);
    expect(deriveKeyModelScope(["management_routes", "llm_api_routes"])).toEqual(FULL_ACCESS);
  });

  it("prefers a persisted key_type over allowed_routes for the no-inference buckets", () => {
    expect(deriveKeyModelScope([], "management")).toEqual(MANAGEMENT);
    expect(deriveKeyModelScope([], "read_only")).toEqual(READ_ONLY);
    expect(deriveKeyModelScope(["some_future_mgmt_preset"], "management")).toEqual(MANAGEMENT);
  });

  it("falls back to allowed_routes for null/default/llm_api key_type", () => {
    expect(deriveKeyModelScope(["/scim/*"], null)).toEqual(SCIM);
    expect(deriveKeyModelScope(["/scim/*"], "default")).toEqual(SCIM);
    expect(deriveKeyModelScope([], "default")).toEqual(FULL_ACCESS);
    expect(deriveKeyModelScope([], "llm_api")).toEqual(FULL_ACCESS);
  });
});

describe("key scope labels", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  const scopedLabels = () =>
    [
      deriveKeyModelScope(["management_routes"]),
      deriveKeyModelScope(["info_routes"]),
      deriveKeyModelScope(["/scim/*"]),
    ].map((scope) => {
      if (scope.hasModelAccess) {
        throw new Error("expected a scope without model access");
      }
      return { labelKey: scope.labelKey, label: scope.label };
    });

  it("uses the English label as the catalog value", () => {
    for (const { labelKey, label } of scopedLabels()) {
      expect(i18n.getResource("en", "translation", labelKey)).toBe(label);
    }
  });

  it("resolves every scope label from the Chinese catalog", async () => {
    await i18n.changeLanguage("zh-CN");

    expect(scopedLabels().map(({ labelKey, label }) => i18n.t(labelKey, { defaultValue: label }))).toEqual([
      "管理",
      "只读",
      "SCIM",
    ]);
  });
});
