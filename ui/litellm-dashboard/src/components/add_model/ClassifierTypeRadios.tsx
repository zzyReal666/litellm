import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { ClassifierType } from "./classifier_types";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import { restrictedBy } from "./TierRestrictions";
import i18n from "@/lib/i18n";

interface ClassifierTypeRadiosProps {
  value: ComplexityRouterConfigValue;
  classifierType: ClassifierType;
  onTypeChange: (classifierType: ClassifierType) => void;
}

const ClassifierTypeRadios: React.FC<ClassifierTypeRadiosProps> = ({ value, classifierType, onTypeChange }) => {
  const scorerLocked = Boolean(value.custom_tier_set);
  const scorerLockedReason = restrictedBy(value, "heuristicClassifier")?.reason;
  return (
    <RadioGroup
      value={classifierType}
      onValueChange={(nextType: unknown) => onTypeChange(nextType as ClassifierType)}
      className="w-full"
    >
      <div className="flex w-full flex-col items-start gap-2">
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">{i18n.t("addModel.classificationMethod.heuristicLabel", { defaultValue: "Heuristic" })}</strong>{" "}
              <span className="text-muted-foreground">
                {i18n.t("addModel.classificationMethod.heuristicDescription", {
                  defaultValue: "(default), rule-based scoring with no API calls and <1ms latency",
                })}
              </span>
            </span>
          </Label>
        </SimpleTooltip>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic_v2" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">{i18n.t("viewLogs.routingDecisionCard.causeHeuristicV2", { defaultValue: "Heuristic v2" })}</strong>{" "}
              <span className="text-muted-foreground">
                {i18n.t("addModel.classificationMethod.heuristicV2Description", {
                  defaultValue: "uses bundled calibrated four-tier probabilities with no API call",
                })}
              </span>
            </span>
          </Label>
        </SimpleTooltip>
        <Label className="items-start font-normal leading-normal">
          <RadioGroupItem value="llm" className="mt-0.5" />
          <span>
            <strong className="font-semibold">{i18n.t("addModel.classificationMethod.llmClassifierLabel", { defaultValue: "LLM Classifier" })}</strong>{" "}
            <span className="text-muted-foreground">
              {i18n.t("addModel.classificationMethod.llmDescription", {
                defaultValue: "calls a model to decide the tier (e.g. a small/fast model)",
              })}
            </span>
          </span>
        </Label>
        <Label className="items-start font-normal leading-normal">
          <RadioGroupItem value="jev" className="mt-0.5" />
          <span>
            <strong className="font-semibold">{i18n.t("modelsEndpoints.ClassifierTypeRadios.ossClassifier", { defaultValue: "OSS Classifier" })}</strong>{" "}
            <span className="text-muted-foreground">
              {i18n.t("addModel.classificationMethod.ossDescription", {
                defaultValue: "uses Jev, Laya, Bespoke, or a Databricks endpoint to decide the tier",
              })}
            </span>
          </span>
        </Label>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="heuristic_first" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">{i18n.t("addModel.classificationMethod.heuristicFirstLabel", { defaultValue: "Heuristic first" })}</strong>{" "}
              <span className="text-muted-foreground">
                {i18n.t("addModel.classificationMethod.heuristicFirstDescription", {
                  defaultValue:
                    "scores locally, and only pays for the classifier when the score does not confidently land a cheap tier",
                })}
              </span>
            </span>
          </Label>
        </SimpleTooltip>
        <SimpleTooltip content={scorerLockedReason}>
          <Label className="items-start font-normal leading-normal has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50">
            <RadioGroupItem value="hybrid" className="mt-0.5" disabled={scorerLocked} />
            <span>
              <strong className="font-semibold">{i18n.t("addModel.classificationMethod.hybridLabel", { defaultValue: "Hybrid" })}</strong>{" "}
              <span className="text-muted-foreground">
                {i18n.t("addModel.classificationMethod.hybridDescription", {
                  defaultValue:
                    "keeps the local score at any tier, and only pays for the classifier when that score lands near a tier boundary",
                })}
              </span>
            </span>
          </Label>
        </SimpleTooltip>
      </div>
    </RadioGroup>
  );
};

export default ClassifierTypeRadios;
