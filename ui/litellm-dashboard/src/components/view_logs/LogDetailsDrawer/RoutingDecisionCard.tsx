"use client";

import { Waypoints } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cva.config";

export interface RoutingDecisionTierBoundaries {
  simple_medium?: number;
  medium_complex?: number;
  complex_reasoning?: number;
}

export interface RoutingDecision {
  router_model_name?: string;
  router_type?: string;
  routed_model?: string;
  cause?: string;
  tier?: string;
  tier_label?: string;
  request_type?: string;
  score?: number;
  signals?: string[];
  matched_keyword?: string;
  escalation_keyword?: string;
  classifier_model?: string;
  escalated?: boolean;
  tier_boundaries?: RoutingDecisionTierBoundaries;
  reasoning_override_min_score?: number;
}

const ROUTER_TYPE_LABEL_KEYS: Record<string, string> = {
  complexity: "viewLogs.routingDecisionCard.routerTypeComplexity",
  adaptive: "viewLogs.routingDecisionCard.routerTypeAdaptive",
  quality: "viewLogs.routingDecisionCard.routerTypeQuality",
};

const ROUTER_TYPE_LABELS: Record<string, string> = {
  complexity: "Auto-Router v2",
  adaptive: "Adaptive router",
  quality: "Quality router",
};

const tierName = (t: TFunction, tier: string): string =>
  t(`viewLogs.routingDecisionCard.tierName${tier}`, { defaultValue: tier });

/**
 * The tier the score alone would have produced, given the boundaries in effect when
 * the decision was made. Rendered as the bracket that explains a score, so it must
 * use the snapshot rather than today's config.
 */
function describeScoreAgainstBoundaries(
  t: TFunction,
  score: number,
  boundaries?: RoutingDecisionTierBoundaries,
  renamed?: boolean,
): string | null {
  if (!boundaries) return null;
  const {
    simple_medium: simpleMedium,
    medium_complex: mediumComplex,
    complex_reasoning: complexReasoning,
  } = boundaries;
  if (simpleMedium === undefined || mediumComplex === undefined || complexReasoning === undefined) return null;

  const named = (range: string, tier: string): string => (renamed ? range : `${range}, ${tier}`);
  if (score < simpleMedium)
    return named(
      t("viewLogs.routingDecisionCard.rangeBelow", { bound: simpleMedium, defaultValue: `below ${simpleMedium}` }),
      tierName(t, "SIMPLE"),
    );
  if (score < mediumComplex)
    return named(
      t("viewLogs.routingDecisionCard.rangeBetween", {
        lower: simpleMedium,
        upper: mediumComplex,
        defaultValue: `${simpleMedium} to ${mediumComplex}`,
      }),
      tierName(t, "MEDIUM"),
    );
  if (score < complexReasoning)
    return named(
      t("viewLogs.routingDecisionCard.rangeBetween", {
        lower: mediumComplex,
        upper: complexReasoning,
        defaultValue: `${mediumComplex} to ${complexReasoning}`,
      }),
      tierName(t, "COMPLEX"),
    );
  return named(
    t("viewLogs.routingDecisionCard.rangeAtOrAbove", {
      bound: complexReasoning,
      defaultValue: `at or above ${complexReasoning}`,
    }),
    tierName(t, "REASONING"),
  );
}

function describePlanModeFloor(t: TFunction, matchedKeyword: string | undefined): string {
  if (matchedKeyword === "exit_plan_mode")
    return t("viewLogs.routingDecisionCard.planModeFloorTool", {
      defaultValue: "Plan-mode floor (exit_plan_mode tool)",
    });
  if (matchedKeyword)
    return t("viewLogs.routingDecisionCard.planModeFloorKeyword", {
      keyword: matchedKeyword,
      defaultValue: `Plan-mode floor: "${matchedKeyword}"`,
    });
  return t("viewLogs.routingDecisionCard.planModeFloor", { defaultValue: "Plan-mode floor" });
}

/**
 * The sentinel is the whole reason this row is worth reading: it is the string an operator
 * would add to housekeeping_patterns to cover another client, so naming it turns the row into
 * the instruction. Without it the drawer says only that the classifier was skipped.
 */
function describeHousekeeping(t: TFunction, matchedKeyword: string | undefined): string {
  if (matchedKeyword)
    return t("viewLogs.routingDecisionCard.housekeepingKeyword", {
      keyword: matchedKeyword,
      defaultValue: `Client housekeeping call: "${matchedKeyword}"`,
    });
  return t("viewLogs.routingDecisionCard.housekeepingNoKeyword", {
    defaultValue: "Client housekeeping call, classifier skipped",
  });
}

