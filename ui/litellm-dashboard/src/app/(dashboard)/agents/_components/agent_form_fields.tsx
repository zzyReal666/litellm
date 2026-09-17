import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field";
import { AGENT_FORM_CONFIG, SKILL_FIELD_CONFIG, translateFieldText } from "./agent_config";
import CostConfigFields, { COST_FIELD_NAMES } from "./cost_config_fields";
import {
  AgentFormField,
  AgentFormPanel,
  AgentFormValues,
  AgentTagsInput,
  CollapsiblePanelsState,
  labelWithHint,
} from "./AgentFormKit";

const AUTH_HEADERS_PANEL_KEY = "auth_headers";

const namesOf = (fields: readonly { name: string }[]): readonly string[] => fields.map((field) => field.name);

export const A2A_PANEL_FIELD_NAMES: Readonly<Record<string, readonly string[]>> = {
  [AGENT_FORM_CONFIG.basic.key]: namesOf(AGENT_FORM_CONFIG.basic.fields),
  [AGENT_FORM_CONFIG.skills.key]: ["skills"],
  [AGENT_FORM_CONFIG.capabilities.key]: namesOf(AGENT_FORM_CONFIG.capabilities.fields),
  [AGENT_FORM_CONFIG.optional.key]: namesOf(AGENT_FORM_CONFIG.optional.fields),
  [AGENT_FORM_CONFIG.cost.key]: COST_FIELD_NAMES,
  [AGENT_FORM_CONFIG.litellm.key]: namesOf(AGENT_FORM_CONFIG.litellm.fields),
  [AUTH_HEADERS_PANEL_KEY]: ["static_headers", "extra_headers"],
};

export const unmountedA2AFieldNames = (mountedPanels: readonly string[]): readonly string[] =>
  Object.entries(A2A_PANEL_FIELD_NAMES)
    .filter(([panelKey]) => !mountedPanels.includes(panelKey))
    .flatMap(([, fieldNames]) => fieldNames);

interface AgentFormFieldsProps {
  panels: CollapsiblePanelsState;
  showAgentName?: boolean;
  visiblePanels?: string[];
}

