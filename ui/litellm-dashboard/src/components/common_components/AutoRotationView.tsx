import React from "react";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/components/shared/table_cells";
import { RefreshIcon, ClockIcon } from "@heroicons/react/outline";

interface AutoRotationViewProps {
  autoRotate?: boolean;
  rotationInterval?: string;
  lastRotationAt?: string;
  keyRotationAt?: string;
  nextRotationAt?: string;
  variant?: "card" | "inline";
  className?: string;
}

const AutoRotationView: React.FC<AutoRotationViewProps> = ({
  autoRotate = false,
  rotationInterval,
  lastRotationAt,
  keyRotationAt,
  nextRotationAt,
  variant = "card",
  className = "",
}) => {
  const { t } = useTranslation();

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  };

  const content = (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RefreshIcon className="h-4 w-4 text-info" />
          <p className="text-sm font-semibold text-foreground">
            {t("commonComponents.autoRotationView.title", { defaultValue: "Auto-Rotation" })}
          </p>
          <StatusBadge
            tone={autoRotate ? "success" : "neutral"}
            label={
              autoRotate
                ? t("common.enabled", { defaultValue: "Enabled" })
                : t("common.disabled", { defaultValue: "Disabled" })
            }
          />
          {autoRotate && rotationInterval && (
            <>
              <p className="text-sm text-muted-foreground">•</p>
              <p className="text-sm text-muted-foreground">
                {t("commonComponents.autoRotationView.every", {
                  interval: rotationInterval,
                  defaultValue: "Every {{interval}}",
                })}
              </p>
            </>
          )}
        </div>
      </div>

      {(autoRotate || lastRotationAt || keyRotationAt || nextRotationAt) && (
        <div className="space-y-3">
          {lastRotationAt && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-3">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t("commonComponents.autoRotationView.lastRotation", { defaultValue: "Last Rotation" })}
                </p>
                <p className="text-sm text-muted-foreground">{formatTimestamp(lastRotationAt)}</p>
              </div>
            </div>
          )}

          {(keyRotationAt || nextRotationAt) && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-3">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t("commonComponents.autoRotationView.nextScheduledRotation", {
                    defaultValue: "Next Scheduled Rotation",
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatTimestamp(nextRotationAt || keyRotationAt || "")}
                </p>
              </div>
            </div>
          )}

          {autoRotate && !lastRotationAt && !keyRotationAt && !nextRotationAt && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-3">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("commonComponents.autoRotationView.noRotationHistory", {
                  defaultValue: "No rotation history available",
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {!autoRotate && !lastRotationAt && !keyRotationAt && !nextRotationAt && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted p-3">
          <RefreshIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("commonComponents.autoRotationView.notEnabled", {
              defaultValue: "Auto-rotation is not enabled for this key",
            })}
          </p>
        </div>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>
        <div className="mb-6 flex items-center gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("commonComponents.autoRotationView.title", { defaultValue: "Auto-Rotation" })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("commonComponents.autoRotationView.subtitle", {
                defaultValue: "Automatic key rotation settings and status for this key",
              })}
            </p>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <p className="mb-3 text-sm font-medium text-foreground">
        {t("commonComponents.autoRotationView.title", { defaultValue: "Auto-Rotation" })}
      </p>
      {content}
    </div>
  );
};

export default AutoRotationView;
