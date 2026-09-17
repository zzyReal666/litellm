import React, { useState } from "react";
import { CircleHelp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PREDEFINED_INTERVALS = ["7d", "30d", "90d", "180d", "365d"] as const;

interface IntervalLabel {
  key: string;
  label: string;
}

const INTERVAL_LABELS: Record<string, IntervalLabel> = {
  "7d": { key: "commonComponents.keyLifecycleSettings.sevenDays", label: "7 days" },
  "30d": { key: "commonComponents.keyLifecycleSettings.thirtyDays", label: "30 days" },
  "90d": { key: "commonComponents.keyLifecycleSettings.ninetyDays", label: "90 days" },
  "180d": { key: "commonComponents.keyLifecycleSettings.oneHundredEightyDays", label: "180 days" },
  "365d": { key: "commonComponents.keyLifecycleSettings.threeHundredSixtyFiveDays", label: "365 days" },
  custom: { key: "commonComponents.keyLifecycleSettings.customInterval", label: "Custom interval" },
};

const intervalLabelText = (t: TFunction, interval: string): string => {
  const entry = INTERVAL_LABELS[interval];
  return entry ? t(entry.key, { defaultValue: entry.label }) : interval;
};

interface KeyLifecycleSettingsProps {
  value?: string;
  onChange?: (value: string) => void;
  autoRotationEnabled: boolean;
  onAutoRotationChange: (enabled: boolean) => void;
  rotationInterval: string;
  onRotationIntervalChange: (interval: string) => void;
  isCreateMode?: boolean;
  neverExpire?: boolean;
  onNeverExpireChange?: (checked: boolean) => void;
  id?: string;
}

const hintIcon = (hint: string): React.ReactNode => (
  <Tooltip>
    <TooltipTrigger
      render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />}
      aria-label={hint}
    />
    <TooltipContent>{hint}</TooltipContent>
  </Tooltip>
);

