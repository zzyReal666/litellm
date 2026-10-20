import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { localizeSelectItems, OAUTH_FLOW } from "@/components/mcp_tools/types";
import { MountedFormField } from "@/components/common_components/MountedFormField";
import { requiredRule } from "@/components/common_components/formRules";
import TokenEndpointAuthMethodField from "./TokenEndpointAuthMethodField";
import UpstreamTokenHeaderField from "./UpstreamTokenHeaderField";
import {
  numberControl,
  parsesAsJson,
  selectControl,
  selectTriggerControl,
  tagsControl,
  textControl,
} from "./mcpFieldRules";

interface OAuthFlowStatus {
  startOAuthFlow: () => void;
  status: string;
  error: string | null;
  tokenResponse: { access_token?: string; expires_in?: number } | null;
}

interface OAuthFormFieldsProps {
  isM2M: boolean;
  isEditing?: boolean;
  oauthFlow?: OAuthFlowStatus;
  initialFlowType?: string;
  /** Link to provider docs for creating an OAuth app (e.g. GitHub). */
  docsUrl?: string | null;
}

const fieldClassName = "rounded-lg border-border focus:border-info focus:ring-ring";

const OAUTH_FLOW_ITEMS = [
  {
    value: OAUTH_FLOW.M2M,
    labelKey: "mcpTools.oAuthFormFields.m2mLabel",
    label: "Machine-to-Machine (M2M)",
  },
  {
    value: OAUTH_FLOW.INTERACTIVE,
    labelKey: "mcpTools.oAuthFormFields.interactiveLabel",
    label: "Interactive (PKCE)",
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

const UpstreamResourceField: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MountedFormField
      label={
        <FieldLabel
          label={t("mcpTools.oAuthFormFields.upstreamResourceLabel", { defaultValue: "Resource Indicator (optional)" })}
          tooltip={t("mcpTools.oAuthFormFields.upstreamResourceTooltip", {
            defaultValue:
              "RFC 8707 resource indicator sent to the authorization server so it mints a token audienced for this MCP server. Leave blank to send nothing, which is the default and what most providers expect. Use 'auto' to send this server's own URL. Set an exact identifier when the authorization server expects a specific one. Some providers reject this parameter and take the audience from scopes instead; if you see AADSTS901002, leave it blank. If you see invalid_target, the authorization server needs it set.",
          })}
        />
      }
      name={["credentials", "upstream_resource"]}
    >
      {(control) => (
        <Input
          {...textControl(control)}
          placeholder={t("mcpTools.oAuthFormFields.upstreamResourcePlaceholder", {
            defaultValue: "auto, or https://mcp.example.com/mcp",
          })}
          className={fieldClassName}
        />
      )}
    </MountedFormField>
  );
};

