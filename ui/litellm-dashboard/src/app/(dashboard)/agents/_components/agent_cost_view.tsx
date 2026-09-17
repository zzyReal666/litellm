import React from "react";
import { useTranslation } from "react-i18next";
import { Agent } from "@/components/agents/types";

interface AgentCostViewProps {
  agent: Agent;
}

interface CostRowLabel {
  labelKey: string;
  label: string;
}

const COST_ROW_LABELS: readonly CostRowLabel[] = [
  { labelKey: "agentsPage.agentCostView.costPerQuery", label: "Cost Per Query" },
  { labelKey: "agentsPage.agentCostView.inputCostPerToken", label: "Input Cost Per Token" },
  { labelKey: "agentsPage.agentCostView.outputCostPerToken", label: "Output Cost Per Token" },
];

const AgentCostView: React.FC<AgentCostViewProps> = ({ agent }) => {
  const { t } = useTranslation();
  const params = agent.litellm_params;

  if (
    params?.cost_per_query === undefined &&
    params?.input_cost_per_token === undefined &&
    params?.output_cost_per_token === undefined
  ) {
    return null;
  }

  const rows = (
    [
      [COST_ROW_LABELS[0], params.cost_per_query],
      [COST_ROW_LABELS[1], params.input_cost_per_token],
      [COST_ROW_LABELS[2], params.output_cost_per_token],
    ] as const
  ).filter(([, value]) => value !== undefined);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-foreground">
        {t("agentsPage.agentCostView.title", { defaultValue: "Cost Configuration" })}
      </h3>
      <dl className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
        {rows.map(([row, value]) => (
          <div key={row.label} className="grid grid-cols-1 sm:grid-cols-3">
            <dt className="bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">
              {t(row.labelKey, { defaultValue: row.label })}
            </dt>
            <dd className="px-4 py-3 text-sm text-foreground sm:col-span-2">${value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default AgentCostView;
