import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReasoningEffort } from "./complexity_router_tiers";

const PROVIDER_DEFAULT = "__classifier_provider_default__";

type EffortStatus = "supported" | "unsupported" | "unverified" | undefined;

const effortStatusFor = (
  effort: string | undefined,
  explicitlySupported: string[] | null | undefined,
): EffortStatus => {
  if (effort === undefined) return undefined;
  if (!Array.isArray(explicitlySupported)) return "unverified";
  return explicitlySupported.includes(effort) ? "supported" : "unsupported";
};

interface ClassifierReasoningEffortSelectProps {
  model: string;
  value: ReasoningEffort | undefined;
  explicitlySupported: string[] | null | undefined;
  onChange: (value: ReasoningEffort | undefined) => void;
}

const ClassifierReasoningEffortSelect = ({
  model,
  value,
  explicitlySupported,
  onChange,
}: ClassifierReasoningEffortSelectProps) => {
  const { t } = useTranslation();
  const status = effortStatusFor(value, explicitlySupported);
  const options = Array.from(new Set([...(explicitlySupported ?? []), ...(value ? [value] : [])]));

  if (!model || options.length === 0) return null;

  const statusLabel = (current: EffortStatus): string =>
    current === "unsupported"
      ? t("addModel.classifierReasoningEffort.statusUnsupported", { defaultValue: "unsupported" })
      : t("addModel.classifierReasoningEffort.statusUnverified", { defaultValue: "unverified" });

  const optionLabel = (effort: string): string =>
    effort === value && status !== "supported" ? `${effort} (${statusLabel(status)})` : effort;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <strong className="font-semibold">
          {t("addModel.classifierReasoningEffort.label", { defaultValue: "Reasoning Effort" })}
        </strong>
        <SimpleTooltip
          content={t("addModel.classifierReasoningEffort.tooltip", {
            defaultValue:
              "Sent only to the classifier call. Default leaves the classifier deployment or provider setting unchanged.",
          })}
        >
          <Info className="size-4 text-muted-foreground" />
        </SimpleTooltip>
      </div>
      <Select
        items={[
          { value: PROVIDER_DEFAULT, label: t("common.default", { defaultValue: "Default" }) },
          ...options.map((effort) => ({ value: effort, label: optionLabel(effort) })),
        ]}
        value={value ?? PROVIDER_DEFAULT}
        onValueChange={(effort: string | null) =>
          effort && onChange(effort === PROVIDER_DEFAULT ? undefined : (effort as ReasoningEffort))
        }
      >
        <SelectTrigger
          aria-label={t("addModel.classifierReasoningEffort.ariaLabel", {
            defaultValue: "Reasoning effort for classifier model {{model}}",
            model,
          })}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PROVIDER_DEFAULT}>{t("common.default", { defaultValue: "Default" })}</SelectItem>
          {options.map((effort) => (
            <SelectItem key={effort} value={effort}>
              {optionLabel(effort)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {status === "unverified" && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          {t("addModel.classifierReasoningEffort.unverifiedHint", {
            defaultValue:
              "This saved effort cannot be verified for the selected model. Choose Default unless you have confirmed provider support.",
          })}
        </p>
      )}
      {status === "unsupported" && (
        <p className="mt-1 text-xs text-destructive">
          {t("addModel.classifierReasoningEffort.unsupportedHint", {
            defaultValue:
              "This saved effort is not supported by every deployment in the selected model group. Choose Default or a supported value before saving.",
          })}
        </p>
      )}
    </div>
  );
};

export default ClassifierReasoningEffortSelect;
