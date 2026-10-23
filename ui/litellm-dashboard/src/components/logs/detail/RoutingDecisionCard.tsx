"use client";

import { Waypoints } from "lucide-react";

import i18n from "@/lib/i18n";
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
  classifier_p_solve?: number;
  classifier_calibrated_p_solve?: number;
  classifier_threshold?: number;
  classifier_capability_boundary?: string;
  classifier_primary_rule?: string;
  classifier_calibration_version?: string;
  classifier_efficient_p_solve?: number;
  classifier_capable_p_solve?: number;
  classifier_calibrated_efficient_p_solve?: number;
  classifier_calibrated_capable_p_solve?: number;
  classifier_max_quality_gap?: number;
  classifier_confidence?: number;
  classifier_probabilities?: Record<string, number>;
  classifier_cost?: number;
  escalated?: boolean;
  tier_boundaries?: RoutingDecisionTierBoundaries;
  reasoning_override_min_score?: number;
  heuristic_v2_forecast?: {
    probabilities: Record<string, number>;
    threshold: number;
    predicted_tier: string;
    request_type: string;
  };
}

const ROUTER_TYPE_LABELS: Record<string, string> = {
  complexity: i18n.t("viewLogs.routingDecision.autoRouterV2", { defaultValue: "Auto-Router v2" }),
  adaptive: i18n.t("viewLogs.routingDecision.adaptiveRouter", { defaultValue: "Adaptive router" }),
  quality: i18n.t("viewLogs.routingDecision.qualityRouter", { defaultValue: "Quality router" }),
};

function describeScoreAgainstBoundaries(
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
  if (score < simpleMedium) return named(i18n.t("viewLogs.routingDecision.belowScore", { score: simpleMedium, defaultValue: `below ${simpleMedium}` }), "SIMPLE");
  if (score < mediumComplex) return named(i18n.t("viewLogs.routingDecision.scoreToScore", { from: simpleMedium, to: mediumComplex, defaultValue: `${simpleMedium} to ${mediumComplex}` }), "MEDIUM");
  if (score < complexReasoning) return named(i18n.t("viewLogs.routingDecision.scoreToScore", { from: mediumComplex, to: complexReasoning, defaultValue: `${mediumComplex} to ${complexReasoning}` }), "COMPLEX");
  return named(i18n.t("viewLogs.routingDecision.atOrAboveScore", { score: complexReasoning, defaultValue: `at or above ${complexReasoning}` }), "REASONING");
}

function describePlanModeFloor(matchedKeyword: string | undefined): string {
  if (matchedKeyword === "exit_plan_mode") return i18n.t("viewLogs.routingDecision.planModeFloorTool", { defaultValue: "Plan-mode floor (exit_plan_mode tool)" });
  if (matchedKeyword) return i18n.t("viewLogs.routingDecision.planModeFloorKeyword", { keyword: matchedKeyword, defaultValue: `Plan-mode floor: "${matchedKeyword}"` });
  return i18n.t("viewLogs.routingDecision.planModeFloor", { defaultValue: "Plan-mode floor" });
}

function describeHousekeeping(matchedKeyword: string | undefined): string {
  if (matchedKeyword) return i18n.t("viewLogs.routingDecision.housekeepingKeyword", { keyword: matchedKeyword, defaultValue: `Client housekeeping call: "${matchedKeyword}"` });
  return i18n.t("viewLogs.routingDecision.housekeepingSkipped", { defaultValue: "Client housekeeping call, classifier skipped" });
}

function describeReasoningOverride(tierLabel: string | undefined, floor: number | undefined): string {
  const stated = floor === undefined ? i18n.t("viewLogs.routingDecision.simpleMediumBoundary", { defaultValue: "the Simple to Medium boundary" }) : String(floor);
  return i18n.t("viewLogs.routingDecision.reasoningOverride", {
    tier: tierLabel ?? "REASONING",
    score: stated,
    defaultValue: `Heuristic, ${tierLabel ?? "REASONING"} override (2 or more reasoning markers, score of at least ${stated})`,
  });
}

