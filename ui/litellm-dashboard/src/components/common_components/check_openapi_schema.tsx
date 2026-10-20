import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import type { UseFormSetValue } from "react-hook-form";
import { getOpenAPISchema } from "../networking";
import { formatLabel } from "@/utils/textUtils";
import { MountedFormField, type MountedFormValues } from "./MountedFormField";

interface SchemaProperty {
  type?: string;
  title?: string;
  description?: string;
  anyOf?: Array<{ type: string }>;
  enum?: string[];
  format?: string;
}

interface OpenAPISchema {
  properties: {
    [key: string]: SchemaProperty;
  };
  required?: string[];
}

interface SchemaFormFieldsProps {
  schemaComponent: string;
  excludedFields?: string[];
  setValue: UseFormSetValue<MountedFormValues>;
  overrideLabels?: { [key: string]: string };
  overrideTooltips?: { [key: string]: string };
  customValidation?: {
    [key: string]: (rule: unknown, value: unknown) => Promise<void>;
  };
  defaultValues?: { [key: string]: unknown };
}

// Define which fields should be parsed as JSON
export const jsonFields = ["metadata", "config", "enforced_params", "aliases"];

// Helper function to determine if a field should be treated as JSON
const isJSONField = (key: string, property: SchemaProperty): boolean => {
  return jsonFields.includes(key) || property.format === "json";
};

