import { Badge } from "@/components/ui/badge";
import i18n from "@/lib/i18n";
import { DEFAULT_DECISION_THRESHOLD } from "./decision_model/decisionModelQuestion";
import { GuardrailModeRows } from "./GuardrailModeDisplay";
import { GuardrailStreamScopeDetail } from "./StreamScopeFields";
import ToolPermissionRulesEditor, { type ToolPermissionConfig } from "./tool_permission/ToolPermissionRulesEditor";

interface DecisionModelCheckView {
  name: string;
  action?: string;
  threshold?: number;
  instructions?: string;
}

const DecisionModelSection = ({
  decisionModel,
  checks,
}: {
  decisionModel: string;
  checks: DecisionModelCheckView[];
}) => (
  <div>
    <p className="font-medium">{i18n.t("guardrails.decisionModel.decisionModelLabel", { defaultValue: "Decision Model" })}</p>
    <div className="font-mono">{decisionModel}</div>
    <p className="mt-2 font-medium">{i18n.t("guardrails.decisionModel.checks", { defaultValue: "Checks" })}</p>
    <div className="mt-2 overflow-hidden rounded-lg border border-border">
      <div className="flex border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold">
        <span className="flex-1">{i18n.t("guardrails.decisionModel.check", { defaultValue: "Check" })}</span>
        <span className="w-24 text-right">{i18n.t("guardrails.decisionModel.action", { defaultValue: "Action" })}</span>
        <span className="w-24 text-right">{i18n.t("guardrails.decisionModel.threshold", { defaultValue: "Threshold" })}</span>
      </div>
      {checks.map((check) => (
        <div key={check.name} className="flex items-center border-b border-border px-4 py-2 text-sm last:border-b-0">
          <span className="flex-1">{check.name.replace(/_/g, " ")}</span>
          <span className="w-24 text-right">
            <Badge variant="secondary">{check.action ?? "block"}</Badge>
          </span>
          <span className="w-24 text-right">{check.threshold ?? DEFAULT_DECISION_THRESHOLD}</span>
        </div>
      ))}
    </div>
  </div>
);

export const GuardrailReadOnlyDetails = ({
  guardrailId,
  guardrailName,
  displayName,
  litellmParams,
  streamScope,
  defaultOn,
  piiEntityCount,
  createdAt,
  updatedAt,
  showToolPermission,
  toolPermissionConfig,
}: {
  guardrailId: string;
  guardrailName: string;
  displayName: string;
  litellmParams: {
    mode?: unknown;
    logging_only_scope?: string | null;
    guardrail?: string;
    decision_model?: string;
    checks?: DecisionModelCheckView[];
    logging_only_continue_on_input_failure?: boolean | null;
  };
  streamScope: unknown;
  defaultOn: boolean | undefined;
  piiEntityCount: number;
  createdAt: string;
  updatedAt: string;
  showToolPermission: boolean;
  toolPermissionConfig: ToolPermissionConfig;
}) => (
  <div className="space-y-4">
    <div>
      <p className="font-medium">{i18n.t("guardrails.guardrailInfo.guardrailIdLabel", { defaultValue: "Guardrail ID" })}</p>
      <div className="font-mono">{guardrailId}</div>
    </div>
    <div>
      <p className="font-medium">{i18n.t("guardrails.editGuardrailForm.guardrailNameLabel", { defaultValue: "Guardrail Name" })}</p>
      <div>{guardrailName || i18n.t("guardrails.guardrailInfo.unnamedGuardrail", { defaultValue: "Unnamed Guardrail" })}</div>
    </div>
    <div>
      <p className="font-medium">{i18n.t("guardrails.guardrailInfo.provider", { defaultValue: "Provider" })}</p>
      <div>{displayName}</div>
    </div>
    <GuardrailModeRows litellmParams={litellmParams} />
    <GuardrailStreamScopeDetail raw={streamScope} />
    <div>
      <p className="font-medium">{i18n.t("guardrails.guardrailInfo.defaultOn", { defaultValue: "Default On" })}</p>
      <Badge variant={defaultOn ? "secondary" : "outline"}>
        {defaultOn ? i18n.t("common.yes", { defaultValue: "Yes" }) : i18n.t("common.no", { defaultValue: "No" })}
      </Badge>
    </div>
    {litellmParams.guardrail === "decision_model" && litellmParams.decision_model && (
      <DecisionModelSection decisionModel={litellmParams.decision_model} checks={litellmParams.checks ?? []} />
    )}
    {piiEntityCount > 0 && (
      <div>
        <p className="font-medium">{i18n.t("guardrails.guardrailInfo.piiProtection", { defaultValue: "PII Protection" })}</p>
        <div className="mt-2">
          <Badge variant="secondary">{i18n.t("guardrails.guardrailInfo.piiEntitiesConfigured", { count: piiEntityCount })}</Badge>
        </div>
      </div>
    )}
    <div>
      <p className="font-medium">{i18n.t("guardrails.guardrailInfo.createdAt", { defaultValue: "Created At" })}</p>
      <div>{createdAt}</div>
    </div>
    <div>
      <p className="font-medium">{i18n.t("guardrails.guardrailInfo.lastUpdatedLabel", { defaultValue: "Last Updated" })}</p>
      <div>{updatedAt}</div>
    </div>
    {showToolPermission && <ToolPermissionRulesEditor value={toolPermissionConfig} disabled />}
  </div>
);
