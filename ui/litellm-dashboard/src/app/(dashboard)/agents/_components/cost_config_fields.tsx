import React from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { AGENT_FORM_CONFIG, translateFieldText } from "./agent_config";
import { AgentFormField, labelWithHint } from "./AgentFormKit";

export const COST_FIELD_NAMES: readonly string[] = AGENT_FORM_CONFIG.cost.fields.map((field) => field.name);

const CostConfigFields: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      {AGENT_FORM_CONFIG.cost.fields.map((field) => (
        <AgentFormField
          key={field.name}
          name={field.name}
          label={
            field.tooltipKey && field.tooltip
              ? labelWithHint(
                  translateFieldText(t, field.labelKey, field.label),
                  translateFieldText(t, field.tooltipKey, field.tooltip),
                )
              : translateFieldText(t, field.labelKey, field.label)
          }
        >
          {({ value, onChange, ref, ...control }) => (
            <Input
              {...control}
              ref={ref}
              type="number"
              step="0.000001"
              placeholder={translateFieldText(t, field.placeholderKey, field.placeholder)}
              value={typeof value === "string" || typeof value === "number" ? value : ""}
              onChange={onChange}
            />
          )}
        </AgentFormField>
      ))}
    </>
  );
};

export default CostConfigFields;