const CONSTANT_CAUSE_LABELS: Record<string, string> = {
  heuristic_scorer: i18n.t("viewLogs.routingDecision.heuristicScorer", { defaultValue: "Heuristic scorer" }),
  heuristic_v2: i18n.t("viewLogs.routingDecision.heuristicV2", { defaultValue: "Heuristic v2" }),
  capability_classifier: i18n.t("viewLogs.routingDecision.capability", { defaultValue: "Capability" }),
  capability_classifier_fallback: i18n.t("viewLogs.routingDecision.capabilityClassifierFallback", { defaultValue: "Capable tier, Capability classifier failed" }),
  llm_v2_classifier: i18n.t("viewLogs.routingDecision.fuseV2", { defaultValue: "FUSE v2" }),
  llm_v2_fallback: i18n.t("viewLogs.routingDecision.fuseV2Fallback", { defaultValue: "Capable tier, FUSE v2 classifier failed" }),
  heuristic_first_short_circuit: i18n.t("viewLogs.routingDecision.heuristicFirstShortCircuit", { defaultValue: "Heuristic scorer, classifier skipped" }),
  hybrid_short_circuit: i18n.t("viewLogs.routingDecision.hybridShortCircuit", { defaultValue: "Heuristic scorer, score clear of every boundary" }),
  classifier_plugin: i18n.t("viewLogs.routingDecision.classifierPlugin", { defaultValue: "Custom classifier plugin" }),
  semantic_keyword_match: i18n.t("viewLogs.routingDecision.semanticKeywordMatch", { defaultValue: "Semantic keyword match" }),
  session_affinity_pin: i18n.t("viewLogs.routingDecision.sessionAffinityPin", { defaultValue: "Pinned to session" }),
  session_affinity_escalation: i18n.t("viewLogs.routingDecision.sessionAffinityEscalation", { defaultValue: "Escalated from session pin" }),
  user_turn_continuation: i18n.t("viewLogs.routingDecision.userTurnContinuation", { defaultValue: "Continuation turn, classifier skipped" }),
  modality_escalation: i18n.t("viewLogs.routingDecision.modalityEscalation", { defaultValue: "Escalated for image input" }),
  modality_pin_override: i18n.t("viewLogs.routingDecision.modalityPinOverride", { defaultValue: "Overrode session pin for image input" }),
  quality_tier: i18n.t("viewLogs.routingDecision.qualityTier", { defaultValue: "Quality tier mapping" }),
  bandit: i18n.t("viewLogs.routingDecision.bandit", { defaultValue: "Adaptive bandit" }),
  default_fallback: i18n.t("viewLogs.routingDecision.defaultFallback", { defaultValue: "Default model, no route matched" }),
  classifier_fallback: i18n.t("viewLogs.routingDecision.classifierFallback", { defaultValue: "Fallback tier, classifier failed" }),
  default_model_fallback: i18n.t("viewLogs.routingDecision.defaultModelFallback", { defaultValue: "Default model, classifier failed" }),
};

function describeCause(decision: RoutingDecision): string {
  const {
    cause,
    classifier_model: classifierModel,
    matched_keyword: matchedKeyword,
    tier_label: tierLabel,
    reasoning_override_min_score: overrideFloor,
  } = decision;

  const constant = cause ? CONSTANT_CAUSE_LABELS[cause] : undefined;
  if (constant) return constant;

  switch (cause) {
    case "reasoning_override":
      return describeReasoningOverride(tierLabel, overrideFloor);
    case "llm_classifier":
      return classifierModel
        ? i18n.t("viewLogs.routingDecision.llmClassifierModel", { model: classifierModel, defaultValue: `LLM classifier (${classifierModel})` })
        : i18n.t("viewLogs.routingDecision.llmClassifier", { defaultValue: "LLM classifier" });
    case "jev_classifier":
      return i18n.t("viewLogs.routingDecision.ossClassifier", { defaultValue: "OSS classifier" });
    case "literal_keyword_match":
    case "keyword":
      return matchedKeyword
        ? i18n.t("viewLogs.routingDecision.keywordMatchValue", { keyword: matchedKeyword, defaultValue: `Keyword match: "${matchedKeyword}"` })
        : i18n.t("viewLogs.routingDecision.keywordMatch", { defaultValue: "Keyword match" });
    case "plan_mode":
      return describePlanModeFloor(matchedKeyword);
    case "housekeeping":
      return describeHousekeeping(matchedKeyword);
    default:
      return cause ?? i18n.t("viewLogs.routingDecision.unknown", { defaultValue: "Unknown" });
  }
}

