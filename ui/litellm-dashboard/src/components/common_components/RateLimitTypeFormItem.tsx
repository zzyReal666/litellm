import React from "react";
import { CircleHelp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RateLimitType = "tpm" | "rpm";

interface RateLimitTypeOption {
  value: string;
  label: string;
  description: string;
}

interface RateLimitTypeFormItemProps {
  /** The type of rate limit - either 'tpm' or 'rpm' */
  type: RateLimitType;
  /** The form field name */
  name: string;
  /** Whether to show detailed descriptions (default: true) */
  showDetailedDescriptions?: boolean;
  /** Additional CSS classes */
  className?: string;
  value?: string | null;
  /** Custom onChange handler */
  onChange?: (value: string) => void;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: true | undefined;
  "aria-describedby"?: string | undefined;
}

const rateLimitTypeOptions = (type: RateLimitType, t: TFunction): RateLimitTypeOption[] => {
  const limitTypeUpper = type.toUpperCase();
  const limitTypeLower = type.toLowerCase();
  return [
    {
      value: "best_effort_throughput",
      label: t("common.default", { defaultValue: "Default" }),
      description: t("commonComponents.rateLimitTypeFormItem.bestEffortDesc", {
        limitTypeLower,
        defaultValue: `Best effort throughput - no error if we're overallocating ${limitTypeLower} (Team/Key Limits checked at runtime).`,
      }),
    },
    {
      value: "guaranteed_throughput",
      label: t("commonComponents.rateLimitTypeFormItem.guaranteedThroughput", {
        defaultValue: "Guaranteed throughput",
      }),
      description: t("commonComponents.rateLimitTypeFormItem.guaranteedThroughputDesc", {
        limitTypeLower,
        defaultValue: `Guaranteed throughput - raise an error if we're overallocating ${limitTypeLower} (also checks model-specific limits)`,
      }),
    },
    {
      value: "dynamic",
      label: t("commonComponents.rateLimitTypeFormItem.dynamic", { defaultValue: "Dynamic" }),
      description: t("commonComponents.rateLimitTypeFormItem.dynamicDesc", {
        limitTypeUpper,
        defaultValue: `If the key has a set ${limitTypeUpper} (e.g. 2 ${limitTypeUpper}) and there are no 429 errors, it can dynamically exceed the limit when the model being called is not erroring.`,
      }),
    },
  ];
};

interface PlainLabel {
  key: string;
  label: string;
}

const plainLabels: Record<string, PlainLabel> = {
  best_effort_throughput: {
    key: "commonComponents.rateLimitTypeFormItem.bestEffortThroughput",
    label: "Best effort throughput",
  },
  guaranteed_throughput: {
    key: "commonComponents.rateLimitTypeFormItem.guaranteedThroughput",
    label: "Guaranteed throughput",
  },
  dynamic: { key: "commonComponents.rateLimitTypeFormItem.dynamic", label: "Dynamic" },
};

const plainLabelText = (t: TFunction, value: string): string | undefined => {
  const entry = plainLabels[value];
  return entry ? t(entry.key, { defaultValue: entry.label }) : undefined;
};

const rateLimitTypeLabelText = (t: TFunction, type: RateLimitType): string =>
  t("commonComponents.rateLimitTypeFormItem.label", {
    limitTypeUpper: type.toUpperCase(),
    defaultValue: `${type.toUpperCase()} Rate Limit Type`,
  });

const rateLimitTypeTooltip = (t: TFunction, type: RateLimitType): string =>
  t("commonComponents.rateLimitTypeFormItem.tooltip", {
    limitTypeUpper: type.toUpperCase(),
    defaultValue: `Select 'guaranteed_throughput' to prevent overallocating ${type.toUpperCase()} limit when the key belongs to a Team with specific ${type.toUpperCase()} limits.`,
  });

export const RateLimitTypeFormItem: React.FC<RateLimitTypeFormItemProps> = ({
  type,
  name,
  showDetailedDescriptions = true,
  className = "",
  value,
  onChange,
  id,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}) => {
  const { t } = useTranslation();
  const controlId = id ?? `rate-limit-type-${name}`;
  const options = rateLimitTypeOptions(type, t);

  return (
    <div className={className}>
      <TooltipProvider>
        <label htmlFor={controlId} className="mb-2 flex items-center gap-1 text-sm text-foreground">
          {rateLimitTypeLabelText(t, type)}
          <Tooltip>
            <TooltipTrigger
              render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />}
              aria-label={rateLimitTypeTooltip(t, type)}
            />
            <TooltipContent>{rateLimitTypeTooltip(t, type)}</TooltipContent>
          </Tooltip>
        </label>
      </TooltipProvider>
      <Select
        value={value ?? null}
        onValueChange={(next: string | null) => next !== null && onChange?.(next)}
        disabled={disabled}
      >
        <SelectTrigger id={controlId} className="w-full" aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
          <SelectValue
            placeholder={t("commonComponents.rateLimitTypeFormItem.selectPlaceholder", {
              defaultValue: "Select rate limit type",
            })}
          >
            {(selected: string | null) =>
              selected === null
                ? t("commonComponents.rateLimitTypeFormItem.selectPlaceholder", {
                    defaultValue: "Select rate limit type",
                  })
                : plainLabelText(t, selected) ?? selected
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) =>
            showDetailedDescriptions ? (
              <SelectItem key={option.value} value={option.value} title={option.label}>
                <span className="flex flex-col py-1">
                  <span className="font-medium">{option.label}</span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">{option.description}</span>
                </span>
              </SelectItem>
            ) : (
              <SelectItem
                key={option.value}
                value={option.value}
                title={plainLabelText(t, option.value) ?? option.value}
              >
                {plainLabelText(t, option.value) ?? option.value}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RateLimitTypeFormItem;
