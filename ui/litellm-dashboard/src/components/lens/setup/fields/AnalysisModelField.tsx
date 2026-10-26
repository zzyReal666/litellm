"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import i18n from "@/lib/i18n";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { analysisModelOptions, type ModelGate } from "./analysisModels";
import type { AnalysisModels } from "./useAnalysisModels";
import type { InvestigationInput } from "../investigationSchema";

export interface AnalysisModelFieldProps {
  readonly models: AnalysisModels;
  readonly gate: ModelGate;
}

export function AnalysisModelField({ models, gate }: AnalysisModelFieldProps) {
  const { control } = useFormContext<InvestigationInput>();
  const model = useWatch({ control, name: "selectedModel" });
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{i18n.t("analysisModelField.analysis-model", { defaultValue: "Analysis model" })}</p>
      <Controller
        control={control}
        name="selectedModel"
        render={({ field }) => (
          <SearchSelect
            aria-label={i18n.t("analysisModelField.analysis-model-2", { defaultValue: "Analysis model" })}
            options={analysisModelOptions(models.models, models.modelDetails)}
            value={field.value ?? ""}
            onValueChange={(value) => field.onChange(value ?? "")}
            placeholder={models.modelsLoading ? "Loading models…" : "Choose a model"}
            disabled={models.modelsLoading}
            emptyText="No matching models configured on this gateway"
          />
        )}
      />
      {models.modelsError && (
        <p role="alert" className="text-sm text-destructive">
          {i18n.t("analysisModelField.could-not-load-models", { defaultValue: "Could not load models:" })}{" "}{models.modelsError}
        </p>
      )}
      {gate.unavailable && (
        <p role="alert" className="text-sm text-destructive">
          {model} is no longer available. Choose another analysis model.{" "}</p>
      )}
      {gate.unsupported && (
        <p role="alert" className="text-sm text-destructive">
          {i18n.t("analysisModelField.choose-a-chat-model-that-supports-json-outpu", { defaultValue: "Choose a chat model that supports JSON output." })}{" "}</p>
      )}
    </div>
  );
}
