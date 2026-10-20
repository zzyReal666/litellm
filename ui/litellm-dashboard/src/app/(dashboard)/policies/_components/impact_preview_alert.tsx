import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

interface ImpactResult {
  affected_keys_count: number;
  affected_teams_count: number;
  sample_keys: string[];
  sample_teams: string[];
}

interface ImpactPreviewAlertProps {
  impactResult: ImpactResult;
}

interface SampleListProps {
  label: string;
  samples: string[];
  totalCount: number;
}

const SampleList: React.FC<SampleListProps> = ({ label, samples, totalCount }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <span className="text-xs text-muted-foreground">{label} </span>
      {samples.slice(0, 5).map((sample) => (
        <Badge key={sample} variant="outline">
          {sample}
        </Badge>
      ))}
      {totalCount > 5 && (
        <span className="text-xs text-muted-foreground">
          {t("policies.impactPreviewAlert.andMore", {
            count: totalCount - 5,
            defaultValue: "and {{count}} more...",
          })}
        </span>
      )}
    </div>
  );
};

const ImpactPreviewAlert: React.FC<ImpactPreviewAlertProps> = ({ impactResult }) => {
  const { t } = useTranslation();
  const isGlobal = impactResult.affected_keys_count === -1;

  return (
    <Alert className="mb-4">
      {isGlobal ? <AlertTriangle /> : <Info />}
      <AlertTitle>{t("policies.impactPreviewAlert.message", { defaultValue: "Impact Preview" })}</AlertTitle>
      <AlertDescription>
        {isGlobal ? (
          <span>
            <Trans
              i18nKey="policies.impactPreviewAlert.globalScopeDesc"
              defaults="Global scope — this will affect <strong>all keys and teams</strong>."
              components={{ strong: <strong /> }}
            />
          </span>
        ) : (
          <div>
            <span>
              This attachment would affect{" "}
              <strong>
                {impactResult.affected_keys_count}{" "}
                {t("policies.impactPreviewAlert.keyWord", {
                  count: impactResult.affected_keys_count,
                  defaultValue: "keys",
                })}
              </strong>{" "}
              and{" "}
              <strong>
                {impactResult.affected_teams_count}{" "}
                {t("policies.impactPreviewAlert.teamWord", {
                  count: impactResult.affected_teams_count,
                  defaultValue: "teams",
                })}
              </strong>
              .
            </span>
            {impactResult.sample_keys.length > 0 && (
              <SampleList
                label={t("policies.impactPreviewAlert.keysLabel", { defaultValue: "Keys:" })}
                samples={impactResult.sample_keys}
                totalCount={impactResult.affected_keys_count}
              />
            )}
            {impactResult.sample_teams.length > 0 && (
              <SampleList
                label={t("policies.impactPreviewAlert.teamsLabel", { defaultValue: "Teams:" })}
                samples={impactResult.sample_teams}
                totalCount={impactResult.affected_teams_count}
              />
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ImpactPreviewAlert;
