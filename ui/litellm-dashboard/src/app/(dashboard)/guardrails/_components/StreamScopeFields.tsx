import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import i18n from "@/lib/i18n";
import { GuardrailField, labelWithHint, type GuardrailFormControl } from "./GuardrailFormField";
import { guardrailModeLabel } from "./guardrail_display_labels";
import {
  formatGuardrailStreamScope,
  getStreamScopeOptions,
  type GuardrailStreamScope,
  isGuardrailStreamScope,
} from "./guardrail_info_helpers";

const REQUEST_SHAPE_HINT = () =>
  i18n.t("guardrails.streamScopeFields.requestShapeHint", {
    defaultValue: "Run this guardrail on streaming requests, non-streaming requests, or both, for each selected mode.",
  });

export const StreamScopeFields = ({
  modes,
  value,
  onChange,
}: {
  modes: string[];
  value: Record<string, GuardrailStreamScope>;
  onChange: (next: Record<string, GuardrailStreamScope>) => void;
}) => {
  if (modes.length === 0) return null;
  const streamScopeOptions = getStreamScopeOptions();

  return (
    <div className="space-y-3">
      {modes.map((mode) => {
        const selected = value[mode] ?? "both";
        return (
          <div key={mode} className="space-y-1">
            <label htmlFor={`stream-scope-${mode}`} className="block text-sm font-medium text-foreground">
              {i18n.t("guardrails.streamScopeFields.appliesTo", {
                defaultValue: "{{mode}} applies to",
                mode: guardrailModeLabel(mode),
              })}
            </label>
            <Select
              items={streamScopeOptions}
              value={selected}
              onValueChange={(next: GuardrailStreamScope | null) => {
                if (!isGuardrailStreamScope(next)) return;
                onChange({ ...value, [mode]: next });
              }}
            >
              <SelectTrigger id={`stream-scope-${mode}`} className="w-full">
                <SelectValue
                  placeholder={i18n.t("guardrails.streamScopeFields.streamingAndNonStreaming", {
                    defaultValue: "Streaming and non-streaming",
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {streamScopeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
};

export const StreamScopeFormField = ({ control, modes }: { control: GuardrailFormControl; modes: string[] }) => (
  <GuardrailField
    control={control}
    name="stream_scope_by_mode"
    label={labelWithHint(
      i18n.t("guardrails.streamScopeFields.requestShape", { defaultValue: "Request shape" }),
      REQUEST_SHAPE_HINT(),
    )}
  >
    {({ value, onChange }) => (
      <StreamScopeFields
        modes={modes}
        value={(value as Record<string, GuardrailStreamScope> | undefined) ?? {}}
        onChange={onChange}
      />
    )}
  </GuardrailField>
);

export const GuardrailStreamScopeCaption = ({ raw }: { raw: unknown }) => {
  const label = formatGuardrailStreamScope(raw);
  if (!label) return null;
  return <p className="mt-1 text-sm text-muted-foreground">{label}</p>;
};

export const GuardrailStreamScopeDetail = ({ raw }: { raw: unknown }) => {
  const label = formatGuardrailStreamScope(raw);
  if (!label) return null;
  return (
    <div>
      <p className="font-medium">
        {i18n.t("guardrails.streamScopeFields.requestShape", { defaultValue: "Request shape" })}
      </p>
      <div>{label}</div>
    </div>
  );
};
