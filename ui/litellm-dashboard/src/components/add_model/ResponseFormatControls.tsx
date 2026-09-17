import { Switch } from "@/components/ui/switch";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const ResponseFormatControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const rawModelNameLabel = t("addModel.responseFormat.returnRawModelNameLabel", {
    defaultValue: "Return raw model name",
  });
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.return_raw_model_name ?? false}
          onCheckedChange={(returnRawModelName) => onChange({ ...value, return_raw_model_name: returnRawModelName })}
          aria-label={rawModelNameLabel}
        />
        <strong className="font-semibold">{rawModelNameLabel}</strong>
      </div>
      <span className="block text-xs text-muted-foreground">
        {t("addModel.responseFormat.returnRawModelNameHint", {
          defaultValue: "Return the resolved underlying model name in responses instead of the autorouter alias.",
        })}
      </span>
    </>
  );
};

export default ResponseFormatControls;
