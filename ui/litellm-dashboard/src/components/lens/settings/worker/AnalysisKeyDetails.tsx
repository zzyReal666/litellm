"use client";

import { Button } from "@/components/ui/button";
import i18n from "@/lib/i18n";
import { runTime } from "../../model/format";
import { useAnalysisKeyInfo } from "./useAnalysisKeyInfo";

function budgetLabel(amount: number | null, duration?: string | null): string {
  if (amount === null) return i18n.t("lens.analysisKey.noKeyBudget", { defaultValue: "No key budget" });
  const periods: Record<string, string> = {
    "1mo": i18n.t("' + A + '.period.month", { defaultValue: "month" }),
    "30d": i18n.t("' + A + '.period.month", { defaultValue: "month" }),
    "1d": i18n.t("' + A + '.period.day", { defaultValue: "day" }),
    "24h": i18n.t("' + A + '.period.day", { defaultValue: "day" }),
    "7d": i18n.t("' + A + '.period.week", { defaultValue: "week" }),
    "1h": i18n.t("' + A + '.period.hour", { defaultValue: "hour" }),
  };
  const dollars = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CNY", currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  }).format(amount);
  return duration
    ? i18n.t("lens.analysisKey.amountPerPeriod", { defaultValue: "{{amount}} / {{period}}", amount: dollars, period: periods[duration] ?? duration })
    : i18n.t("lens.analysisKey.amountTotal", { defaultValue: "{{amount}} total", amount: dollars });
}

function modelsLabel(models: readonly string[]): string {
  return models.length ? models.join(", ") : i18n.t("lens.analysisKey.allModels", { defaultValue: "All models" });
}

export function AnalysisKeySummary({ keyId }: { keyId: string }) {
  const key = useAnalysisKeyInfo(keyId);
  if (key.isLoading)
    return <p className="text-xs text-muted-foreground">{i18n.t("' + A + '.loadingBillingKey", { defaultValue: "Loading billing key…" })}</p>;
  if (key.error || !key.data)
    return (
      <p role="alert" className="flex items-center gap-2 text-xs text-destructive">
        {i18n.t("' + A + '.billingKeyFailed", { defaultValue: "Could not load billing key" })}
        <Button variant="link" size="xs" className="h-auto p-0" onClick={() => void key.refetch()}>
          {i18n.t("common.retry", { defaultValue: "Retry" })}
        </Button>
      </p>
    );
  const info = key.data;
  const summary = [
    i18n.t("lens.analysisKey.billsTo", { defaultValue: "Bills to {{name}}", name: info.key_alias || i18n.t("lens.analysisKey.assignedVirtualKey", { defaultValue: "an assigned virtual key" }) }),
    modelsLabel(info.models),
    budgetLabel(info.max_budget, info.budget_duration),
  ].join(" · ");
  const inactive = info.status && info.status !== "active";
  return (
    <p className="truncate text-xs text-muted-foreground">
      {summary}
      {inactive && <span className="text-destructive"> · {i18n.t("lens.analysisKey.keyStatus", { defaultValue: "Key {{status}}", status: info.status })}</span>}
    </p>
  );
}

export function AnalysisKeyDetails({ keyId }: { keyId: string }) {
  const key = useAnalysisKeyInfo(keyId);
  if (key.isLoading)
    return <p className="text-xs text-muted-foreground">{i18n.t("' + A + '.loadingPermissions", { defaultValue: "Loading key permissions…" })}</p>;
  if (key.error || !key.data)
    return (
      <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
        {i18n.t("' + A + '.permissionsFailed", { defaultValue: "Could not load key permissions" })}
        <Button variant="ghost" size="sm" onClick={() => void key.refetch()}>
          {i18n.t("common.retry", { defaultValue: "Retry" })}
        </Button>
      </div>
    );
  const info = key.data;
  return (
    <div className="space-y-2 text-sm">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2">
        <dt className="text-muted-foreground">{i18n.t("lens.analysisKey.modelsLabel", { defaultValue: "Models" })}</dt>
        <dd className="break-words">{modelsLabel(info.models)}</dd>
        <dt className="text-muted-foreground">{i18n.t("lens.analysisKey.keyLimit", { defaultValue: "Key limit" })}</dt>
        <dd>{budgetLabel(info.max_budget, info.budget_duration)}</dd>
      </dl>
      {info.status && info.status !== "active" && (
        <p role="alert" className="text-destructive">
          {i18n.t("' + A + '.inactiveKey", { defaultValue: "This key is {{status}}. Choose an active key.", status: info.status })}
        </p>
      )}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer">{i18n.t("lens.analysisKey.otherLimits", { defaultValue: "Other limits" })}</summary>
        <div className="mt-2 space-y-1 leading-5">
          <p>{i18n.t("lens.analysisKey.rpmLimit", { defaultValue: "Requests per minute: {{value}}", value: info.rpm_limit ?? i18n.t("lens.analysisKey.noKeyLimit", { defaultValue: "No key limit" }) })}</p>
          <p>{i18n.t("lens.analysisKey.tpmLimit", { defaultValue: "Tokens per minute: {{value}}", value: info.tpm_limit ?? i18n.t("lens.analysisKey.noKeyLimit", { defaultValue: "No key limit" }) })}</p>
          <p>{i18n.t("lens.analysisKey.expires", { defaultValue: "Expires: {{value}}", value: info.expires ? runTime(info.expires) : i18n.t("lens.analysisKey.noExpiry", { defaultValue: "No expiry" }) })}</p>
          <p>{i18n.t("lens.analysisKey.otherLimitsApply", { defaultValue: "Team, organization, and model limits still apply." })}</p>
        </div>
      </details>
    </div>
  );
}
