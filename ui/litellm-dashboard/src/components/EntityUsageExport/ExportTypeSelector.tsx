import React from "react";
import i18n from "@/lib/i18n";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ExportType, EntityType } from "./types";

interface ExportTypeSelectorProps {
  value: ExportType;
  onChange: (value: ExportType) => void;
  entityType: EntityType;
}

const entityLabel = (entityType: EntityType): string =>
  i18n.t(`entityUsageExport.entityTypes.${entityType}`, { defaultValue: entityType });

const ExportTypeSelector: React.FC<ExportTypeSelectorProps> = ({ value, onChange, entityType }) => {
  const entity = entityLabel(entityType);
  const allScopes: { value: ExportType; title: string; description: string }[] = [
    {
      value: "daily",
      title: i18n.t("entityUsageExport.typeSelector.dailyTitle", {
        defaultValue: "Day-by-day breakdown by {{entity}}",
        entity,
      }),
      description: i18n.t("entityUsageExport.typeSelector.dailyDescription", {
        defaultValue: "Daily metrics for each {{entity}}",
        entity,
      }),
    },
    {
      value: "daily_with_keys",
      title: i18n.t("entityUsageExport.typeSelector.dailyWithKeysTitle", {
        defaultValue: "Day-by-day breakdown by {{entity}} and key",
        entity,
      }),
      description: i18n.t("entityUsageExport.typeSelector.dailyWithKeysDescription", {
        defaultValue: "Daily metrics for each {{entity}}, split by API key",
        entity,
      }),
    },
    {
      value: "daily_with_models",
      title: i18n.t("entityUsageExport.typeSelector.dailyWithModelsTitle", {
        defaultValue: "Day-by-day by {{entity}} and model",
        entity,
      }),
      description: i18n.t("entityUsageExport.typeSelector.dailyWithModelsDescription", {
        defaultValue: "Daily metrics split by model",
      }),
    },
    {
      value: "daily_with_users",
      title: i18n.t("entityUsageExport.typeSelector.dailyWithUsersTitle", {
        defaultValue: "Day-by-day breakdown by {{entity}} and user",
        entity,
      }),
      description: i18n.t("entityUsageExport.typeSelector.dailyWithUsersDescription", {
        defaultValue: "Daily metrics for each {{entity}}, split by key owner",
        entity,
      }),
    },
  ];
  const scopes = allScopes.filter(
    (scope) => scope.value !== "daily_with_users" || entityType !== "user",
  );

  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">{i18n.t("exportTypeSelector.export-type", { defaultValue: "Export type" })}</label>
      <RadioGroup value={value} onValueChange={(next) => onChange(next as ExportType)} className="gap-2">
        {scopes.map((scope) => (
          <label
            key={scope.value}
            className="flex items-start p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
          >
            <RadioGroupItem value={scope.value} className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">{scope.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{scope.description}</div>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
};

export default ExportTypeSelector;
