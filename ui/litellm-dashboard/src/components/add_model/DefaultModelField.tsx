import i18n from "@/lib/i18n";
import React from "react";
import { Info } from "lucide-react";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import { isForecastClassifier } from "./forecast_classifier_config";
import { resolveComplexityDefaultModel } from "./tier_rows";

interface DefaultModelFieldProps {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  modelOptions: { value: string; label: string }[];
}

const defaultModelPlaceholderFor = (derivedDefaultModel: string | undefined, isCustomSet: boolean): string => {
  if (derivedDefaultModel)
    return i18n.t("modelsEndpoints.DefaultModelField.derivedFromTiers", {
      model: derivedDefaultModel,
      defaultValue: "Derived from tiers: {{model}}",
    });
  return isCustomSet ? "Add a model to your fallback tier" : "Add a model to the Simple or Medium tier";
};

const DefaultModelField = ({ value, onChange, modelOptions }: DefaultModelFieldProps) => {
  const defaultModelPlaceholder = defaultModelPlaceholderFor(
    resolveComplexityDefaultModel(value),
    Boolean(value.custom_tier_set),
  );
  // Clearing the select drops the key entirely rather than storing "", so an emptied pin reads as
  // "track the tiers" everywhere downstream instead of as a blank model name.
  const handleDefaultModelChange = (model: string | null | undefined) => {
    onChange({ ...value, default_model: model || undefined });
  };

  return (
    <div className="mt-4 mb-2" role="group" aria-label={i18n.t("addModel.addAutoRouterTab.defaultModelConfigAria", { defaultValue: "Default model configuration" })}>
      <div className="flex items-center gap-2 mb-2">
        <strong className="text-base font-semibold">{i18n.t("addModel.addAutoRouterTab.defaultModelLabel", { defaultValue: "Default Model" })}</strong>
        <SimpleTooltip content={i18n.t("addModel.complexityRouterConfig.defaultModelTooltip", { defaultValue: "Leave empty to follow the tiers. A model chosen here is pinned: it stays the default however the tiers change." })}>
          <Info className="size-4 text-muted-foreground" />
        </SimpleTooltip>
      </div>
      <SearchSelect
        options={modelOptions}
        value={value.default_model ?? ""}
        onValueChange={handleDefaultModelChange}
        placeholder={defaultModelPlaceholder}
        emptyText={i18n.t("viewLogs.filterOptions.noModelsFoundLabel", { defaultValue: "No models found" })}
        aria-label={i18n.t("addModel.addAutoRouterTab.defaultModelLabel", { defaultValue: "Default Model" })}
      />
      <span className="block mt-1 text-xs text-muted-foreground">
        {isForecastClassifier(value.classifier_type)
          ? "Used when routing cannot find a suitable model. Classifier failures route to the capable solver."
          : 'Used when the tier the request lands in has no model, and when the classifier fails with "Route to the default model" selected.'}
      </span>
    </div>
  );
};

export default DefaultModelField;