function describeEscalation(escalated: boolean, keyword: string | undefined): string {
  if (escalated) return keyword ? i18n.t("viewLogs.routingDecision.yesKeyword", { keyword, defaultValue: `Yes, keyword "${keyword}"` }) : i18n.t("viewLogs.routingDecision.yes", { defaultValue: "Yes" });
  return keyword
    ? i18n.t("viewLogs.routingDecision.requestedHighest", { keyword, defaultValue: `Requested via "${keyword}"; already at the highest tier` })
    : i18n.t("viewLogs.routingDecision.requestedHighestNoKeyword", { defaultValue: "Requested; already at the highest tier" });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function PercentageRow({ label, value, unit = "%" }: { label: string; value?: number; unit?: string }) {
  if (value === undefined) return null;
  return (
    <Row label={label}>
      <span className="tabular-nums">{`${(value * 100).toFixed(1)}${unit}`}</span>
    </Row>
  );
}

function CapabilityForecast({ decision }: { decision: RoutingDecision }) {
  const {
    classifier_p_solve: raw,
    classifier_calibrated_p_solve: calibrated,
    classifier_threshold: threshold,
    classifier_capability_boundary: boundary,
    classifier_primary_rule: rule,
    classifier_calibration_version: version,
  } = decision;
  if ([raw, calibrated, threshold, boundary, rule].every((value) => value === undefined)) return null;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="mb-1 text-sm font-medium">{i18n.t("viewLogs.routingDecision.capabilityEstimates", { defaultValue: "Capability estimates" })}</div>
      <div className="mb-2 text-xs text-muted-foreground">{i18n.t("viewLogs.routingDecision.efficientSolveChance", { defaultValue: "Efficient model solve chance" })}</div>
      <PercentageRow label={i18n.t("viewLogs.routingDecision.raw", { defaultValue: "Raw" })} value={raw} />
      <PercentageRow label={i18n.t("viewLogs.routingDecision.calibrated", { defaultValue: "Calibrated" })} value={calibrated} />
      <PercentageRow label={i18n.t("viewLogs.routingDecision.threshold", { defaultValue: "Threshold" })} value={threshold} />
      {boundary && <Row label={i18n.t("viewLogs.routingDecision.boundary", { defaultValue: "Boundary" })}>{boundary}</Row>}
      {rule && <Row label={i18n.t("viewLogs.routingDecision.rule", { defaultValue: "Rule" })}>{rule}</Row>}
      {version && <Row label={i18n.t("viewLogs.routingDecision.calibration", { defaultValue: "Calibration" })}>{version}</Row>}
    </div>
  );
}

