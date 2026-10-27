import React from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldTitle } from "@/components/ui/field";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { AgentFormField, AgentFormValues, labelWithHint } from "./AgentFormKit";
import i18n from "@/lib/i18n";
import { KILL_SWITCH_AUTH_TYPES, KILL_SWITCH_METHODS, validateKillSwitchBody } from "./kill_switch_config";

const KeyValueFieldArray = ({
  name,
  addLabel,
  removeLabel,
  keyPlaceholder,
  valuePlaceholder,
}: {
  name: "kill_switch.headers" | "kill_switch.query_params";
  addLabel: string;
  removeLabel: string;
  keyPlaceholder: string;
  valuePlaceholder: string;
}) => {
  const { control } = useFormContext<AgentFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="flex flex-col gap-2">
      {fields.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          <AgentFormField name={`${name}.${index}.key`} rules={{ required: i18n.t("agents.killSwitchFields.nameRequired", { defaultValue: "Name required" }) }}>
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                className="w-55"
                placeholder={keyPlaceholder}
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
          <AgentFormField name={`${name}.${index}.value`}>
            {({ value, onChange, ref, ...control }) => (
              <Input
                {...control}
                ref={ref}
                className="w-65"
                placeholder={valuePlaceholder}
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
              />
            )}
          </AgentFormField>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={removeLabel}
            className="text-destructive hover:text-destructive/80"
            onClick={() => remove(index)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({})}>
        <Plus />
        {addLabel}
      </Button>
    </div>
  );
};

const TextField = ({
  name,
  label,
  placeholder,
  required,
  secret,
}: {
  name: `kill_switch.${string}`;
  label: React.ReactNode;
  placeholder?: string;
  required?: string;
  secret?: boolean;
}) => (
  <AgentFormField name={name} label={label} rules={required ? { required } : undefined}>
    {({ value, onChange, ref, ...control }) =>
      secret ? (
        <PasswordInput
          {...control}
          ref={ref}
          placeholder={placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      ) : (
        <Input
          {...control}
          ref={ref}
          placeholder={placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      )
    }
  </AgentFormField>
);

const KillSwitchAuthFields = () => {
  const { control } = useFormContext<AgentFormValues>();
  const authType = useWatch({ control, name: "kill_switch.auth_type" });

  switch (authType) {
    case "bearer":
      return <TextField name="kill_switch.auth_token" label={i18n.t("agents.killSwitchFields.bearerToken", { defaultValue: "Bearer token" })} required={i18n.t("agents.killSwitchFields.tokenRequired", { defaultValue: "Token required" })} secret />;
    case "api_key":
      return (
        <>
          <TextField name="kill_switch.auth_header_name" label={i18n.t("agents.killSwitchFields.headerName", { defaultValue: "Header name" })} placeholder="X-API-Key" />
          <TextField name="kill_switch.auth_api_key" label={i18n.t("agents.killSwitchFields.apiKey", { defaultValue: "API key" })} required={i18n.t("agents.killSwitchFields.apiKeyRequired", { defaultValue: "API key required" })} secret />
        </>
      );
    case "basic":
      return (
        <>
          <TextField name="kill_switch.auth_username" label={i18n.t("agents.killSwitchFields.username", { defaultValue: "Username" })} required={i18n.t("agents.killSwitchFields.usernameRequired", { defaultValue: "Username required" })} />
          <TextField name="kill_switch.auth_password" label={i18n.t("agents.killSwitchFields.password", { defaultValue: "Password" })} required={i18n.t("agents.killSwitchFields.passwordRequired", { defaultValue: "Password required" })} secret />
        </>
      );
    default:
      return null;
  }
};

const KillSwitchFormFields = () => (
  <>
    <TextField
      name="kill_switch.url"
      label={labelWithHint(
        i18n.t("agents.killSwitchFields.webhookUrl", { defaultValue: "Webhook URL" }),
        i18n.t("agents.killSwitchFields.webhookUrlHint", { defaultValue: "Absolute http(s) URL 中安云科 AI 安全网关 calls when the kill switch is triggered. Leave empty to remove the kill switch." }),
      )}
      placeholder="https://example.com/hooks/kill-agent"
    />

    <AgentFormField name="kill_switch.method" label={i18n.t("agents.killSwitchFields.method", { defaultValue: "Method" })}>
      {({ value, onChange, ref: _ref, ...control }) => (
        <Select value={typeof value === "string" ? value : "POST"} onValueChange={onChange}>
          <SelectTrigger {...control} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KILL_SWITCH_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </AgentFormField>

    <Field>
      <FieldTitle>{i18n.t("agents.killSwitchFields.headers", { defaultValue: "Headers" })}</FieldTitle>
      <KeyValueFieldArray
        name="kill_switch.headers"
        addLabel={i18n.t("agents.killSwitchFields.addHeader", { defaultValue: "Add Header" })}
        removeLabel={i18n.t("agents.killSwitchFields.removeHeader", { defaultValue: "Remove header" })}
        keyPlaceholder={i18n.t("agents.killSwitchFields.headerName", { defaultValue: "Header name" })}
        valuePlaceholder={i18n.t("agents.killSwitchFields.headerValue", { defaultValue: "Header value" })}
      />
    </Field>

    <Field>
      <FieldTitle>{i18n.t("agents.killSwitchFields.queryParameters", { defaultValue: "Query Parameters" })}</FieldTitle>
      <KeyValueFieldArray
        name="kill_switch.query_params"
        addLabel={i18n.t("agents.killSwitchFields.addQueryParameter", { defaultValue: "Add Query Parameter" })}
        removeLabel={i18n.t("agents.killSwitchFields.removeQueryParameter", { defaultValue: "Remove query parameter" })}
        keyPlaceholder={i18n.t("agents.killSwitchFields.parameterName", { defaultValue: "Parameter name" })}
        valuePlaceholder={i18n.t("agents.killSwitchFields.parameterValue", { defaultValue: "Parameter value" })}
      />
    </Field>

    <AgentFormField
      name="kill_switch.body"
      label={labelWithHint(i18n.t("agents.killSwitchFields.jsonBody", { defaultValue: "JSON Body" }), i18n.t("agents.killSwitchFields.jsonBodyHint", { defaultValue: "Optional JSON object sent as the request body" }))}
      rules={{ validate: (value) => validateKillSwitchBody(typeof value === "string" ? value : "") }}
    >
      {({ value, onChange, ref, ...control }) => (
        <Textarea
          {...control}
          ref={ref}
          rows={4}
          placeholder='{"reason": "manual kill switch"}'
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      )}
    </AgentFormField>

    <AgentFormField name="kill_switch.auth_type" label={i18n.t("agents.killSwitchFields.authentication", { defaultValue: "Authentication" })}>
      {({ value, onChange, ref: _ref, ...control }) => (
        <Select value={typeof value === "string" ? value : "none"} onValueChange={onChange}>
          <SelectTrigger {...control} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KILL_SWITCH_AUTH_TYPES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </AgentFormField>

    <KillSwitchAuthFields />
  </>
);

export default KillSwitchFormFields;
