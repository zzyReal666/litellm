import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

const ContextWindowEscalationConfig: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const enabled = value.enable_context_window_escalation ?? true;
  // A number input renders Number("0.") as "0", so a decimal cannot be typed without a local draft.
  const [bufferDraft, setBufferDraft] = React.useState<string | null>(null);
  const commitBuffer = (raw: string) => {
    setBufferDraft(null);
    if (raw.trim() === "") {
      onChange({ ...value, context_window_escalation_buffer: undefined });
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onChange({ ...value, context_window_escalation_buffer: Math.min(1, Math.max(0.01, parsed)) });
  };
  const escalationLabel = t("addModel.contextWindowEscalation.enableLabel", {
    defaultValue: "Escalate oversized prompts to a tier that fits",
  });
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={enabled}
          onCheckedChange={(next) => onChange({ ...value, enable_context_window_escalation: next })}
          aria-label={escalationLabel}
        />
        <strong className="font-semibold">{escalationLabel}</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">
        {t("addModel.contextWindowEscalation.enableHint", {
          defaultValue:
            "When a prompt provably cannot fit the decided tier's context windows, route it to the lowest tier whose window holds it instead of letting the provider reject it. Off means requests dispatch on complexity alone.",
        })}
      </span>
      {enabled && (
        <div style={{ maxWidth: 320 }}>
          <label className="block text-sm font-medium mb-1" htmlFor="context-window-escalation-buffer">
            {t("addModel.contextWindowEscalation.bufferLabel", { defaultValue: "Window fit buffer" })}
          </label>
          <Input
            id="context-window-escalation-buffer"
            inputMode="decimal"
            value={bufferDraft ?? value.context_window_escalation_buffer ?? ""}
            placeholder="0.95"
            onChange={(event) => setBufferDraft(event.target.value)}
            onBlur={(event) => commitBuffer(event.target.value)}
          />
          <span className="block text-xs mt-1 text-muted-foreground">
            {t("addModel.contextWindowEscalation.bufferHint", {
              defaultValue:
                "Fraction of a model's window the counted prompt must fit within, above 0 up to 1. Empty tracks the backend default of 0.95.",
            })}
          </span>
        </div>
      )}
    </>
  );
};

export default ContextWindowEscalationConfig;
