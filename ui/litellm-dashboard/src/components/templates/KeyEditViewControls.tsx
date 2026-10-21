import React from "react";
import { Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleHelp } from "lucide-react";
import { FormField } from "@/components/shared/form/FormField";
import AgentSelector from "../agent_management/AgentSelector";
import NumericalInput from "../shared/numerical_input";
import SkillSelector from "../skills/SkillSelector";
import { AgentsAndGroups, KeyEditFormValues } from "./keyEditFormValues";

export const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent className="max-w-xs">{hint}</TooltipContent>
    </Tooltip>
  </>
);

const KEY_TYPE_OPTIONS = [
  {
    value: "default",
    labelKey: "templates.keyEditView.fullAccess",
    label: "Full Access",
    hintKey: "templates.keyEditView.fullAccessDesc",
    hint: "Can call all routes (AI APIs, Management, and read-only)",
  },
  {
    value: "llm_api",
    labelKey: "templates.keyEditView.aiApis",
    label: "AI APIs",
    hintKey: "templates.keyEditView.aiApisDesc",
    hint: "Can call only AI API routes (chat/completions, embeddings, etc.)",
  },
  {
    value: "management",
    labelKey: "templates.keyEditView.management",
    label: "Management",
    hintKey: "templates.keyEditView.managementDesc",
    hint: "Can call only management routes (user/team/key management)",
  },
];

export const KeyTypeSelect = ({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const { t } = useTranslation();
  const keyTypeOptions = KEY_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: t(option.labelKey, { defaultValue: option.label }),
    hint: t(option.hintKey, { defaultValue: option.hint }),
  }));
  return (
    <Select
      items={Object.fromEntries(keyTypeOptions.map((option) => [option.value, option.label]))}
      value={value}
      onValueChange={(next: string | null) => next != null && onChange(next)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={t("templates.keyEditView.selectKeyType", { defaultValue: "Select key type" })} />
      </SelectTrigger>
      <SelectContent>
        {keyTypeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="py-1">
              <div className="font-medium">{option.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{option.hint}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const KeyAgentAndSkillFields = ({
  control,
  accessToken,
}: {
  control: Control<KeyEditFormValues>;
  accessToken: string;
}) => {
  const { t } = useTranslation();
  return (
    <>
      <FormField
        control={control}
        name="agents_and_groups"
        label={t("templates.keyEditView.agents", { defaultValue: "Agents / Access Groups" })}
      >
        {({ value, onChange }) => (
          <AgentSelector
            onChange={onChange}
            value={value as AgentsAndGroups | undefined}
            accessToken={accessToken}
            placeholder={t("templates.keyEditView.selectAgents", {
              defaultValue: "Select agents or access groups (optional)",
            })}
          />
        )}
      </FormField>

      <FormField
        control={control}
        name="skills"
        label={labelWithHint(
          t("templates.keyEditView.skills", { defaultValue: "Skills" }),
          t("templates.keyEditView.skillsTooltip", {
            defaultValue:
              "Enabled skills are visible to every key. Grant disabled (private) Claude Code plugins to this key here.",
          }),
        )}
      >
        {({ value, onChange }) => (
          <SkillSelector onChange={onChange} value={value as string[] | undefined} accessToken={accessToken} />
        )}
      </FormField>
    </>
  );
};

export const KeyBudgetNumberField = ({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<KeyEditFormValues>;
  name: "max_budget" | "soft_budget";
  label: string;
  placeholder: string;
}) => (
  <FormField control={control} name={name} label={label}>
    {({ ref: _ref, ...field }) => (
      <NumericalInput
        {...field}
        value={field.value ?? ""}
        step={0.01}
        style={{ width: "100%" }}
        placeholder={placeholder}
      />
    )}
  </FormField>
);