// Helper function to validate JSON input
const validateJSON = (value: string): boolean => {
  if (!value) return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || value === "";

const toSchemaNumber = (raw: string, isInteger: boolean): number | null => {
  if (raw === "") return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return isInteger ? Math.trunc(parsed) : parsed;
};

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

const getFieldHelp = (key: string, property: SchemaProperty, type: string, t: TFunction): string => {
  // Default help text based on type
  const defaultHelp =
    {
      string: "Text input",
      number: "Numeric input",
      integer: "Whole number input",
      boolean: "True/False value",
    }[type] || "Text input";
  const defaultHelpKey: { [key: string]: string } = {
    string: "commonComponents.checkOpenapiSchema.helpText",
    number: "commonComponents.checkOpenapiSchema.helpNumber",
    integer: "commonComponents.checkOpenapiSchema.helpInteger",
    boolean: "commonComponents.checkOpenapiSchema.helpBoolean",
  };
  const defaultHelpText = t(defaultHelpKey[type] ?? defaultHelpKey.string, { defaultValue: defaultHelp });

  // Specific field help text
  const specificHelp: { [key: string]: { key: string; defaultValue: string } } = {
    max_budget: {
      key: "commonComponents.checkOpenapiSchema.helpMaxBudget",
      defaultValue: "Enter maximum budget in USD (e.g., 100.50)",
    },
    budget_duration: {
      key: "commonComponents.checkOpenapiSchema.helpBudgetDuration",
      defaultValue: "Select a time period for budget reset",
    },
    tpm_limit: {
      key: "commonComponents.checkOpenapiSchema.helpTpmLimit",
      defaultValue: "Enter maximum tokens per minute (whole number)",
    },
    rpm_limit: {
      key: "commonComponents.checkOpenapiSchema.helpRpmLimit",
      defaultValue: "Enter maximum requests per minute (whole number)",
    },
    duration: {
      key: "commonComponents.checkOpenapiSchema.helpDuration",
      defaultValue: "Enter duration (e.g., 30s, 24h, 7d)",
    },
    metadata: {
      key: "commonComponents.checkOpenapiSchema.helpMetadata",
      defaultValue: 'Enter JSON object with key-value pairs\nExample: {"team": "research", "project": "nlp"}',
    },
    config: {
      key: "commonComponents.checkOpenapiSchema.helpConfig",
      defaultValue: 'Enter configuration as JSON object\nExample: {"setting": "value"}',
    },
    permissions: {
      key: "commonComponents.checkOpenapiSchema.helpPermissions",
      defaultValue: "Enter comma-separated permission strings",
    },
    enforced_params: {
      key: "commonComponents.checkOpenapiSchema.helpEnforcedParams",
      defaultValue: 'Enter parameters as JSON object\nExample: {"param": "value"}',
    },
    blocked: {
      key: "commonComponents.checkOpenapiSchema.helpBlocked",
      defaultValue: "Enter true/false or specific block conditions",
    },
    aliases: {
      key: "commonComponents.checkOpenapiSchema.helpAliases",
      defaultValue: 'Enter aliases as JSON object\nExample: {"alias1": "value1", "alias2": "value2"}',
    },
    models: {
      key: "commonComponents.checkOpenapiSchema.helpModels",
      defaultValue: "Select one or more model names",
    },
    key_alias: {
      key: "commonComponents.checkOpenapiSchema.helpKeyAlias",
      defaultValue: "Enter a unique identifier for this key",
    },
    tags: {
      key: "commonComponents.checkOpenapiSchema.helpTags",
      defaultValue: "Enter comma-separated tag strings",
    },
  };

  // Get specific help text or use default based on type
  const specific = specificHelp[key];
  const helpText = specific ? t(specific.key, { defaultValue: specific.defaultValue }) : defaultHelpText;

  // Add format requirements for special cases
  if (isJSONField(key, property)) {
    return `${helpText}\n${t("commonComponents.checkOpenapiSchema.mustBeValidJson", { defaultValue: "Must be valid JSON format" })}`;
  }

  if (property.enum) {
    return t("commonComponents.checkOpenapiSchema.selectFromOptions", {
      values: property.enum.join(", "),
      defaultValue: `Select from available options\nAllowed values: ${property.enum.join(", ")}`,
    });
  }

  return helpText;
};

const SchemaFormFields: React.FC<SchemaFormFieldsProps> = ({
  schemaComponent,
  excludedFields = [],
  setValue,
  overrideLabels = {},
  overrideTooltips = {},
  customValidation = {},
  defaultValues = {},
}) => {
  const { t } = useTranslation();
  const [schemaProperties, setSchemaProperties] = useState<OpenAPISchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpenAPISchema = async () => {
      try {
        const schema = await getOpenAPISchema();
        const componentSchema = schema.components.schemas[schemaComponent];

        if (!componentSchema) {
          throw new Error(`Schema component "${schemaComponent}" not found`);
        }

        setSchemaProperties(componentSchema);

        Object.keys(componentSchema.properties)
          .filter((key) => !excludedFields.includes(key) && defaultValues[key] !== undefined)
          .forEach((key) => {
            setValue(key, defaultValues[key]);
          });
      } catch (error) {
        console.error("Schema fetch error:", error);
        setError(
          error instanceof Error
            ? error.message
            : t("commonComponents.checkOpenapiSchema.fetchFailed", { defaultValue: "Failed to fetch schema" }),
        );
      }
    };

    fetchOpenAPISchema();
  }, [schemaComponent, setValue, excludedFields, t]);

  const getPropertyType = (property: SchemaProperty): string => {
    if (property.type) {
      return property.type;
    }
    if (property.anyOf) {
      const types = property.anyOf.map((t) => t.type);
      if (types.includes("number") || types.includes("integer")) return "number";
      if (types.includes("string")) return "string";
    }
    return "string";
  };

  const renderFormItem = (key: string, property: SchemaProperty) => {
    const type = getPropertyType(property);
    const isRequired = schemaProperties?.required?.includes(key);

    const label = overrideLabels[key] || property.title || formatLabel(key);
    const tooltip = overrideTooltips[key] || property.description;

    const validate = {
      ...(isRequired && {
        required: (value: unknown) =>
          isBlank(value)
            ? t("commonComponents.checkOpenapiSchema.fieldRequired", {
                label,
                defaultValue: `${label} is required`,
              })
            : true,
      }),
      ...(customValidation[key] && {
        custom: async (value: unknown) => {
          try {
            await customValidation[key](null, value);
            return true;
          } catch (thrown) {
            return messageOf(thrown);
          }
        },
      }),
      ...(isJSONField(key, property) && {
        json: (value: unknown) =>
          value && !validateJSON(value as string)
            ? t("commonComponents.checkOpenapiSchema.invalidJson", { defaultValue: "Please enter valid JSON" })
            : (true as const),
      }),
    };

    const formLabel = tooltip ? (
      <span>
        {label}{" "}
        <SimpleTooltip content={tooltip}>
          <Info className="ml-1 inline size-3.5 align-text-bottom" />
        </SimpleTooltip>
      </span>
    ) : (
      label
    );

    return (
      <MountedFormField
        key={key}
        label={formLabel}
        name={key}
        className="mt-8"
        required={isRequired}
        rules={Object.keys(validate).length > 0 ? { validate } : undefined}
        defaultValue={defaultValues[key]}
        help={<div className="text-xs text-muted-foreground">{getFieldHelp(key, property, type, t)}</div>}
      >
        {(control) => {
          if (isJSONField(key, property)) {
            return (
              <Textarea
                {...control}
                value={control.value as string | undefined}
                rows={4}
                placeholder={t("commonComponents.checkOpenapiSchema.enterAsJson", { defaultValue: "Enter as JSON" })}
                className="font-mono"
              />
            );
          }
          if (property.enum) {
            return (
              <Select value={(control.value as string | undefined) ?? null} onValueChange={control.onChange}>
                <SelectTrigger
                  id={control.id}
                  onBlur={control.onBlur}
                  aria-invalid={control["aria-invalid"]}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {property.enum.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          if (type === "number" || type === "integer") {
            return (
              <Input
                {...control}
                type="number"
                step={type === "integer" ? 1 : "any"}
                value={(control.value as number | undefined) ?? ""}
                onChange={(event) => control.onChange(toSchemaNumber(event.target.value, type === "integer"))}
                className="w-full"
              />
            );
          }
          if (key === "duration") {
            return (
              <Input
                {...control}
                value={(control.value as string | undefined) ?? ""}
                placeholder={t("commonComponents.checkOpenapiSchema.durationPlaceholder", {
                  defaultValue: "eg: 30s, 30h, 30d",
                })}
              />
            );
          }
          return <Input {...control} value={(control.value as string | undefined) ?? ""} placeholder={tooltip || ""} />;
        }}
      </MountedFormField>
    );
  };

  if (error) {
    return (
      <div className="text-destructive">
        {t("commonComponents.checkOpenapiSchema.errorPrefix", { defaultValue: "Error:" })} {error}
      </div>
    );
  }

  if (!schemaProperties?.properties) {
    return null;
  }

  return (
    <div>
      {Object.entries(schemaProperties.properties)
        .filter(([key]) => !excludedFields.includes(key))
        .map(([key, property]) => renderFormItem(key, property))}
    </div>
  );
};

export default SchemaFormFields;
