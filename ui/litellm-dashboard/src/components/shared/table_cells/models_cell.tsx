"use client";

import { deriveKeyModelScope } from "@/components/key_scope";
import { getModelDisplayName } from "@/components/key_team_helpers/fetch_available_models_team_key";
import { Badge } from "@/components/ui/badge";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { CellTooltip } from "./cell_tooltip";

interface ModelsCellProps {
  models: string[] | null | undefined;
  maxVisible?: number;
  allowedRoutes?: string[] | null;
  keyType?: string | null;
}

const WILDCARD_MODEL = "all-proxy-models";

const formatModel = (model: string, t: TFunction): string => {
  if (model === WILDCARD_MODEL) {
    return t("shared.modelsCell.allProxyModels", { defaultValue: "All Proxy Models" });
  }
  const name = getModelDisplayName(model);
  return name.length > 30 ? `${name.slice(0, 30)}...` : name;
};

export function ModelsCell({ models, maxVisible = 3, allowedRoutes, keyType }: ModelsCellProps) {
  const { t } = useTranslation();
  if (!Array.isArray(models) || models.length === 0) {
    const scope = deriveKeyModelScope(allowedRoutes, keyType);
    if (!scope.hasModelAccess) {
      const scopeLabel = t(scope.labelKey, { defaultValue: scope.label });
      return (
        <CellTooltip
          content={t("shared.modelsCell.scopedToRoutes", {
            routes: scopeLabel,
            defaultValue: "Scoped to {{routes}} routes; this key cannot call any models",
          })}
          trigger={
            <Badge variant="secondary" className="cursor-default">
              {t("shared.modelsCell.noModelAccess", { defaultValue: "No model access" })}
            </Badge>
          }
        />
      );
    }
    return (
      <Badge variant="secondary">{t("shared.modelsCell.allProxyModels", { defaultValue: "All Proxy Models" })}</Badge>
    );
  }

  const visible = models.slice(0, maxVisible);
  const overflow = models.slice(maxVisible);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((model, index) => (
        <Badge key={index} variant={model === WILDCARD_MODEL ? "secondary" : "outline"}>
          {formatModel(model, t)}
        </Badge>
      ))}
      {overflow.length > 0 && (
        <CellTooltip
          content={
            <div className="flex max-w-[280px] flex-col gap-0.5">
              {overflow.map((model, index) => (
                <span key={index}>{formatModel(model, t)}</span>
              ))}
            </div>
          }
          trigger={
            <Badge variant="outline" className="cursor-default">
              {t("shared.modelsCell.moreModels", { count: overflow.length, defaultValue: "+{{count}} more" })}
            </Badge>
          }
        />
      )}
    </div>
  );
}
