import type { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";

import { type ComplexityRouterConfigValue, heuristicScoringRole, usesLlmClassifier } from "./ComplexityRouterConfig";
import { restrictedBy, restrictionReason } from "./TierRestrictions";

const tierConfigIntroText = (value: ComplexityRouterConfigValue, t: TFunction): string => {
  if (value.classifier_type === "heuristic_v2") {
    return t("addModel.tierConfigIntro.heuristicV2", {
      defaultValue:
        "The complexity router classifies each request with a calibrated local four-tier model (no API calls). Configure which model(s) handle each tier.",
    });
  }
  if (heuristicScoringRole(value) === "never") {
    return t("addModel.tierConfigIntro.llmClassifier", {
      defaultValue:
        "The complexity router classifies each request with your classifier model and routes it to that tier. Configure which model(s) handle each tier.",
    });
  }
  return t("addModel.tierConfigIntro.heuristic", {
    defaultValue:
      "The complexity router automatically classifies requests by complexity using rule-based scoring (no API calls, <1ms latency). Configure which model(s) handle each tier.",
  });
};

const TierConfigIntro: React.FC<{ value: ComplexityRouterConfigValue }> = ({ value }) => {
  const { t } = useTranslation();
  return (
    <>
      <span className="block mb-6 text-muted-foreground">{tierConfigIntroText(value, t)}</span>

      <span className="block mb-4 text-xs text-muted-foreground">
        {restrictionReason(restrictedBy(value, "displayNames"), t) ??
          t("addModel.tierConfigIntro.displayNamesHint", {
            defaultValue:
              "Rename a tier to use your own vocabulary in the dashboard and your spend logs. Renaming doesn't change how requests are classified, and callers never see these names.",
          })}
        {!value.custom_tier_set &&
          usesLlmClassifier(value.classifier_type) &&
          t("addModel.tierConfigIntro.displayNamesClassifierHint", {
            defaultValue: " Your classifier model reads these names, so clearer ones can sharpen its choices.",
          })}
      </span>
    </>
  );
};

export default TierConfigIntro;