const SkillsFieldArray = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<AgentFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "skills" });

  return (
    <>
      {fields.map((item, index) => (
        <div key={item.id} className="rounded-md border border-border p-4">
          <FieldGroup>
            <AgentFormField
              name={`skills.${index}.id`}
              label={translateFieldText(t, SKILL_FIELD_CONFIG.id.labelKey, SKILL_FIELD_CONFIG.id.label)}
              rules={
                SKILL_FIELD_CONFIG.id.required
                  ? { required: t("common.required", { defaultValue: "Required" }) }
                  : undefined
              }
            >
              {({ value, onChange, ref, ...control }) => (
                <Input
                  {...control}
                  ref={ref}
                  placeholder={translateFieldText(
                    t,
                    SKILL_FIELD_CONFIG.id.placeholderKey,
                    SKILL_FIELD_CONFIG.id.placeholder,
                  )}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                />
              )}
            </AgentFormField>

            <AgentFormField
              name={`skills.${index}.name`}
              label={translateFieldText(t, SKILL_FIELD_CONFIG.name.labelKey, SKILL_FIELD_CONFIG.name.label)}
              rules={
                SKILL_FIELD_CONFIG.name.required
                  ? { required: t("common.required", { defaultValue: "Required" }) }
                  : undefined
              }
            >
              {({ value, onChange, ref, ...control }) => (
                <Input
                  {...control}
                  ref={ref}
                  placeholder={translateFieldText(
                    t,
                    SKILL_FIELD_CONFIG.name.placeholderKey,
                    SKILL_FIELD_CONFIG.name.placeholder,
                  )}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                />
              )}
            </AgentFormField>

            <AgentFormField
              name={`skills.${index}.description`}
              label={translateFieldText(
                t,
                SKILL_FIELD_CONFIG.description.labelKey,
                SKILL_FIELD_CONFIG.description.label,
              )}
              rules={
                SKILL_FIELD_CONFIG.description.required
                  ? { required: t("common.required", { defaultValue: "Required" }) }
                  : undefined
              }
            >
              {({ value, onChange, ref, ...control }) => (
                <Textarea
                  {...control}
                  ref={ref}
                  rows={SKILL_FIELD_CONFIG.description.rows}
                  placeholder={translateFieldText(
                    t,
                    SKILL_FIELD_CONFIG.description.placeholderKey,
                    SKILL_FIELD_CONFIG.description.placeholder,
                  )}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                />
              )}
            </AgentFormField>

            <AgentFormField
              name={`skills.${index}.tags`}
              label={translateFieldText(t, SKILL_FIELD_CONFIG.tags.labelKey, SKILL_FIELD_CONFIG.tags.label)}
              rules={
                SKILL_FIELD_CONFIG.tags.required
                  ? { required: t("common.required", { defaultValue: "Required" }) }
                  : undefined
              }
            >
              {({ id, value, onChange }) => (
                <AgentTagsInput
                  id={id}
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onValueChange={onChange}
                  placeholder={translateFieldText(
                    t,
                    SKILL_FIELD_CONFIG.tags.placeholderKey,
                    SKILL_FIELD_CONFIG.tags.placeholder,
                  )}
                />
              )}
            </AgentFormField>

            <AgentFormField
              name={`skills.${index}.examples`}
              label={translateFieldText(t, SKILL_FIELD_CONFIG.examples.labelKey, SKILL_FIELD_CONFIG.examples.label)}
            >
              {({ id, value, onChange }) => (
                <AgentTagsInput
                  id={id}
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onValueChange={onChange}
                  placeholder={translateFieldText(
                    t,
                    SKILL_FIELD_CONFIG.examples.placeholderKey,
                    SKILL_FIELD_CONFIG.examples.placeholder,
                  )}
                />
              )}
            </AgentFormField>
          </FieldGroup>

          <Button
            type="button"
            variant="ghost"
            className="mt-4 text-destructive hover:text-destructive/80"
            onClick={() => remove(index)}
          >
            <Trash2 />
            {t("agentsPage.agentFormFields.removeSkill", { defaultValue: "Remove Skill" })}
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({})}>
        <Plus />
        {t("agentsPage.agentFormFields.addSkill", { defaultValue: "Add Skill" })}
      </Button>
    </>
  );
};

const StaticHeadersFieldArray = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<AgentFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "static_headers" });

  return (
    <>
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          <AgentFormField
            name={`static_headers.${index}.header`}
            rules={{
              required: t("agentsPage.agentFormFields.headerNameRequired", { defaultValue: "Header name required" }),
            }}
          >
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                className="w-55"
                placeholder={t("agentsPage.agentFormFields.headerNamePlaceholder", {
                  defaultValue: "Header name (e.g. Authorization)",
                })}
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
          <AgentFormField
            name={`static_headers.${index}.value`}
            rules={{
              required: t("agentsPage.agentFormFields.headerValueRequired", { defaultValue: "Value required" }),
            }}
          >
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                className="w-65"
                placeholder={t("agentsPage.agentFormFields.headerValuePlaceholder", {
                  defaultValue: "Value (e.g. Bearer token123)",
                })}
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("agentsPage.agentFormFields.removeStaticHeader", { defaultValue: "Remove static header" })}
            className="text-destructive hover:text-destructive/80"
            onClick={() => remove(index)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({})}>
        <Plus />
        {t("agentsPage.agentFormFields.addStaticHeader", { defaultValue: "Add Static Header" })}
      </Button>
    </>
  );
};

