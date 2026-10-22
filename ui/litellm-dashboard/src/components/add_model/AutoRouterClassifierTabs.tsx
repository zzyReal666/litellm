import React, { useContext, useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { ChevronDownIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  effectiveClassifierType,
  type ClassifierType,
  type ComplexityRouterConfigValue,
} from "./ComplexityRouterConfig";
import {
  defaultJevClassifierConfig,
  isOssClassifierProvider,
  normalizeJevClassifierConfig,
} from "./jev_classifier_config";
import { transitionClassifierType } from "./classifier_type_transition";
import { isForecastClassifier } from "./forecast_classifier_config";
import {
  AutoRouterAllowanceLabel,
  AutoRouterAvailabilityContext,
  AutoRouterLimits,
  AutoRouterContactLink,
  isAllowanceExhausted,
  AUTO_ROUTER_CONTACT_URL,
} from "./AutoRouterAvailability";
import i18n from "@/lib/i18n";

export function ClassifierOption({
  value,
  label,
  description,
  feature,
  disabled,
  unlimited = true,
}: {
  value: string;
  label: string;
  description: string;
  feature?: string;
  disabled?: boolean;
  unlimited?: boolean;
}) {
  const state = useContext(AutoRouterAvailabilityContext);
  const allowance = state.data?.allowances.find((entry) => entry.key === feature);
  const fresh = !state.isPending && !state.isError && !state.isChecking;
  const exhausted = isAllowanceExhausted(allowance);
  return (
    <div className="relative">
      <DropdownMenuRadioItem value={value} disabled={disabled || exhausted} closeOnClick className="py-3">
        <span className="grid w-full min-w-0 gap-1 whitespace-normal">
          <span className="flex items-center justify-between gap-3">
            <span className="font-medium">{label}</span>
            {feature ? (
              <AutoRouterAllowanceLabel feature={feature} />
            ) : (
              unlimited && <span className="shrink-0 text-xs leading-5 text-muted-foreground">{i18n.t("bulkEditUsers.unlimited", { defaultValue: "Unlimited" })}</span>
            )}
          </span>
          <span className={`text-xs leading-5 text-muted-foreground ${exhausted ? "pr-28" : ""}`}>{description}</span>
        </span>
      </DropdownMenuRadioItem>
    </div>
  );
}

export function ClassifierMenu({
  id,
  label,
  value,
  selectedLabel,
  feature,
  onValueChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  selectedLabel: string;
  feature?: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        aria-label={label}
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className="flex-1 text-left">{selectedLabel}</span>
        {feature ? (
          <AutoRouterAllowanceLabel feature={feature} />
        ) : (
          <span className="text-xs text-muted-foreground">{i18n.t("bulkEditUsers.unlimited", { defaultValue: "Unlimited" })}</span>
        )}
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {children}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AutoRouterClassifierTabsProps {
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
  children: React.ReactNode;
  judgeModel?: React.ReactNode;
  decisionModel?: React.ReactNode;
}

const AutoRouterClassifierTabs: React.FC<AutoRouterClassifierTabsProps> = ({
  value,
  onChange,
  children,
  judgeModel,
  decisionModel,
}) => {
  const id = useId();
  const availability = useContext(AutoRouterAvailabilityContext);
  const classifierType = effectiveClassifierType(value);
  const familyByType: Record<ClassifierType, string> = {
    heuristic: "heuristics",
    heuristic_v2: "heuristics",
    llm: "llm",
    heuristic_first: "llm",
    hybrid: "llm",
    capability: "llm",
    llm_v2: "llm",
    jev: "jev",
    custom: "custom",
  };
  const family = familyByType[classifierType];
  const hasCustomTiers = Boolean(value.custom_tier_set);
  const changeType = (next: ClassifierType) => {
    if (next !== classifierType) onChange(transitionClassifierType(value, next));
  };

  const changeFamily = (next: unknown) => {
    if (next === family) return;
    if (next === "heuristics") changeType("heuristic");
    if (next === "llm") changeType("llm");
    if (next === "jev") changeType("jev");
  };
  const changeProvider = (provider: unknown) => {
    if (!isOssClassifierProvider(provider)) return;
    const defaults = defaultJevClassifierConfig(provider);
    onChange({
      ...value,
      jev_classifier_config: { ...defaults, ...value.jev_classifier_config, provider, model: defaults.model },
    });
  };
  const approachLabels: Partial<Record<ClassifierType, string>> = { capability: "Capability", llm_v2: "Fuse v2" };
  const approachDescription: Partial<Record<ClassifierType, string>> = {
    capability: "Use the efficient model when it is likely to succeed",
    llm_v2: "Use the efficient model when its predicted quality is close enough to the capable model",
  };
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-4 flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="m-0 text-xl font-semibold text-foreground">{i18n.t("modelsEndpoints.AutoRouterClassifierTabs.chooseYourClassifier", { defaultValue: "Choose your classifier" })}</h4>
            <SimpleTooltip content={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.chooseHowRequestsAreEvaluatedAnd", { defaultValue: "Choose how requests are evaluated and routed to your tiers" })}>
              <button type="button" aria-label={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.aboutClassifiers", { defaultValue: "About classifiers" })} className="text-muted-foreground">
                <Info className="size-4" />
              </button>
            </SimpleTooltip>
          </div>
          <AutoRouterLimits />
        </legend>
        <RadioGroup value={family} onValueChange={changeFamily} className="grid gap-3 sm:grid-cols-3">
          {[
            { value: "heuristics", label: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.heuristics", { defaultValue: "Heuristics" }), description: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.classifyLocallyWithNoApiCall", { defaultValue: "Classify locally, with no API call" }) },
            { value: "llm", label: "LLM", description: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.useAJudgeModelToChoose", { defaultValue: "Use a judge model to choose a solver" }) },
            {
              value: "jev",
              label: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.decisionsModel", { defaultValue: "Decisions Model" }),
              description: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.useADecisionModelToChoose", { defaultValue: "Use a decision model to choose a tier" }),
            },
          ].map((option) => (
            <Label
              key={option.value}
              className="cursor-pointer items-start rounded-lg border p-4 transition-colors hover:bg-muted/50 has-data-checked:border-primary has-data-checked:bg-primary/5"
            >
              <RadioGroupItem
                aria-describedby={`${id}-${option.value}-description`}
                value={option.value}
                disabled={option.value === "heuristics" && hasCustomTiers}
              />
              <span className="space-y-1">
                <span className="block font-medium">{option.label}</span>
                <span
                  id={`${id}-${option.value}-description`}
                  aria-hidden="true"
                  className="block text-xs font-normal text-muted-foreground"
                >
                  {option.description}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>
      {family === "jev" &&
        (decisionModel ?? (
          <div className="space-y-2">
            <Label htmlFor={`${id}-decision-model`}>{i18n.t("modelsEndpoints.AutoRouterClassifierTabs.decisionModel", { defaultValue: "Decision model" })}</Label>
            <Select
              items={[
                { value: "jev", label: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.jev", { defaultValue: "Jev" }) },
                { value: "laya", label: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.laya", { defaultValue: "Laya" }) },
                { value: "bespoke", label: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.bespokeNimble", { defaultValue: "Bespoke Nimble" }) },
                { value: "databricks", label: i18n.t("modelsEndpoints.AutoRouterClassifierTabs.databricks", { defaultValue: "Databricks" }) },
              ]}
              value={normalizeJevClassifierConfig(value.jev_classifier_config).provider}
              onValueChange={changeProvider}
            >
              <SelectTrigger id={`${id}-decision-model`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jev">{i18n.t("modelsEndpoints.AutoRouterClassifierTabs.jev2", { defaultValue: "Jev" })}</SelectItem>
                <SelectItem value="laya">{i18n.t("modelsEndpoints.AutoRouterClassifierTabs.laya2", { defaultValue: "Laya" })}</SelectItem>
                <SelectItem value="bespoke">{i18n.t("modelsEndpoints.AutoRouterClassifierTabs.bespokeNimble2", { defaultValue: "Bespoke Nimble" })}</SelectItem>
                <SelectItem value="databricks">{i18n.t("modelsEndpoints.AutoRouterClassifierTabs.databricks2", { defaultValue: "Databricks" })}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      {family === "custom" && (
        <p className="text-sm text-muted-foreground">{i18n.t("modelsEndpoints.AutoRouterClassifierTabs.thisRouterUsesACustomClassifier", { defaultValue: "This router uses a custom classifier plugin" })}</p>
      )}
      {family === "heuristics" && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-heuristic`}>{i18n.t("addModel.classificationMethod.heuristicLabel", { defaultValue: "Heuristic" })}</Label>
          <ClassifierMenu
            id={`${id}-heuristic`}
            label={i18n.t("addModel.classificationMethod.heuristicLabel", { defaultValue: "Heuristic" })}
            selectedLabel={classifierType === "heuristic_v2" ? "Heuristic v2" : "Rule-based"}
            feature={classifierType === "heuristic_v2" ? "heuristic_v2" : undefined}
            value={classifierType}
            onValueChange={(next) => {
              if (next === "heuristic" || next === "heuristic_v2") changeType(next);
            }}
          >
            <ClassifierOption
              value="heuristic"
              label={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.ruleBased", { defaultValue: "Rule-based" })}
              description={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.scoreRequestsWithLocalRulesTo", { defaultValue: "Score requests with local rules to choose a tier, with no API call" })}
            />
            <ClassifierOption
              value="heuristic_v2"
              label={i18n.t("viewLogs.routingDecisionCard.causeHeuristicV2", { defaultValue: "Heuristic v2" })}
              description={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.useCalibratedProbabilitiesToMatchRequests", { defaultValue: "Use calibrated probabilities to match requests to a tier, with no API call" })}
              feature="heuristic_v2"
            />
          </ClassifierMenu>
          <p className="text-xs text-muted-foreground">
            {classifierType === "heuristic_v2"
              ? "Use calibrated probabilities to match requests to a tier"
              : "Match requests using scoring rules. Choose or change tier models freely"}
          </p>
        </div>
      )}
      {family === "llm" && judgeModel}
      {family === "llm" && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-approach`}>{i18n.t("modelsEndpoints.AutoRouterClassifierTabs.routingApproach", { defaultValue: "Routing approach" })}</Label>
          <ClassifierMenu
            id={`${id}-approach`}
            label={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.routingApproach2", { defaultValue: "Routing approach" })}
            selectedLabel={approachLabels[classifierType] ?? "Complexity"}
            feature={isForecastClassifier(classifierType) ? classifierType : undefined}
            value={isForecastClassifier(classifierType) ? classifierType : "llm"}
            onValueChange={(next) => {
              if (next === "llm" || next === "capability" || next === "llm_v2") {
                if (next === "llm" && !isForecastClassifier(classifierType)) return;
                changeType(next);
              }
            }}
          >
            <ClassifierOption
              value="llm"
              label={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.complexity", { defaultValue: "Complexity" })}
              description={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.complexityDescription", {
                defaultValue: "Match task difficulty to a tier, then use one of that tier's models",
              })}
            />
            {family === "llm" && (
              <>
                <ClassifierOption
                  value="capability"
                  label={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.capability", { defaultValue: "Capability" })}
                  description={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.useTheEfficientModelWhenIt", { defaultValue: "Use the efficient model when it is likely to succeed; otherwise use the capable model" })}
                  feature="capability"
                  disabled={hasCustomTiers}
                />
                <ClassifierOption
                  value="llm_v2"
                  label={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.fuseV2", { defaultValue: "Fuse v2" })}
                  description={i18n.t("modelsEndpoints.AutoRouterClassifierTabs.useTheEfficientModelWhenIts", { defaultValue: "Use the efficient model when its predicted quality is close enough to the capable model" })}
                  feature="llm_v2"
                  disabled={hasCustomTiers}
                />
              </>
            )}
          </ClassifierMenu>
          <p className="text-xs text-muted-foreground">
            {approachDescription[classifierType] ?? "Match task difficulty to a tier"}
          </p>
        </div>
      )}
      {hasCustomTiers && (
        <p className="text-xs text-muted-foreground">
          {i18n.t("modelsEndpoints.AutoRouterClassifierTabs.restoreStandardTiersToUseHeuristics", { defaultValue: "Restore standard tiers to use Heuristics, Capability, or Fuse v2" })}
        </p>
      )}
      {availability.data?.error && !availability.isChecking && (
        <div role="alert" className="space-y-1">
          <p className="text-sm text-destructive">{availability.data.error}</p>
          <AutoRouterContactLink />
        </div>
      )}
      {availability.isError && (
        <p className="text-xs text-muted-foreground">
          Could not check availability.{" "}
          <button type="button" className="underline" onClick={() => availability.refetch?.()}>
            {i18n.t("navbar.retry", { defaultValue: "Retry" })}
          </button>
        </p>
      )}
      {children}
    </div>
  );
};

export default AutoRouterClassifierTabs;
