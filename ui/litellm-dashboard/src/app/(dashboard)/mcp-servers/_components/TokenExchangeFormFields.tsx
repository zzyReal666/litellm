import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { useWatch } from "react-hook-form";

import { MountedFormField } from "@/components/common_components/MountedFormField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import { requiredRule } from "@/components/common_components/formRules";
import { localizeSelectItems } from "@/components/mcp_tools/types";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Input } from "@/components/ui/input";
import { selectControl, selectTriggerControl, tagsControl, textControl } from "./mcpFieldRules";

interface TokenExchangeFormFieldsProps {
  isEditing?: boolean;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const TOKEN_EXCHANGE_PROFILE_ITEMS = [
  {
    value: "rfc8693",
    labelKey: "mcpTools.tokenExchangeFormFields.profileRfc8693",
    label: "RFC 8693 (standard)",
  },
  {
    value: "entra_obo",
    labelKey: "mcpTools.tokenExchangeFormFields.profileEntraObo",
    label: "Microsoft Entra OBO",
  },
];

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const TokenExchangeFormFields: React.FC<TokenExchangeFormFieldsProps> = ({ isEditing = false }) => {
  const { t } = useTranslation();
  const placeholderSuffix = isEditing
    ? ` (${t("mcpTools.oAuthFormFields.leaveBlankToKeep", { defaultValue: "leave blank to keep existing" })})`
    : "";
  const isEntraObo = useWatch({ name: "token_exchange_profile" }) === "entra_obo";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.tokenExchangeFormFields.profileLabel", { defaultValue: "Profile" })}
            tooltip={t("mcpTools.tokenExchangeFormFields.profileTooltip", {
              defaultValue:
                "Token-exchange wire dialect. RFC 8693 is the standard token-exchange grant. Microsoft Entra OBO uses Entra's On-Behalf-Of dialect (the RFC 7523 jwt-bearer grant with requested_token_use=on_behalf_of) and carries the target resource in a scope like api://<app-id>/.default.",
            })}
          />
        }
        name="token_exchange_profile"
        {...(isEditing ? {} : { defaultValue: "rfc8693" })}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={localizeSelectItems(TOKEN_EXCHANGE_PROFILE_ITEMS, t)}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {localizeSelectItems(TOKEN_EXCHANGE_PROFILE_ITEMS, t).map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  <span className="font-medium">{item.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.tokenExchangeFormFields.endpointLabel", {
              defaultValue: "Token Exchange Endpoint (optional)",
            })}
            tooltip={t("mcpTools.tokenExchangeFormFields.endpointTooltip", {
              defaultValue:
                "RFC 8693 token endpoint. The proxy exchanges the user's incoming token here for a scoped token used to call the upstream MCP server. Leave blank to auto-discover it from the upstream's protected-resource metadata (RFC 9728 then RFC 8414).",
            })}
          />
        }
        name="token_exchange_endpoint"
      >
        {(control) => (
          <Input
            {...textControl(control)}
            placeholder="https://idp.example.com/oauth2/token"
            className={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.oAuthFormFields.clientIdLabel", { defaultValue: "Client ID" })}
            tooltip={t("mcpTools.tokenExchangeFormFields.clientIdTooltip", {
              defaultValue: "OAuth2 client ID used to authenticate to the token exchange endpoint.",
            })}
          />
        }
        name={["credentials", "client_id"]}
        required={!isEditing}
        rules={requiredWhenCreating(
          t("mcpTools.tokenExchangeFormFields.clientIdRequired", {
            defaultValue: "Client ID is required for token exchange",
          }),
        )}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={`${t("mcpTools.oAuthFormFields.clientIdM2MPlaceholder", {
              defaultValue: "Enter OAuth client ID",
            })}${placeholderSuffix}`}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.oAuthFormFields.clientSecretLabel", { defaultValue: "Client Secret" })}
            tooltip={t("mcpTools.tokenExchangeFormFields.clientSecretTooltip", {
              defaultValue: "OAuth2 client secret used to authenticate to the token exchange endpoint.",
            })}
          />
        }
        name={["credentials", "client_secret"]}
        required={!isEditing}
        rules={requiredWhenCreating(
          t("mcpTools.tokenExchangeFormFields.clientSecretRequired", {
            defaultValue: "Client Secret is required for token exchange",
          }),
        )}
      >
        {(control) => (
          <PasswordInput
            {...textControl(control)}
            placeholder={`${t("mcpTools.oAuthFormFields.clientSecretM2MPlaceholder", {
              defaultValue: "Enter OAuth client secret",
            })}${placeholderSuffix}`}
            groupClassName={fieldClassName}
          />
        )}
      </MountedFormField>
      {!isEntraObo && (
        <>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.tokenExchangeFormFields.audienceLabel", { defaultValue: "Audience (optional)" })}
                tooltip={t("mcpTools.tokenExchangeFormFields.audienceTooltip", {
                  defaultValue:
                    "Target audience for the exchanged token (RFC 8693 audience). Identifies the upstream MCP server the token is for.",
                })}
              />
            }
            name="audience"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder="https://upstream.example.com" className={fieldClassName} />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.tokenExchangeFormFields.subjectTokenTypeLabel", {
                  defaultValue: "Subject Token Type (optional)",
                })}
                tooltip={t("mcpTools.tokenExchangeFormFields.subjectTokenTypeTooltip", {
                  defaultValue:
                    "Type of the user's incoming token (RFC 8693 subject_token_type). Defaults to urn:ietf:params:oauth:token-type:access_token.",
                })}
              />
            }
            name="subject_token_type"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="urn:ietf:params:oauth:token-type:access_token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
        </>
      )}
      <MountedFormField
        label={
          <FieldLabel
            label={
              isEntraObo
                ? t("settingsPages.baseSSOSettingsForm.fieldLabels.scopes", { defaultValue: "Scopes" })
                : t("mcpTools.oAuthFormFields.scopesOptionalLabel", { defaultValue: "Scopes (optional)" })
            }
            tooltip={
              isEntraObo
                ? t("mcpTools.tokenExchangeFormFields.scopesEntraTooltip", {
                    defaultValue:
                      "Microsoft Entra OBO carries the target resource in the scope, so at least one is required (e.g. api://<app-id>/.default).",
                  })
                : t("mcpTools.tokenExchangeFormFields.scopesTooltip", {
                    defaultValue: "Optional scopes to request during the token exchange.",
                  })
            }
          />
        }
        name={["credentials", "scopes"]}
        required={isEntraObo}
        rules={
          isEntraObo
            ? {
                validate: {
                  required: requiredRule(
                    t("mcpTools.tokenExchangeFormFields.scopesRequired", {
                      defaultValue: "Microsoft Entra OBO requires a scope, e.g. api://<app-id>/.default",
                    }),
                  ),
                },
              }
            : undefined
        }
      >
        {(control) => (
          <MultiSelect
            {...tagsControl(control, t)}
            placeholder={
              isEntraObo
                ? "api://<app-id>/.default"
                : t("mcpTools.oAuthFormFields.scopesPlaceholder", { defaultValue: "Add scopes" })
            }
            className="rounded-lg"
          />
        )}
      </MountedFormField>
      <UpstreamTokenHeaderField />
    </>
  );
};

export default TokenExchangeFormFields;