const AgentFormFields: React.FC<AgentFormFieldsProps> = ({ panels, showAgentName = true, visiblePanels }) => {
  const { t } = useTranslation();
  const shouldShow = (key: string) => !visiblePanels || visiblePanels.includes(key);

  return (
    <>
      {showAgentName && (
        <FieldGroup className="mb-4">
          <AgentFormField
            name="agent_name"
            label={labelWithHint(
              t("agentsPage.agentFormFields.agentNameLabel", { defaultValue: "Agent Name" }),
              t("agentsPage.agentFormFields.agentNameTooltip", { defaultValue: "Unique identifier for the agent" }),
            )}
            rules={{
              required: t("agentsPage.agentFormFields.agentNameRequired", {
                defaultValue: "Please enter a unique agent name",
              }),
            }}
          >
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                placeholder={t("agentsPage.agentFormFields.agentNamePlaceholder", {
                  defaultValue: "e.g., customer-support-agent",
                })}
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
        </FieldGroup>
      )}

      <div className="mb-4 rounded-md border border-border px-4">
        {shouldShow(AGENT_FORM_CONFIG.basic.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.basic.key}
            title={`${t(AGENT_FORM_CONFIG.basic.titleKey, {
              defaultValue: AGENT_FORM_CONFIG.basic.title,
            })} ${t("agentsPage.agentFormFields.requiredSuffix", { defaultValue: "(Required)" })}`}
            panels={panels}
          >
            {AGENT_FORM_CONFIG.basic.fields.map((field) => (
              <AgentFormField
                key={field.name}
                name={field.name}
                label={
                  field.tooltipKey && field.tooltip
                    ? labelWithHint(
                        translateFieldText(t, field.labelKey, field.label),
                        translateFieldText(t, field.tooltipKey, field.tooltip),
                      )
                    : translateFieldText(t, field.labelKey, field.label)
                }
                description={translateFieldText(t, field.helpTextKey, field.helpText)}
                rules={
                  field.required
                    ? {
                        required: t("agentsPage.agentFormFields.pleaseEnterField", {
                          defaultValue: "Please enter {{field}}",
                          field: (translateFieldText(t, field.labelKey, field.label) ?? "").toLowerCase(),
                        }),
                      }
                    : undefined
                }
              >
                {({ value, onChange, ref, ...control }) => {
                  const text = typeof value === "string" ? value : "";
                  if (field.type === "textarea") {
                    return (
                      <Textarea
                        {...control}
                        ref={ref}
                        rows={field.rows}
                        placeholder={translateFieldText(t, field.placeholderKey, field.placeholder)}
                        value={text}
                        onChange={onChange}
                      />
                    );
                  }
                  if (field.type === "select") {
                    return (
                      <Select value={text || null} onValueChange={onChange}>
                        <SelectTrigger {...control} className="w-full">
                          <SelectValue placeholder={translateFieldText(t, field.placeholderKey, field.placeholder)} />
                        </SelectTrigger>
                        <SelectContent>
                          {(field.options ?? []).map((option) => (
                            <SelectItem key={option} value={option} title={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }
                  return (
                    <Input
                      {...control}
                      ref={ref}
                      placeholder={translateFieldText(t, field.placeholderKey, field.placeholder)}
                      value={text}
                      onChange={onChange}
                    />
                  );
                }}
              </AgentFormField>
            ))}
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.skills.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.skills.key}
            title={t(AGENT_FORM_CONFIG.skills.titleKey, { defaultValue: AGENT_FORM_CONFIG.skills.title })}
            panels={panels}
          >
            <SkillsFieldArray />
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.capabilities.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.capabilities.key}
            title={t(AGENT_FORM_CONFIG.capabilities.titleKey, { defaultValue: AGENT_FORM_CONFIG.capabilities.title })}
            panels={panels}
          >
            {AGENT_FORM_CONFIG.capabilities.fields.map((field) => (
              <AgentFormField
                key={field.name}
                name={field.name}
                label={translateFieldText(t, field.labelKey, field.label)}
              >
                {({ value, onChange, ref, ...control }) => (
                  <Switch {...control} inputRef={ref} checked={value === true} onCheckedChange={onChange} />
                )}
              </AgentFormField>
            ))}
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.optional.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.optional.key}
            title={t(AGENT_FORM_CONFIG.optional.titleKey, { defaultValue: AGENT_FORM_CONFIG.optional.title })}
            panels={panels}
          >
            {AGENT_FORM_CONFIG.optional.fields.map((field) => (
              <AgentFormField
                key={field.name}
                name={field.name}
                label={translateFieldText(t, field.labelKey, field.label)}
              >
                {({ value, onChange, ref, ...control }) =>
                  field.type === "switch" ? (
                    <Switch {...control} inputRef={ref} checked={value === true} onCheckedChange={onChange} />
                  ) : (
                    <Input
                      {...control}
                      ref={ref}
                      placeholder={translateFieldText(t, field.placeholderKey, field.placeholder)}
                      value={typeof value === "string" ? value : ""}
                      onChange={onChange}
                    />
                  )
                }
              </AgentFormField>
            ))}
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.cost.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.cost.key}
            title={t(AGENT_FORM_CONFIG.cost.titleKey, { defaultValue: AGENT_FORM_CONFIG.cost.title })}
            panels={panels}
          >
            <CostConfigFields />
          </AgentFormPanel>
        )}

        {shouldShow(AGENT_FORM_CONFIG.litellm.key) && (
          <AgentFormPanel
            panelKey={AGENT_FORM_CONFIG.litellm.key}
            title={t(AGENT_FORM_CONFIG.litellm.titleKey, { defaultValue: AGENT_FORM_CONFIG.litellm.title })}
            panels={panels}
          >
            {AGENT_FORM_CONFIG.litellm.fields.map((field) => (
              <AgentFormField
                key={field.name}
                name={field.name}
                label={translateFieldText(t, field.labelKey, field.label)}
              >
                {({ value, onChange, ref, ...control }) =>
                  field.type === "switch" ? (
                    <Switch {...control} inputRef={ref} checked={value === true} onCheckedChange={onChange} />
                  ) : (
                    <Input
                      {...control}
                      ref={ref}
                      placeholder={translateFieldText(t, field.placeholderKey, field.placeholder)}
                      value={typeof value === "string" ? value : ""}
                      onChange={onChange}
                    />
                  )
                }
              </AgentFormField>
            ))}
          </AgentFormPanel>
        )}

        {shouldShow(AUTH_HEADERS_PANEL_KEY) && (
          <AgentFormPanel
            panelKey={AUTH_HEADERS_PANEL_KEY}
            title={t("agentsPage.agentFormFields.authHeadersTitle", { defaultValue: "Authentication Headers" })}
            panels={panels}
          >
            <Field>
              <FieldTitle>
                {labelWithHint(
                  t("agentsPage.agentFormFields.staticHeadersLabel", { defaultValue: "Static Headers" }),
                  t("agentsPage.agentFormFields.staticHeadersTooltip", {
                    defaultValue:
                      "Headers always sent to the backend agent, regardless of the client request. Admin-configured, static wins on conflict.",
                  }),
                )}
              </FieldTitle>
              <div className="flex flex-col gap-2">
                <StaticHeadersFieldArray />
              </div>
            </Field>

            <AgentFormField
              name="extra_headers"
              label={labelWithHint(
                t("agentsPage.agentFormFields.forwardClientHeadersLabel", {
                  defaultValue: "Forward Client Headers",
                }),
                t("agentsPage.agentFormFields.forwardClientHeadersTooltip", {
                  defaultValue:
                    "Header names to extract from the client's request and forward to the agent. Type a name and press Enter.",
                }),
              )}
            >
              {({ id, value, onChange }) => (
                <AgentTagsInput
                  id={id}
                  value={Array.isArray(value) ? (value as string[]) : []}
                  onValueChange={onChange}
                  placeholder={t("agentsPage.agentFormFields.forwardClientHeadersPlaceholder", {
                    defaultValue: "e.g. x-api-key, Authorization",
                  })}
                />
              )}
            </AgentFormField>
          </AgentFormPanel>
        )}
      </div>
    </>
  );
};

export default AgentFormFields;
