import i18n from "@/lib/i18n";
import React from "react";
import { useTranslation } from "react-i18next";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { PasswordInput } from "@/components/shared/PasswordInput";
import NumericalInput from "@/components/shared/numerical_input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  asStringArray,
  asText,
  GuardrailField,
  readRecord,
  requiredRule,
  type GuardrailFieldControlProps,
  type GuardrailFormControl,
} from "./GuardrailFormField";
import {
  providerParamDescription,
  providerParamFieldLabel,
  providerParamOptionLabel,
  untranslatedDescription,
} from "./guardrail_display_labels";

interface ProviderParam {
  param: string;
  description: string;
  required: boolean;
  default_value?: string;
  options?: string[];
  type?: string;
  fields?: { [key: string]: ProviderParam };
  dict_key_options?: string[];
  dict_value_type?: string;
}

interface GuardrailOptionalParamsProps {
  optionalParams: ProviderParam;
  parentFieldKey: string;
  control: GuardrailFormControl;
  values?: Record<string, unknown>;
  providerKey?: string | null;
}

interface DictFieldProps {
  field: ProviderParam;
  fullFieldKey: string;
  control: GuardrailFormControl;
  value: unknown;
  providerKey: string | null;
}

const isSecretKey = (fieldKey: string): boolean =>
  fieldKey.includes("password") || fieldKey.includes("secret") || fieldKey.includes("key");

const toNumberValue = (raw: unknown): unknown => {
  if (raw === null || raw === undefined || raw === "") return undefined;
  const num = Number(raw);
  return isNaN(num) ? raw : num;
};

