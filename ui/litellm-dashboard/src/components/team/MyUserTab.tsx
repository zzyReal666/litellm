import { formatBudgetReset } from "@/utils/budgetUtils";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CircleHelp } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useMyTeamMember } from "./useMyTeamMember";

interface MyUserTabProps {
  teamId: string;
}

const labelWithTooltip = (label: string, tooltip: string, ariaLabel: string) => (
  <span className="flex items-center gap-1 text-muted-foreground">
    {label}
    <SimpleTooltip content={tooltip}>
      <CircleHelp className="size-4" aria-label={ariaLabel} />
    </SimpleTooltip>
  </span>
);

const formatNumber = (value: number | null | undefined, digits = 4): string => {
  if (value === null || value === undefined) return "0";
  return formatNumberWithCommas(value, digits);
};

const formatRateLimit = (value: number | null | undefined, unlimited: string): string => {
  if (value === null || value === undefined) return unlimited;
  return formatNumberWithCommas(value, 0);
};

export default function MyUserTab({ teamId }: MyUserTabProps) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useMyTeamMember(teamId);
  const unlimited = t("teamPage.myUserTab.unlimited", { defaultValue: "Unlimited" });
  const labelInfoAria = (label: string) =>
    t("teamPage.myUserTab.labelInfoAria", { label, defaultValue: "{{label}} information" });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground">
          {t("teamPage.myUserTab.loadingText", { defaultValue: "Loading your membership info…" })}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-destructive">
          {error instanceof Error
            ? error.message
            : t("teamPage.myUserTab.errorFallback", {
                defaultValue: "Failed to load your membership info for this team.",
              })}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-muted-foreground">
          {t("teamPage.myUserTab.noDataText", {
            defaultValue: "No membership info available for the current user in this team.",
          })}
        </CardContent>
      </Card>
    );
  }

  const budgetTable = data.litellm_budget_table ?? null;
  const maxBudget = budgetTable?.max_budget ?? null;
  const spend = data.spend ?? 0;
  const totalSpend = data.total_spend ?? 0;
  const tpmLimit = budgetTable?.tpm_limit ?? null;
  const rpmLimit = budgetTable?.rpm_limit ?? null;
  const budgetReset = formatBudgetReset(budgetTable?.budget_reset_at);
  const allowedModels = budgetTable?.allowed_models ?? null;

  return (
    <div className="flex w-full flex-col gap-4">
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">
                {t("teamPage.myUserTab.userLabel", { defaultValue: "User" })}
              </span>
              <div className="mt-1 font-semibold">{data.user_email || data.user_id}</div>
              <span className="font-mono text-xs text-muted-foreground">{data.user_id}</span>
            </div>
            <div>
              <span className="text-muted-foreground">
                {t("teamPage.myUserTab.teamRoleLabel", { defaultValue: "Team Role" })}
              </span>
              <div className="mt-1">
                <Badge variant={data.role === "admin" ? "default" : "secondary"}>{data.role || "user"}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent>
            {labelWithTooltip(
              t("teamPage.myUserTab.currentCycleSpendLabel", { defaultValue: "Current Cycle Spend (USD)" }),
              t("teamPage.myUserTab.currentCycleSpendTooltip", {
                defaultValue: "Spend for the current budget cycle. Resets to $0 when the budget window rolls over.",
              }),
              labelInfoAria(
                t("teamPage.myUserTab.currentCycleSpendLabel", { defaultValue: "Current Cycle Spend (USD)" }),
              ),
            )}
            <div className="mt-2">
              <h3 className="text-2xl font-semibold">${formatNumber(spend, 4)}</h3>
              <span className="text-muted-foreground">
                {t("teamPage.myUserTab.ofBudget", {
                  budget: maxBudget === null ? unlimited : `$${formatNumber(maxBudget, 4)}`,
                  defaultValue: "of {{budget}}",
                })}
              </span>
            </div>
            {budgetReset && (
              <div className="mt-1 text-muted-foreground">
                {t("teamPage.myUserTab.resetsAt", { when: budgetReset, defaultValue: "Resets {{when}}" })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {labelWithTooltip(
              t("teamPage.myUserTab.rateLimitsLabel", { defaultValue: "Rate Limits" }),
              t("teamPage.myUserTab.rateLimitsTooltip", {
                defaultValue: "Your per-member rate limits within this team.",
              }),
              labelInfoAria(t("teamPage.myUserTab.rateLimitsLabel", { defaultValue: "Rate Limits" })),
            )}
            <div className="mt-2">
              <span>
                {t("teamPage.myUserTab.tpmValue", {
                  value: formatRateLimit(tpmLimit, unlimited),
                  defaultValue: "TPM: {{value}}",
                })}
              </span>
              <br />
              <span>
                {t("teamPage.myUserTab.rpmValue", {
                  value: formatRateLimit(rpmLimit, unlimited),
                  defaultValue: "RPM: {{value}}",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {labelWithTooltip(
              t("teamPage.myUserTab.totalSpendLabel", { defaultValue: "Total Spend (USD)" }),
              t("teamPage.myUserTab.totalSpendTooltip", {
                defaultValue: "Cumulative spend across all budget cycles within this team.",
              }),
              labelInfoAria(t("teamPage.myUserTab.totalSpendLabel", { defaultValue: "Total Spend (USD)" })),
            )}
            <h4 className="mt-2 text-xl font-semibold">${formatNumber(totalSpend, 4)}</h4>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {labelWithTooltip(
              t("teamPage.myUserTab.modelScopeLabel", { defaultValue: "Model Scope" }),
              t("teamPage.myUserTab.modelScopeTooltip", { defaultValue: "Models you can access within this team." }),
              labelInfoAria(t("teamPage.myUserTab.modelScopeLabel", { defaultValue: "Model Scope" })),
            )}
            <div className="mt-2">
              {allowedModels && allowedModels.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {allowedModels.map((m) => (
                    <Badge key={m} variant="secondary">
                      {m}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span>{t("teamPage.myUserTab.allTeamModels", { defaultValue: "All Team Models" })}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
