import i18n from "@/lib/i18n";

export const ACTION_ITEMS = [
  { value: "BLOCK", label: i18n.t("guardrails.keywordModal.actionBlock", { defaultValue: "Block" }) },
  { value: "MASK", label: i18n.t("guardrails.keywordModal.actionMask", { defaultValue: "Mask" }) },
] as const;

export const SEVERITY_ITEMS = [
  { value: "high", label: i18n.t("guardrails.contentCategoryConfiguration.severityHigh", { defaultValue: "High" }) },
  { value: "medium", label: i18n.t("guardrails.contentCategoryConfiguration.severityMedium", { defaultValue: "Medium" }) },
  { value: "low", label: i18n.t("guardrails.contentCategoryConfiguration.severityLow", { defaultValue: "Low" }) },
] as const;