const KeyLifecycleSettings: React.FC<KeyLifecycleSettingsProps> = ({
  value,
  onChange,
  autoRotationEnabled,
  onAutoRotationChange,
  rotationInterval,
  onRotationIntervalChange,
  isCreateMode = false,
  neverExpire = false,
  onNeverExpireChange,
  id,
}) => {
  const { t } = useTranslation();
  const isCustomInterval = Boolean(rotationInterval) && !PREDEFINED_INTERVALS.includes(rotationInterval as never);

  const [showCustomInput, setShowCustomInput] = useState(isCustomInterval);
  const [customInterval, setCustomInterval] = useState(isCustomInterval ? rotationInterval : "");

  const durationId = id ?? "key-lifecycle-duration";

  const handleIntervalChange = (next: string) => {
    if (next === "custom") {
      setShowCustomInput(true);
      return;
    }
    setShowCustomInput(false);
    setCustomInterval("");
    onRotationIntervalChange(next);
  };

  const handleCustomIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInterval(event.target.value);
    onRotationIntervalChange(event.target.value);
  };

  const handleNeverExpireChange = (checked: boolean) => {
    onNeverExpireChange?.(checked);
    if (checked) {
      onChange?.("");
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="space-y-4">
          <span className="text-sm font-medium text-foreground">
            {t("commonComponents.keyLifecycleSettings.keyExpirySectionTitle", { defaultValue: "Key Expiry Settings" })}
          </span>

          <div className="space-y-2">
            <div className="flex items-center space-x-1 text-sm font-medium text-foreground">
              <label htmlFor={durationId}>
                {t("commonComponents.keyLifecycleSettings.expireKeyLabel", { defaultValue: "Expire Key" })}
              </label>
              {hintIcon(
                t("commonComponents.keyLifecycleSettings.expireKeyTooltip", {
                  defaultValue:
                    "Set when this key should expire. Format: 30s (seconds), 30m (minutes), 30h (hours), 30d (days). Leave empty to keep the current expiry unchanged.",
                }),
              )}
              {!isCreateMode && onNeverExpireChange && (
                <span className="ml-2 flex items-center gap-2 text-sm font-normal text-muted-foreground">
                  <Checkbox
                    id={`${durationId}-never-expire`}
                    checked={neverExpire}
                    onCheckedChange={handleNeverExpireChange}
                  />
                  <label htmlFor={`${durationId}-never-expire`} className="cursor-pointer">
                    {t("commonComponents.keyLifecycleSettings.neverExpire", { defaultValue: "Never Expire" })}
                  </label>
                </span>
              )}
            </div>
            <Input
              id={durationId}
              value={value ?? ""}
              onChange={(event) => onChange?.(event.target.value)}
              placeholder={
                isCreateMode
                  ? t("commonComponents.keyLifecycleSettings.expireKeyPlaceholderCreate", {
                      defaultValue: "e.g., 30d or leave empty to never expire",
                    })
                  : t("commonComponents.keyLifecycleSettings.expireKeyPlaceholderEdit", { defaultValue: "e.g., 30d" })
              }
              className="w-full"
              disabled={!isCreateMode && neverExpire}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <span className="text-sm font-medium text-foreground">
            {t("commonComponents.keyLifecycleSettings.autoRotationSectionTitle", {
              defaultValue: "Auto-Rotation Settings",
            })}
          </span>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center space-x-1 text-sm font-medium text-foreground">
                <span>
                  {t("commonComponents.keyLifecycleSettings.enableAutoRotationLabel", {
                    defaultValue: "Enable Auto-Rotation",
                  })}
                </span>
                {hintIcon(
                  t("commonComponents.keyLifecycleSettings.enableAutoRotationTooltip", {
                    defaultValue: "Key will automatically regenerate at the specified interval for enhanced security.",
                  }),
                )}
              </label>
              <Switch checked={autoRotationEnabled} onCheckedChange={onAutoRotationChange} />
            </div>

            {autoRotationEnabled && (
              <div className="space-y-2">
                <label className="flex items-center space-x-1 text-sm font-medium text-foreground">
                  <span>
                    {t("commonComponents.keyLifecycleSettings.rotationIntervalLabel", {
                      defaultValue: "Rotation Interval",
                    })}
                  </span>
                  {hintIcon(
                    t("commonComponents.keyLifecycleSettings.rotationIntervalTooltip", {
                      defaultValue:
                        "How often the key should be automatically rotated. Choose the interval that best fits your security requirements.",
                    }),
                  )}
                </label>
                <div className="space-y-2">
                  <Select
                    value={showCustomInput ? "custom" : rotationInterval || null}
                    onValueChange={(next: string | null) => next !== null && handleIntervalChange(next)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("commonComponents.keyLifecycleSettings.selectInterval", {
                          defaultValue: "Select interval",
                        })}
                      >
                        {(selected: string | null) =>
                          selected === null ? (
                            t("commonComponents.keyLifecycleSettings.selectInterval", {
                              defaultValue: "Select interval",
                            })
                          ) : (
                            <span title={intervalLabelText(t, selected)}>{intervalLabelText(t, selected)}</span>
                          )
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_INTERVALS.map((interval) => (
                        <SelectItem key={interval} value={interval} title={intervalLabelText(t, interval)}>
                          {intervalLabelText(t, interval)}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" title={intervalLabelText(t, "custom")}>
                        {intervalLabelText(t, "custom")}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {showCustomInput && (
                    <div className="space-y-1">
                      <Input
                        value={customInterval}
                        onChange={handleCustomIntervalChange}
                        placeholder={t("commonComponents.keyLifecycleSettings.customIntervalPlaceholder", {
                          defaultValue: "e.g., 1s, 5m, 2h, 14d",
                        })}
                      />
                      <div className="text-xs text-muted-foreground">
                        {t("commonComponents.keyLifecycleSettings.customIntervalFormats", {
                          defaultValue: "Supported formats: seconds (s), minutes (m), hours (h), days (d)",
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {autoRotationEnabled && (
            <div className="rounded-md bg-info/10 p-3 text-sm text-info">
              {t("commonComponents.keyLifecycleSettings.rotationNotice", {
                defaultValue:
                  "When rotation occurs, you'll receive a notification with the new key. The old key will be deactivated after a brief grace period.",
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default KeyLifecycleSettings;
