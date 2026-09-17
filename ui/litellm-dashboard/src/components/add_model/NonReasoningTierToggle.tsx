import React from "react";
import { useTranslation } from "react-i18next";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const NonReasoningTierToggle: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  available: boolean;
}> = ({ value, onChange, available }) => {
  const { t } = useTranslation();
  const handleToggle = (enabled: boolean): void => {
    const { NON_REASONING: existingPool, ...keptTiers } = value.tiers;
    // Turning it off must also release the plan-mode floor, which the backend rejects while it
    // names an inactive tier. An orphaned keyword rule is left for the save gate to name.
    const next: ComplexityRouterConfigValue = enabled
      ? { ...value, enable_non_reasoning_tier: true, tiers: { ...keptTiers, NON_REASONING: existingPool ?? [] } }
      : {
          ...value,
          enable_non_reasoning_tier: undefined,
          tiers: keptTiers,
          plan_mode_min_tier: value.plan_mode_min_tier === "NON_REASONING" ? undefined : value.plan_mode_min_tier,
        };
    onChange(next);
  };
  const toggleLabel = t("addModel.nonReasoningTier.addLabel", { defaultValue: "Add a non-reasoning tier" });

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.enable_non_reasoning_tier === true}
          disabled={!available}
          onCheckedChange={handleToggle}
          aria-label={toggleLabel}
        />
        <strong className="font-semibold">{toggleLabel}</strong>
      </div>
      <span className="block text-xs text-muted-foreground">
        {t("addModel.nonReasoningTier.addHint", {
          defaultValue:
            "Adds NON_REASONING below Simple, for operational agent traffic that relays or reformats information rather than reasoning about it. Escalation still moves up out of it when a request needs more.",
        })}
        {!available &&
          t("addModel.nonReasoningTier.requiresLlmClassifier", {
            defaultValue: " Requires the LLM classification method.",
          })}
      </span>
      <Separator className="my-4" />
    </>
  );
};

export default NonReasoningTierToggle;