const OAuthFormFields: React.FC<OAuthFormFieldsProps> = ({
  isM2M,
  isEditing = false,
  oauthFlow,
  initialFlowType,
  docsUrl,
}) => {
  const { t } = useTranslation();
  const placeholderSuffix = isEditing
    ? ` (${t("mcpTools.oAuthFormFields.leaveBlankToKeep", { defaultValue: "leave blank to keep existing" })})`
    : "";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={
          <FieldLabel
            label={t("mcpTools.oAuthFormFields.flowTypeLabel", { defaultValue: "OAuth Flow Type" })}
            tooltip={t("mcpTools.oAuthFormFields.flowTypeTooltip", {
              defaultValue:
                "Choose how the proxy authenticates with this MCP server. M2M is for server-to-server communication using client credentials. Interactive (PKCE) is for user-facing flows that require browser-based authorization.",
            })}
          />
        }
        name="oauth_flow_type"
        {...(initialFlowType ? { defaultValue: initialFlowType } : {})}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={localizeSelectItems(OAUTH_FLOW_ITEMS, t)}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue
                placeholder={t("mcpTools.oAuthFormFields.flowTypePlaceholder", { defaultValue: "Select OAuth flow" })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OAUTH_FLOW.M2M}>
                <div>
                  <span className="font-medium">
                    {t("mcpTools.oAuthFormFields.m2mLabel", { defaultValue: "Machine-to-Machine (M2M)" })}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t("mcpTools.oAuthFormFields.m2mDesc", { defaultValue: "server-to-server, no user interaction" })}
                  </span>
                </div>
              </SelectItem>
              <SelectItem value={OAUTH_FLOW.INTERACTIVE}>
                <div>
                  <span className="font-medium">
                    {t("mcpTools.oAuthFormFields.interactiveLabel", { defaultValue: "Interactive (PKCE)" })}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t("mcpTools.oAuthFormFields.interactiveDesc", {
                      defaultValue: "browser-based user authorization",
                    })}
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </MountedFormField>

      {isM2M ? (
        <>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.clientIdLabel", { defaultValue: "Client ID" })}
                tooltip={t("mcpTools.oAuthFormFields.clientIdM2MTooltip", {
                  defaultValue: "OAuth2 client ID for the client_credentials grant.",
                })}
              />
            }
            name={["credentials", "client_id"]}
            required={!isEditing}
            rules={requiredWhenCreating(
              t("mcpTools.oAuthFormFields.clientIdM2MRequired", {
                defaultValue: "Client ID is required for M2M OAuth",
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
                tooltip={t("mcpTools.oAuthFormFields.clientSecretM2MTooltip", {
                  defaultValue: "OAuth2 client secret for the client_credentials grant.",
                })}
              />
            }
            name={["credentials", "client_secret"]}
            required={!isEditing}
            rules={requiredWhenCreating(
              t("mcpTools.oAuthFormFields.clientSecretM2MRequired", {
                defaultValue: "Client Secret is required for M2M OAuth",
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
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.tokenUrlLabel", { defaultValue: "Token URL" })}
                tooltip={t("mcpTools.oAuthFormFields.tokenUrlM2MTooltip", {
                  defaultValue: "Token endpoint URL for the client_credentials grant.",
                })}
              />
            }
            name="token_url"
            required={!isEditing}
            rules={requiredWhenCreating(
              t("mcpTools.oAuthFormFields.tokenUrlM2MRequired", {
                defaultValue: "Token URL is required for M2M OAuth",
              }),
            )}
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://auth.example.com/oauth/token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <TokenEndpointAuthMethodField isEditing={isEditing} />
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.scopesOptionalLabel", { defaultValue: "Scopes (optional)" })}
                tooltip={t("mcpTools.oAuthFormFields.scopesM2MTooltip", {
                  defaultValue: "Optional scopes to request with the client_credentials grant.",
                })}
              />
            }
            name={["credentials", "scopes"]}
          >
            {(control) => (
              <MultiSelect
                {...tagsControl(control, t)}
                placeholder={t("mcpTools.oAuthFormFields.scopesPlaceholder", { defaultValue: "Add scopes" })}
                className="rounded-lg"
              />
            )}
          </MountedFormField>
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
        </>
      ) : (
        <>
          <MountedFormField
            label={
              <span className="flex items-center justify-between w-full">
                <FieldLabel
                  label={t("mcpTools.oAuthFormFields.clientIdOptionalLabel", { defaultValue: "Client ID (optional)" })}
                  tooltip={t("mcpTools.oAuthFormFields.clientIdInteractiveTooltip", {
                    defaultValue: "Provide only if your MCP server cannot handle dynamic client registration.",
                  })}
                />
                {docsUrl && (
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-info hover:text-info/80 ml-2 font-normal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("mcpTools.oAuthFormFields.createOAuthAppLink", { defaultValue: "Create OAuth App" })} →
                  </a>
                )}
              </span>
            }
            name={["credentials", "client_id"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`${t("mcpTools.oAuthFormFields.clientIdInteractivePlaceholder", {
                  defaultValue: "Enter client ID",
                })}${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.clientSecretOptionalLabel", {
                  defaultValue: "Client Secret (optional)",
                })}
                tooltip={t("mcpTools.oAuthFormFields.clientSecretInteractiveTooltip", {
                  defaultValue: "Provide only if your MCP server cannot handle dynamic client registration.",
                })}
              />
            }
            name={["credentials", "client_secret"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`${t("mcpTools.oAuthFormFields.clientSecretInteractivePlaceholder", {
                  defaultValue: "Enter client secret",
                })}${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.scopesOptionalLabel", { defaultValue: "Scopes (optional)" })}
                tooltip={t("mcpTools.oAuthFormFields.scopesInteractiveTooltip", {
                  defaultValue:
                    "Optional scopes requested during token exchange. Separate multiple scopes with enter or commas.",
                })}
              />
            }
            name={["credentials", "scopes"]}
          >
            {(control) => (
              <MultiSelect
                {...tagsControl(control, t)}
                placeholder={t("mcpTools.oAuthFormFields.scopesPlaceholder", { defaultValue: "Add scopes" })}
                className="rounded-lg"
              />
            )}
          </MountedFormField>
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.issuerLabel", { defaultValue: "Issuer (optional)" })}
                tooltip={t("mcpTools.oAuthFormFields.issuerTooltip", {
                  defaultValue:
                    "OAuth 2.0 authorization server issuer (RFC 8414). Leave empty to discover endpoints from the upstream resource; set it to pin the trust anchor, which makes this issuer's document the only endpoint source (RFC 8414 §3.3), overriding the Authorization/Token/Registration URLs above and failing closed if its metadata cannot be fetched.",
                })}
              />
            }
            name="issuer"
          >
            {(control) => (
              <Input {...textControl(control)} placeholder="https://issuer.example.com" className={fieldClassName} />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.authorizationUrlOptionalLabel", {
                  defaultValue: "Authorization URL (optional)",
                })}
                tooltip={t("mcpTools.oAuthFormFields.authorizationUrlTooltip", {
                  defaultValue: "Optional override for the authorization endpoint.",
                })}
              />
            }
            name="authorization_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/authorize"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.tokenUrlOptionalLabel", { defaultValue: "Token URL (optional)" })}
                tooltip={t("mcpTools.oAuthFormFields.tokenUrlInteractiveTooltip", {
                  defaultValue: "Optional override for the token endpoint.",
                })}
              />
            }
            name="token_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/token"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <TokenEndpointAuthMethodField isEditing={isEditing} />
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.registrationUrlOptionalLabel", {
                  defaultValue: "Registration URL (optional)",
                })}
                tooltip={t("mcpTools.oAuthFormFields.registrationUrlTooltip", {
                  defaultValue: "Optional override for the dynamic client registration endpoint.",
                })}
              />
            }
            name="registration_url"
          >
            {(control) => (
              <Input
                {...textControl(control)}
                placeholder="https://example.com/oauth/register"
                className={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.tokenValidationRulesLabel", {
                  defaultValue: "Token Validation Rules (optional)",
                })}
                tooltip={t("mcpTools.oAuthFormFields.tokenValidationRulesTooltip", {
                  defaultValue:
                    'JSON object of key-value rules checked against the OAuth token response before storing. Supports dot-notation for nested fields (e.g. {"organization": "my-org", "team.id": "123"}). Tokens that fail validation are rejected with HTTP 403.',
                })}
              />
            }
            name="token_validation_json"
            rules={{
              validate: {
                json: parsesAsJson(
                  t("mcpTools.oAuthFormFields.mustBeValidJson", { defaultValue: "Must be valid JSON" }),
                ),
              },
            }}
          >
            {(control) => (
              <Textarea
                {...textControl(control)}
                placeholder={'{\n  "organization": "my-org",\n  "team.id": "123"\n}'}
                rows={4}
                className="font-mono text-sm rounded-lg border-border focus:border-info focus:ring-ring"
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={t("mcpTools.oAuthFormFields.tokenStorageTtlLabel", {
                  defaultValue: "Token Storage TTL (seconds, optional)",
                })}
                tooltip={t("mcpTools.oAuthFormFields.tokenStorageTtlCacheTooltip", {
                  defaultValue:
                    "How long to cache each user's OAuth access token in Redis before evicting it (never longer than the token's own expires_in). Leave blank to derive the TTL from the token's expires_in, or fall back to the 12-hour default.",
                })}
              />
            }
            name="token_storage_ttl_seconds"
          >
            {(control) => (
              <Input
                {...numberControl(control)}
                min={1}
                placeholder={t("mcpTools.oAuthFormFields.tokenStorageTtlPlaceholder", { defaultValue: "e.g. 3600" })}
                className="w-full rounded-lg"
              />
            )}
          </MountedFormField>
          {oauthFlow && (
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("mcpTools.oAuthFormFields.oauthFlowDescription", {
                  defaultValue:
                    "Use OAuth to fetch a fresh access token and temporarily save it in the session as the authentication value.",
                })}
              </p>
              <Button
                variant="secondary"
                onClick={oauthFlow.startOAuthFlow}
                disabled={oauthFlow.status === "authorizing" || oauthFlow.status === "exchanging"}
              >
                {oauthFlow.status === "authorizing"
                  ? t("mcpTools.oAuthFormFields.waitingForAuthorization", {
                      defaultValue: "Waiting for authorization...",
                    })
                  : oauthFlow.status === "exchanging"
                    ? t("mcpTools.oAuthFormFields.exchangingCode", {
                        defaultValue: "Exchanging authorization code...",
                      })
                    : t("mcpTools.oAuthFormFields.authorizeAndFetch", { defaultValue: "Authorize & Fetch Token" })}
              </Button>
              {oauthFlow.error && <p className="text-sm text-destructive">{oauthFlow.error}</p>}
              {oauthFlow.status === "success" && oauthFlow.tokenResponse?.access_token && (
                <p className="text-sm text-success">
                  {t("mcpTools.oAuthFormFields.tokenFetched", {
                    seconds: oauthFlow.tokenResponse.expires_in ?? "?",
                    defaultValue: "Token fetched. Expires in {{seconds}} seconds.",
                  })}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default OAuthFormFields;
