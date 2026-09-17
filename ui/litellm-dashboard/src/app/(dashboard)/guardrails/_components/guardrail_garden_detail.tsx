import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cva.config";
import AddGuardrailForm from "./add_guardrail_form";
import { Logo } from "@/components/molecules/logo/Logo";
import { getGuardrailPresets } from "./guardrail_garden_configs";
import { GuardrailCardInfo } from "./guardrail_garden_data";

interface GuardrailDetailViewProps {
  card: GuardrailCardInfo;
  onBack: () => void;
  accessToken: string | null;
  onGuardrailCreated: () => void;
}

const GuardrailDetailView: React.FC<GuardrailDetailViewProps> = ({ card, onBack, accessToken, onGuardrailCreated }) => {
  const { t } = useTranslation();
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const preset = useMemo(() => getGuardrailPresets(t)[card.id], [t, card.id]);

  const detailRows = [
    {
      property: t("guardrails.guardrailGardenDetail.propertyProvider", { defaultValue: "Provider" }),
      value:
        card.category === "litellm"
          ? t("guardrails.guardrailGardenDetail.litellmContentFilter", { defaultValue: "LiteLLM Content Filter" })
          : t("guardrails.guardrailGardenDetail.partnerGuardrail", { defaultValue: "Partner Guardrail" }),
    },
    ...(card.subcategory
      ? [
          {
            property: t("guardrails.guardrailGardenDetail.propertySubcategory", { defaultValue: "Subcategory" }),
            value: card.subcategory,
          },
        ]
      : []),
    ...(card.category === "litellm"
      ? [
          {
            property: t("guardrails.guardrailGardenDetail.propertyCost", { defaultValue: "Cost" }),
            value: t("guardrails.guardrailGardenDetail.costFree", { defaultValue: "$0 / request" }),
          },
        ]
      : []),
    ...(card.category === "litellm"
      ? [
          {
            property: t("guardrails.guardrailGardenDetail.propertyExternalDeps", {
              defaultValue: "External Dependencies",
            }),
            value: t("guardrails.guardrailGardenDetail.externalDepsNone", { defaultValue: "None" }),
          },
        ]
      : []),
    ...(card.category === "litellm"
      ? [
          {
            property: t("guardrails.guardrailGardenDetail.propertyLatency", { defaultValue: "Latency" }),
            value: card.eval?.latency || "<1ms",
          },
        ]
      : []),
  ];

  const evalRows = card.eval
    ? [
        {
          metric: t("guardrails.guardrailGardenDetail.metricPrecision", { defaultValue: "Precision" }),
          value: `${card.eval.precision}%`,
        },
        {
          metric: t("guardrails.guardrailGardenDetail.metricRecall", { defaultValue: "Recall" }),
          value: `${card.eval.recall}%`,
        },
        {
          metric: t("guardrails.guardrailGardenDetail.metricF1Score", { defaultValue: "F1 Score" }),
          value: `${card.eval.f1}%`,
        },
        {
          metric: t("guardrails.guardrailGardenDetail.metricTestCases", { defaultValue: "Test Cases" }),
          value: String(card.eval.testCases),
        },
        {
          metric: t("guardrails.guardrailGardenDetail.metricFalsePositives", { defaultValue: "False Positives" }),
          value: "0",
        },
        {
          metric: t("guardrails.guardrailGardenDetail.metricFalseNegatives", { defaultValue: "False Negatives" }),
          value: "0",
        },
        {
          metric: t("guardrails.guardrailGardenDetail.metricLatencyP50", { defaultValue: "Latency (p50)" }),
          value: card.eval.latency,
        },
      ]
    : [];

  const tabs = [
    { key: "overview", label: t("guardrails.guardrailGardenDetail.tabOverview", { defaultValue: "Overview" }) },
    ...(card.eval
      ? [{ key: "eval", label: t("guardrails.guardrailGardenDetail.tabEval", { defaultValue: "Eval Results" }) }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[960px]">
      {/* Back link */}
      <div
        onClick={onBack}
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-3" />
        <span>{card.name}</span>
      </div>

      {/* ── Header block (Vertex-style) ── */}
      <div className="mb-2 flex items-center gap-4">
        <Logo src={card.logo} label={card.name} className="w-10 h-10 rounded-lg object-contain shrink-0" />
        <h1 className="m-0 text-[28px] font-normal leading-tight text-foreground">{card.name}</h1>
      </div>

      <p className="m-0 mb-5 text-sm leading-relaxed text-muted-foreground">{card.description}</p>

      {/* Action buttons — outlined style like Vertex */}
      <div className="mb-8 flex gap-2.5">
        <Button variant="outline" className="rounded-full" onClick={() => setIsAddFormVisible(true)}>
          {t("guardrails.guardrailGardenDetail.createGuardrail", { defaultValue: "Create Guardrail" })}
        </Button>
      </div>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div className="mb-7 border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "-mb-px cursor-pointer border-b-[3px] px-5 py-3 text-sm",
                activeTab === tab.key
                  ? "border-info font-medium text-info"
                  : "border-transparent font-normal text-muted-foreground",
              )}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="flex gap-16">
          {/* Left column — overview + details table */}
          <div className="min-w-0 flex-1">
            <h2 className="m-0 mb-3 text-lg font-normal text-foreground">
              {t("guardrails.guardrailGardenDetail.tabOverview", { defaultValue: "Overview" })}
            </h2>
            <p className="m-0 mb-8 text-sm leading-[1.7] text-foreground">{card.description}</p>

            <h2 className="m-0 mb-1 text-lg font-normal text-foreground">
              {t("guardrails.guardrailGardenDetail.guardrailDetails", { defaultValue: "Guardrail Details" })}
            </h2>
            <p className="m-0 mb-4 text-[13px] text-muted-foreground">
              {t("guardrails.guardrailGardenDetail.detailsSubtitle", { defaultValue: "Details are as follows" })}
            </p>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-50 py-3 text-left font-medium text-muted-foreground">
                    {t("guardrails.guardrailGardenDetail.propertyHeader", { defaultValue: "Property" })}
                  </th>
                  <th className="py-3 text-left font-medium text-muted-foreground">{card.name}</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 text-foreground">{row.property}</td>
                    <td className="py-3 text-foreground">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column — metadata sidebar like Vertex */}
          <div className="w-60 shrink-0">
            {/* Guardrail ID */}
            <div className="mb-7">
              <div className="mb-1 text-xs text-muted-foreground">
                {t("guardrails.guardrailGardenDetail.guardrailId", { defaultValue: "Guardrail ID" })}
              </div>
              <div className="break-all text-[13px] text-foreground">litellm/{card.id}</div>
            </div>

            {/* Type */}
            <div className="mb-7">
              <div className="mb-1 text-xs text-muted-foreground">
                {t("guardrails.guardrailGardenDetail.typeLabel", { defaultValue: "Type" })}
              </div>
              <div className="text-[13px] text-foreground">
                {card.category === "litellm"
                  ? t("guardrails.guardrailGardenDetail.typeContentFilter", { defaultValue: "Content Filter" })
                  : t("guardrails.guardrailGardenDetail.typePartner", { defaultValue: "Partner" })}
              </div>
            </div>

            {/* Tags — pill style like Vertex */}
            {card.tags.length > 0 && (
              <div className="mb-7">
                <div className="mb-2 text-xs text-muted-foreground">
                  {t("guardrails.guardrailGardenDetail.tagsLabel", { defaultValue: "Tags" })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-2xl border border-border bg-card px-3 py-1 text-xs text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "eval" && (
        <div>
          <h2 className="m-0 mb-4 text-lg font-normal text-foreground">
            {t("guardrails.guardrailGardenDetail.tabEval", { defaultValue: "Eval Results" })}
          </h2>
          <table className="w-full max-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t("guardrails.guardrailGardenDetail.metricHeader", { defaultValue: "Metric" })}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t("guardrails.guardrailGardenDetail.valueHeader", { defaultValue: "Value" })}
                </th>
              </tr>
            </thead>
            <tbody>
              {evalRows.map((row, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3 text-foreground">{row.metric}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddGuardrailForm
        visible={isAddFormVisible}
        onClose={() => setIsAddFormVisible(false)}
        accessToken={accessToken}
        onSuccess={() => {
          setIsAddFormVisible(false);
          onGuardrailCreated();
        }}
        preset={preset}
      />
    </div>
  );
};

export default GuardrailDetailView;