/** Rows logged before the floor was recorded name what it tracked back then instead of a number. */
function describeReasoningOverride(t: TFunction, tierLabel: string | undefined, floor: number | undefined): string {
  const stated =
    floor === undefined
      ? t("viewLogs.routingDecisionCard.simpleToMediumBoundary", { defaultValue: "the Simple to Medium boundary" })
      : String(floor);
  return t("viewLogs.routingDecisionCard.reasoningOverride", {
    tier: tierLabel ?? tierName(t, "REASONING"),
    stated,
    defaultValue: `Heuristic, ${tierLabel ?? "REASONING"} override (2 or more reasoning markers, score of at least ${stated})`,
  });
}

const CONSTANT_CAUSE_LABELS: Record<string, { labelKey: string; label: string }> = {
  heuristic_scorer: { labelKey: "viewLogs.routingDecisionCard.causeHeuristicScorer", label: "Heuristic scorer" },
  heuristic_v2: { labelKey: "viewLogs.routingDecisionCard.causeHeuristicV2", label: "Heuristic v2" },
  heuristic_first_short_circuit: {
    labelKey: "viewLogs.routingDecisionCard.causeHeuristicFirstShortCircuit",
    label: "Heuristic scorer, classifier skipped",
  },
  hybrid_short_circuit: {
    labelKey: "viewLogs.routingDecisionCard.causeHybridShortCircuit",
    label: "Heuristic scorer, score clear of every boundary",
  },
  classifier_plugin: {
    labelKey: "viewLogs.routingDecisionCard.causeClassifierPlugin",
    label: "Custom classifier plugin",
  },
  semantic_keyword_match: {
    labelKey: "viewLogs.routingDecisionCard.causeSemanticKeywordMatch",
    label: "Semantic keyword match",
  },
  session_affinity_pin: {
    labelKey: "viewLogs.routingDecisionCard.causeSessionAffinityPin",
    label: "Pinned to session",
  },
  session_affinity_escalation: {
    labelKey: "viewLogs.routingDecisionCard.causeSessionAffinityEscalation",
    label: "Escalated from session pin",
  },
  user_turn_continuation: {
    labelKey: "viewLogs.routingDecisionCard.causeUserTurnContinuation",
    label: "Continuation turn, classifier skipped",
  },
  modality_escalation: {
    labelKey: "viewLogs.routingDecisionCard.causeModalityEscalation",
    label: "Escalated for image input",
  },
  modality_pin_override: {
    labelKey: "viewLogs.routingDecisionCard.causeModalityPinOverride",
    label: "Overrode session pin for image input",
  },
  quality_tier: { labelKey: "viewLogs.routingDecisionCard.causeQualityTier", label: "Quality tier mapping" },
  bandit: { labelKey: "viewLogs.routingDecisionCard.causeBandit", label: "Adaptive bandit" },
  default_fallback: {
    labelKey: "viewLogs.routingDecisionCard.causeDefaultFallback",
    label: "Default model, no route matched",
  },
  classifier_fallback: {
    labelKey: "viewLogs.routingDecisionCard.causeClassifierFallback",
    label: "Fallback tier, LLM classifier failed",
  },
  default_model_fallback: {
    labelKey: "viewLogs.routingDecisionCard.causeDefaultModelFallback",
    label: "Default model, LLM classifier failed",
  },
};

function describeCause(t: TFunction, decision: RoutingDecision): string {
  const {
    cause,
    classifier_model: classifierModel,
    matched_keyword: matchedKeyword,
    tier_label: tierLabel,
    reasoning_override_min_score: overrideFloor,
  } = decision;

  const constant = cause ? CONSTANT_CAUSE_LABELS[cause] : undefined;
  if (constant) return t(constant.labelKey, { defaultValue: constant.label });

  switch (cause) {
    case "reasoning_override":
      return describeReasoningOverride(t, tierLabel, overrideFloor);
    case "llm_classifier":
      return classifierModel
        ? t("viewLogs.routingDecisionCard.classifierWithModel", {
            model: classifierModel,
            defaultValue: `LLM classifier (${classifierModel})`,
          })
        : t("viewLogs.routingDecisionCard.classifier", { defaultValue: "LLM classifier" });
    case "literal_keyword_match":
    case "keyword":
      return matchedKeyword
        ? t("viewLogs.routingDecisionCard.keywordMatchWithKeyword", {
            keyword: matchedKeyword,
            defaultValue: `Keyword match: "${matchedKeyword}"`,
          })
        : t("viewLogs.routingDecisionCard.keywordMatch", { defaultValue: "Keyword match" });
    case "plan_mode":
      return describePlanModeFloor(t, matchedKeyword);
    case "housekeeping":
      return describeHousekeeping(t, matchedKeyword);
    default:
      return cause ?? t("viewLogs.routingDecisionCard.unknownCause", { defaultValue: "Unknown" });
  }
}

