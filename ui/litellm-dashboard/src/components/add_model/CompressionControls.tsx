import { SimpleTooltip } from "@/components/ui/tooltip";
import { SearchSelect, SearchSelectOption } from "@/components/shared/SearchSelect";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";
import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useGuardrails } from "@/app/(dashboard)/hooks/guardrails/useGuardrails";
import {
  AutoRouterCompressionState,
  isCompressionGuardrailProvider,
  NO_COMPRESSION,
} from "./buildAutoRouterCompression";

interface CompressionControlsProps {
  value: AutoRouterCompressionState;
  onChange: (state: AutoRouterCompressionState) => void;
}

const NONE_OPTION_LABEL = "None (no compression)";

const translateNoneOption = (t: TFunction): string =>
  t("addModel.compression.noneOption", { defaultValue: NONE_OPTION_LABEL });

const CompressionControls: React.FC<CompressionControlsProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { routing, sameAsRouting, model } = value;
  const onRoutingChange = (newRouting: string | undefined) => onChange({ ...value, routing: newRouting });
  const onSameAsRoutingChange = (newSameAsRouting: boolean) => onChange({ ...value, sameAsRouting: newSameAsRouting });
  const onModelChange = (newModel: string | undefined) => onChange({ ...value, model: newModel });

  const { data } = useGuardrails();
  const compressionOptions: SearchSelectOption[] = (data?.guardrails ?? [])
    .filter((g) => isCompressionGuardrailProvider(g.litellm_params?.guardrail))
    .map((g) => ({ label: g.guardrail_name, value: g.guardrail_name }));
  const options: SearchSelectOption[] = [
    { label: translateNoneOption(t), value: NO_COMPRESSION },
    ...compressionOptions,
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium">
            {t("addModel.compression.routingDecisionLabel", { defaultValue: "Routing decision" })}
          </span>
          <SimpleTooltip
            content={t("addModel.compression.routingDecisionTooltip", {
              defaultValue:
                "Compression applied to the classifier's own call that picks a tier, separate from the model the request routes to.",
            })}
          >
            <Info className="size-4 text-muted-foreground" />
          </SimpleTooltip>
        </div>
        <SearchSelect
          options={options}
          value={routing}
          onValueChange={(value) => onRoutingChange(value ?? undefined)}
          placeholder={t("addModel.compression.inheritPlaceholder", {
            defaultValue: "Inherit from the request's own compression guardrails",
          })}
          emptyText={t("addModel.compression.emptyText", { defaultValue: "No compression guardrails found" })}
          aria-label={t("addModel.compression.routingDecisionAriaLabel", {
            defaultValue: "Routing decision compression",
          })}
        />
      </div>

      {routing !== undefined && (
        <div>
          <span className="mb-2 block text-sm font-medium">
            {t("addModel.compression.modelCallLabel", { defaultValue: "Model call" })}
          </span>
          <RadioGroup
            value={sameAsRouting ? "same" : "different"}
            onValueChange={(value: unknown) => onSameAsRoutingChange(value === "same")}
            className="w-full"
          >
            <div className="flex w-full flex-col items-start gap-2">
              <Label className="items-start font-normal leading-normal">
                <RadioGroupItem value="same" className="mt-0.5" />
                <span>{t("addModel.compression.sameAsRouting", { defaultValue: "Same as the routing decision" })}</span>
              </Label>
              <Label className="items-start font-normal leading-normal">
                <RadioGroupItem value="different" className="mt-0.5" />
                <span>
                  {t("addModel.compression.useDifferentCompression", { defaultValue: "Use a different compression" })}
                </span>
              </Label>
            </div>
          </RadioGroup>

          {!sameAsRouting && (
            <div className="mt-3">
              <SearchSelect
                options={options}
                value={model}
                onValueChange={(value) => onModelChange(value ?? undefined)}
                placeholder={translateNoneOption(t)}
                emptyText={t("addModel.compression.emptyText", { defaultValue: "No compression guardrails found" })}
                aria-label={t("addModel.compression.modelCallAriaLabel", { defaultValue: "Model call compression" })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompressionControls;
