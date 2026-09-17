"use client";

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cva.config";

export const AUTOROUTER_CLASSIFIER_ORIGIN = "autorouter_classifier";

export function ClassifyTag({ origin, className }: { origin?: string | null; className?: string }) {
  const { t } = useTranslation();
  if (origin !== AUTOROUTER_CLASSIFIER_ORIGIN) return null;
  return (
    <Badge
      variant="secondary"
      title={t("viewLogs.classifyTag.tooltip", {
        defaultValue: "Tier classification call made by the auto-router, not a request the caller sent",
      })}
      className={cn("px-2 py-0 text-[10px] font-normal", className)}
    >
      {t("viewLogs.classifyTag.label", { defaultValue: "Classify" })}
    </Badge>
  );
}