/**
 * A request can ask to escalate and get nowhere, when its tier is already the highest
 * one configured. That row still has to say the caller asked, otherwise it reads as an
 * ordinary route; it just must not claim a bump that did not happen. Only called when
 * the request escalated or asked to, so there is no "did not escalate" case.
 */
function describeEscalation(t: TFunction, escalated: boolean, keyword: string | undefined): string {
  if (escalated)
    return keyword
      ? t("viewLogs.routingDecisionCard.escalatedWithKeyword", {
          keyword,
          defaultValue: `Yes, keyword "${keyword}"`,
        })
      : t("viewLogs.routingDecisionCard.escalatedYes", { defaultValue: "Yes" });
  return keyword
    ? t("viewLogs.routingDecisionCard.requestedWithKeyword", {
        keyword,
        defaultValue: `Requested via "${keyword}"; already at the highest tier`,
      })
    : t("viewLogs.routingDecisionCard.requestedNoKeyword", {
        defaultValue: "Requested; already at the highest tier",
      });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export function RoutingDecisionCard({
  decision,
  className,
}: {
  decision?: RoutingDecision | null;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!decision || !decision.cause) return null;

  const {
    router_model_name: routerModelName,
    router_type: routerType,
    routed_model: routedModel,
    tier,
    tier_label: tierLabel,
    request_type: requestType,
    score,
    signals,
    escalated,
    escalation_keyword: escalationKeyword,
    tier_boundaries: tierBoundaries,
  } = decision;

  // On an override row the score did not decide the tier, so showing it against a
  // boundary would claim something untrue. Keyed off the cause rather than a marker
  // inside `signals`, which redaction can remove.
  const scoreExplanation =
    score !== undefined && decision.cause !== "reasoning_override" && decision.cause !== "plan_mode"
      ? describeScoreAgainstBoundaries(t, score, tierBoundaries, tierLabel !== undefined)
      : null;

  return (
    <div className={cn("mb-6 w-full max-w-full overflow-hidden rounded-lg bg-card shadow-sm", className)}>
      <div className="border-b px-4 py-2.5 text-sm font-medium">
        {t("viewLogs.routingDecisionCard.title", { defaultValue: "Routing" })}
      </div>
      <div className="px-4 py-3">
        {routerModelName && (
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Waypoints size={14} aria-hidden />
            <span>{routerModelName}</span>
            {routerType && (
              <span className="font-normal text-muted-foreground">
                (
                {t(ROUTER_TYPE_LABEL_KEYS[routerType] ?? "", {
                  defaultValue: ROUTER_TYPE_LABELS[routerType] ?? routerType,
                })}
                )
              </span>
            )}
          </div>
        )}

        {tier && (
          <Row label={t("viewLogs.routingDecisionCard.labelTier", { defaultValue: "Tier" })}>
            <Badge variant="secondary" className="font-normal">
              {tierLabel ?? tier}
            </Badge>
          </Row>
        )}

        {requestType && (
          <Row label={t("viewLogs.routingDecisionCard.labelRequestType", { defaultValue: "Request type" })}>
            {requestType}
          </Row>
        )}

        <Row label={t("viewLogs.routingDecisionCard.labelDecidedBy", { defaultValue: "Decided by" })}>
          {describeCause(t, decision)}
        </Row>

        {score !== undefined && (
          <Row label={t("viewLogs.routingDecisionCard.labelScore", { defaultValue: "Score" })}>
            <span className="tabular-nums">{score.toFixed(2)}</span>
            {scoreExplanation && <span className="ml-2 text-muted-foreground">({scoreExplanation})</span>}
          </Row>
        )}

        {routedModel && (
          <Row label={t("viewLogs.routingDecisionCard.labelRoutedTo", { defaultValue: "Routed to" })}>
            {routedModel}
          </Row>
        )}

        {escalated !== undefined && (
          <Row label={t("viewLogs.routingDecisionCard.labelEscalated", { defaultValue: "Escalated" })}>
            {describeEscalation(t, escalated, escalationKeyword)}
          </Row>
        )}

        {signals && signals.length > 0 && (
          <Row label={t("viewLogs.routingDecisionCard.labelSignals", { defaultValue: "Signals" })}>
            <span className="flex flex-wrap gap-1">
              {signals.map((signal) => (
                <Badge key={signal} variant="outline" className="font-normal">
                  {signal}
                </Badge>
              ))}
            </span>
          </Row>
        )}
      </div>
    </div>
  );
}

export default RoutingDecisionCard;