const BooleanSelect: React.FC<{ control: GuardrailFieldControlProps; placeholder?: string }> = ({
  control,
  placeholder,
}) => {
  const { t } = useTranslation();
  const { id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy } = control;
  const booleanItems = [
    { label: t("guardrails.guardrailOptionalParams.boolTrue", { defaultValue: "True" }), value: true },
    { label: t("guardrails.guardrailOptionalParams.boolFalse", { defaultValue: "False" }), value: false },
  ];

  return (
    <Select
      items={booleanItems}
      value={typeof value === "boolean" ? value : null}
      onValueChange={(next: boolean | null) => onChange(next)}
    >
      <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {booleanItems.map((item) => (
          <SelectItem key={String(item.value)} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const DictField: React.FC<DictFieldProps> = ({ field, fullFieldKey, control, value, providerKey }) => {
  const [selectedEntries, setSelectedEntries] = React.useState<Array<{ key: string; id: string }>>([]);
  const [availableKeys, setAvailableKeys] = React.useState<string[]>(field.dict_key_options || []);

  // Initialize selectedEntries and availableKeys based on existing value
  React.useEffect(() => {
    if (value && typeof value === "object") {
      const existingKeys = Object.keys(value);
      const entries = existingKeys.map((key) => ({
        key: key,
        id: `${key}_${Date.now()}_${Math.random()}`,
      }));
      setSelectedEntries(entries);

      const remainingKeys = (field.dict_key_options || []).filter((key) => !existingKeys.includes(key));
      setAvailableKeys(remainingKeys);
    }
  }, [value, field.dict_key_options]);

  const addEntry = (selectedKey: string) => {
    if (!selectedKey) return;

    const newEntry = {
      key: selectedKey,
      id: `${selectedKey}_${Date.now()}`,
    };

    setSelectedEntries([...selectedEntries, newEntry]);
    setAvailableKeys(availableKeys.filter((key) => key !== selectedKey));
  };

  const removeEntry = (entryId: string, keyToRemove: string) => {
    setSelectedEntries(selectedEntries.filter((entry) => entry.id !== entryId));
    setAvailableKeys([...availableKeys, keyToRemove].sort());
  };

  return (
    <div className="space-y-3">
      {/* Existing entries */}
      {selectedEntries.map((entry) => (
        <div key={entry.id} className="flex items-center space-x-3 rounded-lg border border-border p-3">
          <GuardrailField
            control={control}
            name={`${fullFieldKey}.${entry.key}`}
            label={entry.key}
            defaultValue={readRecord(value, entry.key)}
            className="flex-1"
          >
            {(fieldControl) => {
              if (field.dict_value_type === "number") {
                return (
                  <NumericalInput
                    id={fieldControl.id}
                    name={fieldControl.name}
                    step={1}
                    placeholder={i18n.t("guardrails.guardrailOptionalParams.enterValue", {
                      key: providerParamFieldLabel(entry.key),
                      defaultValue: "Enter {{key}} value",
                    })}
                    value={asText(fieldControl.value)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      fieldControl.onChange(toNumberValue(event.target.value))
                    }
                    onBlur={fieldControl.onBlur}
                    aria-invalid={fieldControl["aria-invalid"]}
                    aria-describedby={fieldControl["aria-describedby"]}
                  />
                );
              }

              if (field.dict_value_type === "boolean") {
                return (
                  <BooleanSelect
                    control={fieldControl}
                    placeholder={i18n.t("guardrails.guardrailOptionalParams.selectValue", {
                      key: providerParamFieldLabel(entry.key),
                      defaultValue: "Select {{key}} value",
                    })}
                  />
                );
              }

              return (
                <Input
                  id={fieldControl.id}
                  name={fieldControl.name}
                  ref={fieldControl.ref}
                  placeholder={i18n.t("guardrails.guardrailOptionalParams.enterValue", {
                    key: providerParamFieldLabel(entry.key),
                    defaultValue: "Enter {{key}} value",
                  })}
                  value={asText(fieldControl.value)}
                  onChange={fieldControl.onChange}
                  onBlur={fieldControl.onBlur}
                  aria-invalid={fieldControl["aria-invalid"]}
                  aria-describedby={fieldControl["aria-describedby"]}
                />
              );
            }}
          </GuardrailField>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive/80"
            onClick={() => removeEntry(entry.id, entry.key)}
          >
            {i18n.t("common.remove", { defaultValue: "Remove" })}
          </Button>
        </div>
      ))}

      {/* Add new entry */}
      {availableKeys.length > 0 && (
        <div className="mt-2 flex items-center space-x-3">
          <Select
            items={availableKeys.map((key) => ({ label: key, value: key }))}
            value={null}
            onValueChange={(next: string | null) => next && addEntry(next)}
          >
            <SelectTrigger className="w-50">
              <SelectValue
                placeholder={i18n.t("guardrailOptionalParams.select-category-to-configure", {
                  defaultValue: "Select category to configure",
                })}
              />
            </SelectTrigger>
            <SelectContent>
              {availableKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {i18n.t("guardrailOptionalParams.select-a-category-to-add-threshold-configura", {
              defaultValue: "Select a category to add threshold configuration",
            })}
          </span>
        </div>
      )}
    </div>
  );
};

interface OptionalParamInputProps {
  descriptor: ProviderParam;
  fieldKey: string;
  providerKey: string | null;
  control: GuardrailFieldControlProps;
}

const OptionalParamInput: React.FC<OptionalParamInputProps> = ({ descriptor, fieldKey, providerKey, control }) => {
  const { id, value, onChange, onBlur, ref, name, ...aria } = control;
  const description = providerParamDescription(providerKey, fieldKey, descriptor.description);
  const optionItems = (descriptor.options ?? []).map((option) => ({
    label: providerParamOptionLabel(option),
    value: option,
  }));

  if (descriptor.type === "select" && descriptor.options) {
    return (
      <Select items={optionItems} value={asText(value) || null} onValueChange={(next: string | null) => onChange(next)}>
        <SelectTrigger id={id} className="w-full" {...aria}>
          <SelectValue placeholder={description} />
        </SelectTrigger>
        <SelectContent>
          {optionItems.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (descriptor.type === "multiselect" && descriptor.options) {
    return (
      <MultiSelect
        id={id}
        options={optionItems}
        value={asStringArray(value)}
        onValueChange={onChange}
        placeholder={description}
      />
    );
  }

  if (descriptor.type === "bool" || descriptor.type === "boolean") {
    return <BooleanSelect control={control} placeholder={description} />;
  }

  if (descriptor.type === "number") {
    return (
      <NumericalInput
        id={id}
        name={name}
        step={1}
        placeholder={description}
        value={asText(value)}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(toNumberValue(event.target.value))}
        onBlur={onBlur}
        {...aria}
      />
    );
  }

  if (isSecretKey(fieldKey)) {
    return (
      <PasswordInput
        id={id}
        name={name}
        ref={ref}
        placeholder={description}
        value={asText(value)}
        onChange={onChange}
        onBlur={onBlur}
        {...aria}
      />
    );
  }

  return (
    <Input
      id={id}
      name={name}
      ref={ref}
      placeholder={description}
      value={asText(value)}
      onChange={onChange}
      onBlur={onBlur}
      {...aria}
    />
  );
};

const GuardrailOptionalParams: React.FC<GuardrailOptionalParamsProps> = ({
  optionalParams,
  parentFieldKey,
  control,
  values,
  providerKey = null,
}) => {
  const renderField = (fieldKey: string, field: ProviderParam) => {
    const fullFieldKey = `${parentFieldKey}.${fieldKey}`;
    const value = values?.[fieldKey];
    const fieldLabel = providerParamFieldLabel(fieldKey);
    // Handle dict fields separately since they manage their own fields
    if (field.type === "dict" && field.dict_key_options) {
      const dictDescription = providerParamDescription(providerKey, fullFieldKey, field.description);
      return (
        <div key={fullFieldKey} className="mb-8 rounded-lg border border-border bg-muted/40 p-6">
          <div className="mb-4 text-base font-medium text-foreground">{fieldLabel}</div>
          {dictDescription !== undefined && <p className="mb-4 text-sm text-muted-foreground">{dictDescription}</p>}
          <DictField
            field={field}
            fullFieldKey={fullFieldKey}
            control={control}
            value={value}
            providerKey={providerKey}
          />
        </div>
      );
    }

    return (
      <div key={fullFieldKey} className="mb-8 rounded-lg border border-border bg-card p-6 shadow-xs">
        <GuardrailField
          control={control}
          name={fullFieldKey}
          label={<span className="text-base">{fieldLabel}</span>}
          description={providerParamDescription(providerKey, fullFieldKey, field.description)}
          rules={
            field.required
              ? requiredRule(
                  i18n.t("guardrails.guardrailOptionalParams.fieldRequired", {
                    defaultValue: "{{fieldKey}} is required",
                    fieldKey: fieldLabel,
                  }),
                )
              : undefined
          }
          defaultValue={value !== undefined ? value : field.default_value}
        >
          {(fieldControl) => (
            <OptionalParamInput
              descriptor={field}
              fieldKey={fieldKey}
              providerKey={providerKey}
              control={fieldControl}
            />
          )}
        </GuardrailField>
      </div>
    );
  };

  if (!optionalParams.fields || Object.keys(optionalParams.fields).length === 0) {
    return null;
  }

  return (
    <div className="guardrail-optional-params">
      <div className="mb-8 border-b border-border pb-4">
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {i18n.t("guardrailOptionalParams.optional-parameters", { defaultValue: "Optional Parameters" })}
        </h3>
        <p className="text-sm text-muted-foreground">
          {untranslatedDescription(optionalParams.description) ||
            i18n.t("guardrails.guardrailOptionalParams.defaultDescription", {
              defaultValue: "Configure additional settings for this guardrail provider",
            })}
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(optionalParams.fields).map(([fieldKey, field]) => renderField(fieldKey, field))}
      </div>
    </div>
  );
};

export default GuardrailOptionalParams;