function FuseV2Forecast({ decision }: { decision: RoutingDecision }) {
  const {
    classifier_efficient_p_solve: rawEfficient,
    classifier_capable_p_solve: rawCapable,
    classifier_calibrated_efficient_p_solve: calibratedEfficient,
    classifier_calibrated_capable_p_solve: calibratedCapable,
    classifier_max_quality_gap: allowedGap,
    classifier_calibration_version: version,
  } = decision;
  if ([rawEfficient, rawCapable, calibratedEfficient, calibratedCapable, allowedGap].every((v) => v === undefined)) {
    return null;
  }
  const isCalibrated = [calibratedEfficient, calibratedCapable, version].some((value) => value !== undefined);
  const efficient = isCalibrated ? calibratedEfficient : rawEfficient;
  const capable = isCalibrated ? calibratedCapable : rawCapable;
  const gap = efficient !== undefined && capable !== undefined ? capable - efficient : undefined;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="mb-1 text-sm font-medium">{i18n.t("viewLogs.routingDecision.fuseV2Estimates", { defaultValue: "FUSE v2 estimates" })}</div>
      <PercentageRow label={i18n.t("viewLogs.routingDecision.efficientRaw", { defaultValue: "Efficient (raw)" })} value={rawEfficient} />
      <PercentageRow label={i18n.t("viewLogs.routingDecision.capableRaw", { defaultValue: "Capable (raw)" })} value={rawCapable} />
      <PercentageRow label={i18n.t("viewLogs.routingDecision.efficientCalibrated", { defaultValue: "Efficient (calibrated)" })} value={calibratedEfficient} />
      <PercentageRow label={i18n.t("viewLogs.routingDecision.capableCalibrated", { defaultValue: "Capable (calibrated)" })} value={calibratedCapable} />
      <PercentageRow label={i18n.t("viewLogs.routingDecision.appliedGap", { defaultValue: "Applied gap" })} value={gap} unit={i18n.t("viewLogs.routingDecision.percentagePoints", { defaultValue: " percentage points" })} />
      <PercentageRow label={i18n.t("viewLogs.routingDecision.allowedGap", { defaultValue: "Allowed gap" })} value={allowedGap} unit={i18n.t("viewLogs.routingDecision.percentagePoints", { defaultValue: " percentage points" })} />
      {version && <Row label={i18n.t("viewLogs.routingDecision.calibration", { defaultValue: "Calibration" })}>{version}</Row>}
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
    heuristic_v2_forecast: forecast,
  } = decision;

  const scoreExplanation =
    score !== undefined && decision.cause !== "reasoning_override" && decision.cause !== "plan_mode"
      ? describeScoreAgainstBoundaries(score, tierBoundaries, tierLabel !== undefined)
      : null;

  return (
    <div className={cn("mb-6 w-full max-w-full overflow-hidden rounded-lg bg-card shadow-sm", className)}>
      <div className="border-b px-4 py-2.5 text-sm font-medium">{i18n.t("viewLogs.routingDecision.routing", { defaultValue: "Routing" })}</div>
      <div className="px-4 py-3">
        {routerModelName && (
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Waypoints size={14} aria-hidden />
            <span>{routerModelName}</span>
            {routerType && (
              <span className="font-normal text-muted-foreground">
                ({ROUTER_TYPE_LABELS[routerType] ?? routerType})
              </span>
            )}
          </div>
        )}

        {tier && (
          <Row label={i18n.t("viewLogs.routingDecision.tier", { defaultValue: "Tier" })}>
            <Badge variant="secondary" className="font-normal">
              {tierLabel ?? tier}
            </Badge>
          </Row>
        )}

        {requestType && <Row label={i18n.t("viewLogs.routingDecision.requestType", { defaultValue: "Request type" })}>{requestType}</Row>}

        <Row label={i18n.t("viewLogs.routingDecision.decidedBy", { defaultValue: "Decided by" })}>{describeCause(decision)}</Row>
        {decision.classifier_model && <Row label={i18n.t("viewLogs.routingDecision.classifierModel", { defaultValue: "Classifier model" })}>{decision.classifier_model}</Row>}
        {decision.classifier_confidence != null && (
          <Row label={i18n.t("viewLogs.routingDecision.confidence", { defaultValue: "Confidence" })}>{(decision.classifier_confidence * 100).toFixed(1)}%</Row>
        )}
        {decision.classifier_probabilities && (
          <Row label={i18n.t("viewLogs.routingDecision.probabilities", { defaultValue: "Probabilities" })}>
            {Object.entries(decision.classifier_probabilities).map(([name, probability]) => (
              <div key={name}>
                {name}: {(probability * 100).toFixed(1)}%
              </div>
            ))}
          </Row>
        )}
        {decision.classifier_cost != null && <Row label={i18n.t("viewLogs.routingDecision.classifierCost", { defaultValue: "Classifier cost" })}>¥{decision.classifier_cost.toFixed(8)}</Row>}

        {score !== undefined && (
          <Row label={i18n.t("viewLogs.routingDecision.score", { defaultValue: "Score" })}>
            <span className="tabular-nums">{score.toFixed(2)}</span>
            {scoreExplanation && <span className="ml-2 text-muted-foreground">({scoreExplanation})</span>}
          </Row>
        )}

        {routedModel && <Row label={i18n.t("viewLogs.routingDecision.routedTo", { defaultValue: "Routed to" })}>{routedModel}</Row>}

        {escalated !== undefined && <Row label={i18n.t("viewLogs.routingDecision.escalated", { defaultValue: "Escalated" })}>{describeEscalation(escalated, escalationKeyword)}</Row>}

        {forecast && (
          <div className="mt-3 border-t pt-3">
            <div className="mb-1 text-sm font-medium">{i18n.t("viewLogs.routingDecision.heuristicV2Estimates", { defaultValue: "Heuristic v2 estimates" })}</div>
            <Row label={i18n.t("viewLogs.routingDecision.successByTier", { defaultValue: "Success by tier" })}>
              <span className="flex flex-wrap gap-1">
                {["SIMPLE", "MEDIUM", "COMPLEX", "REASONING"].map((predictedTier) => (
                  <Badge key={predictedTier} variant="outline" className="font-normal tabular-nums">
                    {predictedTier} {(forecast.probabilities[predictedTier] * 100).toFixed(1)}%
                  </Badge>
                ))}
              </span>
            </Row>
            <Row label={i18n.t("viewLogs.routingDecision.threshold", { defaultValue: "Threshold" })}>
              <span className="tabular-nums">{(forecast.threshold * 100).toFixed(1)}%</span>
            </Row>
            <Row label={i18n.t("viewLogs.routingDecision.predictedTier", { defaultValue: "Predicted tier" })}>{forecast.predicted_tier}</Row>
            <Row label={i18n.t("viewLogs.routingDecision.requestType", { defaultValue: "Request type" })}>{forecast.request_type}</Row>
          </div>
        )}

        <CapabilityForecast decision={decision} />
        <FuseV2Forecast decision={decision} />

        {signals && signals.length > 0 && (
          <Row label={i18n.t("viewLogs.routingDecision.signals", { defaultValue: "Signals" })}>
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
