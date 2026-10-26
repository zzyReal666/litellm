import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { hasRouterSettings } from "./routerSettingsPayload";

interface RouterSettingsSummaryProps {
  routerSettings: Record<string, unknown> | null | undefined;
  emptyText?: string;
}

const fallbackEntries = (fallbacks: unknown): Array<[string, string[]]> => {
  if (!Array.isArray(fallbacks)) return [];
  return fallbacks.flatMap((entry) =>
    entry && typeof entry === "object" ? (Object.entries(entry) as Array<[string, string[]]>) : [],
  );
};

export default function RouterSettingsSummary({ routerSettings, emptyText }: RouterSettingsSummaryProps) {
  const { t } = useTranslation();

  if (!hasRouterSettings(routerSettings)) {
    return (
      <div className="text-muted-foreground">
        {emptyText ?? t("teamPage.teamInfo.noRouterSettings", { defaultValue: "No router settings configured" })}
      </div>
    );
  }

  const settings = routerSettings as Record<string, unknown>;
  const fallbacks = fallbackEntries(settings.fallbacks);

  return (
    <div className="space-y-1 text-sm">
      {settings.routing_strategy != null && (
        <div>
          {t("routerSettings.summary.routingStrategy", { defaultValue: "Routing Strategy:" })}{" "}
          <Badge variant="secondary">{String(settings.routing_strategy)}</Badge>
        </div>
      )}
      {settings.num_retries != null && <div>{t("routerSettings.summary.numRetries", { defaultValue: "Number of Retries:" })} {String(settings.num_retries)}</div>}
      {settings.allowed_fails != null && <div>{t("routerSettings.summary.allowedFails", { defaultValue: "Allowed Failures:" })} {String(settings.allowed_fails)}</div>}
      {settings.cooldown_time != null && <div>{t("routerSettings.summary.cooldownTime", { defaultValue: "Cooldown Time:" })} {String(settings.cooldown_time)}s</div>}
      {settings.timeout != null && <div>{t("routerSettings.summary.timeout", { defaultValue: "Timeout:" })} {String(settings.timeout)}s</div>}
      {settings.retry_after != null && <div>{t("routerSettings.summary.retryAfter", { defaultValue: "Retry After:" })} {String(settings.retry_after)}s</div>}
      {Boolean(settings.enable_tag_filtering) && <div>{t("routerSettings.summary.tagFiltering", { defaultValue: "Tag Filtering:" })} {t("common.enabled", { defaultValue: "Enabled" })}</div>}
      {fallbacks.length > 0 && (
        <div>
          <div>{t("routerSettings.summary.fallbacks", { defaultValue: "Fallbacks:" })}</div>
          <div className="mt-1 space-y-1">
            {fallbacks.map(([model, targets]) => (
              <div key={model} className="text-xs text-muted-foreground">
                <span className="font-medium">{model}</span>
                <span className="mx-1 text-muted-foreground">-&gt;</span>
                {Array.isArray(targets) ? targets.join(", ") : String(targets)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
