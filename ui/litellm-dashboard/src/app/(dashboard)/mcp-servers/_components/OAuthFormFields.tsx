import i18n from "@/lib/i18n";
import { Info } from "lucide-react";
import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OAUTH_FLOW } from "@/components/mcp_tools/types";
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
  { value: OAUTH_FLOW.M2M, label: i18n.t("mcpTools.oAuthFormFields.m2mLabel", { defaultValue: "Machine-to-Machine (M2M)" }) },
  { value: OAUTH_FLOW.INTERACTIVE, label: i18n.t("mcpTools.oAuthFormFields.interactiveLabel", { defaultValue: "Interactive (PKCE)" }) },
];

const UPSTREAM_RESOURCE_TOOLTIP =
  "RFC 8707 resource indicator sent to the authorization server so it mints a token audienced for this MCP server. " +
  "Leave blank to send nothing, which is the default and what most providers expect. Use 'auto' to send this server's " +
  "own URL. Set an exact identifier when the authorization server expects a specific one. Some providers reject this " +
  "parameter and take the audience from scopes instead; if you see AADSTS901002, leave it blank. If you see " +
  "invalid_target, the authorization server needs it set.";

const FieldLabel: React.FC<{ label: string; tooltip: string }> = ({ label, tooltip }) => (
  <span className="text-sm font-medium text-foreground flex items-center">
    {label}
    <SimpleTooltip content={tooltip}>
      <Info className="ml-2 size-4 text-info hover:text-info/80 cursor-help" />
    </SimpleTooltip>
  </span>
);

const UpstreamResourceField: React.FC = () => (
  <MountedFormField
    label={<FieldLabel label={i18n.t("mcpTools.oAuthFormFields.upstreamResourceLabel", { defaultValue: "Resource Indicator (optional)" })} tooltip={UPSTREAM_RESOURCE_TOOLTIP} />}
    name={["credentials", "upstream_resource"]}
  >
    {(control) => (
      <Input {...textControl(control)} placeholder={i18n.t("mcpTools.oAuthFormFields.upstreamResourcePlaceholder", { defaultValue: "auto, or https://mcp.example.com/mcp" })} className={fieldClassName} />
    )}
  </MountedFormField>
);

const OAuthFormFields: React.FC<OAuthFormFieldsProps> = ({
  isM2M,
  isEditing = false,
  oauthFlow,
  initialFlowType,
}) => {
  const placeholderSuffix = isEditing ? " (leave blank to keep existing)" : "";
  const requiredWhenCreating = (message: string) =>
    isEditing ? undefined : { validate: { required: requiredRule(message) } };

  return (
    <>
      <MountedFormField
        label={
          <FieldLabel
            label={i18n.t("mcpTools.oAuthFormFields.flowTypeLabel", { defaultValue: "OAuth Flow Type" })}
            tooltip={i18n.t("mcpTools.oAuthFormFields.flowTypeTooltip", { defaultValue: "Choose how the proxy authenticates with this MCP server. M2M is for server-to-server communication using client credentials. Interactive (PKCE) is for user-facing flows that require browser-based authorization." })}
          />
        }
        name="oauth_flow_type"
        {...(initialFlowType ? { defaultValue: initialFlowType } : {})}
      >
        {(control) => (
          <Select {...selectControl<string>(control)} items={OAUTH_FLOW_ITEMS}>
            <SelectTrigger {...selectTriggerControl(control)} className="w-full rounded-lg">
              <SelectValue placeholder={i18n.t("mcpTools.oAuthFormFields.flowTypePlaceholder", { defaultValue: "Select OAuth flow" })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={OAUTH_FLOW.M2M}>
                <div>
                  <span className="font-medium">{i18n.t("mcpTools.oAuthFormFields.m2mLabel", { defaultValue: "Machine-to-Machine (M2M)" })}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{i18n.t("mcpTools.oAuthFormFields.m2mDesc", { defaultValue: "server-to-server, no user interaction" })}</span>
                </div>
              </SelectItem>
              <SelectItem value={OAUTH_FLOW.INTERACTIVE}>
                <div>
                  <span className="font-medium">{i18n.t("mcpTools.oAuthFormFields.interactiveLabel", { defaultValue: "Interactive (PKCE)" })}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{i18n.t("mcpTools.oAuthFormFields.interactiveDesc", { defaultValue: "browser-based user authorization" })}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </MountedFormField>

      {isM2M ? (
        <>
          <MountedFormField
            label={<FieldLabel label={i18n.t("mcpTools.oAuthFormFields.clientIdLabel", { defaultValue: "Client ID" })} tooltip={i18n.t("mcpTools.oAuthFormFields.clientIdM2MTooltip", { defaultValue: "OAuth2 client ID for the client_credentials grant." })} />}
            name={["credentials", "client_id"]}
            required={!isEditing}
            rules={requiredWhenCreating(i18n.t("mcpTools.oAuthFormFields.clientIdM2MRequired", { defaultValue: "Client ID is required for M2M OAuth" }))}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`Enter OAuth client ID${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel label={i18n.t("mcpTools.oAuthFormFields.clientSecretLabel", { defaultValue: "Client Secret" })} tooltip={i18n.t("mcpTools.oAuthFormFields.clientSecretM2MTooltip", { defaultValue: "OAuth2 client secret for the client_credentials grant." })} />
            }
            name={["credentials", "client_secret"]}
            required={!isEditing}
            rules={requiredWhenCreating(i18n.t("mcpTools.oAuthFormFields.clientSecretM2MRequired", { defaultValue: "Client Secret is required for M2M OAuth" }))}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`Enter OAuth client secret${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={<FieldLabel label={i18n.t("mcpTools.oAuthFormFields.tokenUrlLabel", { defaultValue: "Token URL" })} tooltip={i18n.t("mcpTools.oAuthFormFields.tokenUrlM2MTooltip", { defaultValue: "Token endpoint URL for the client_credentials grant." })} />}
            name="token_url"
            required={!isEditing}
            rules={requiredWhenCreating(i18n.t("mcpTools.oAuthFormFields.tokenUrlM2MRequired", { defaultValue: "Token URL is required for M2M OAuth" }))}
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
                label={i18n.t("mcpTools.oAuthFormFields.scopesOptionalLabel", { defaultValue: "Scopes (optional)" })}
                tooltip={i18n.t("mcpTools.oAuthFormFields.scopesM2MTooltip", { defaultValue: "Optional scopes to request with the client_credentials grant." })}
              />
            }
            name={["credentials", "scopes"]}
          >
            {(control) => <MultiSelect {...tagsControl(control)} placeholder={i18n.t("mcpTools.oAuthFormFields.scopesPlaceholder", { defaultValue: "Add scopes" })} className="rounded-lg" />}
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
                  label={i18n.t("mcpTools.oAuthFormFields.clientIdOptionalLabel", { defaultValue: "Client ID (optional)" })}
                  tooltip={i18n.t("mcpTools.oAuthFormFields.clientSecretInteractiveTooltip", { defaultValue: "Provide only if your MCP server cannot handle dynamic client registration." })}
                />
              </span>
            }
            name={["credentials", "client_id"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`Enter client ID${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={i18n.t("mcpTools.oAuthFormFields.clientSecretOptionalLabel", { defaultValue: "Client Secret (optional)" })}
                tooltip={i18n.t("mcpTools.oAuthFormFields.clientSecretInteractiveTooltip", { defaultValue: "Provide only if your MCP server cannot handle dynamic client registration." })}
              />
            }
            name={["credentials", "client_secret"]}
          >
            {(control) => (
              <PasswordInput
                {...textControl(control)}
                placeholder={`Enter client secret${placeholderSuffix}`}
                groupClassName={fieldClassName}
              />
            )}
          </MountedFormField>
          <MountedFormField
            label={
              <FieldLabel
                label={i18n.t("mcpTools.oAuthFormFields.scopesOptionalLabel", { defaultValue: "Scopes (optional)" })}
                tooltip={i18n.t("mcpTools.oAuthFormFields.scopesInteractiveTooltip", { defaultValue: "Optional scopes requested during token exchange. Separate multiple scopes with enter or commas." })}
              />
            }
            name={["credentials", "scopes"]}
          >
            {(control) => <MultiSelect {...tagsControl(control)} placeholder={i18n.t("mcpTools.oAuthFormFields.scopesPlaceholder", { defaultValue: "Add scopes" })} className="rounded-lg" />}
          </MountedFormField>
          <UpstreamResourceField />
          <UpstreamTokenHeaderField />
          <MountedFormField
            label={
              <FieldLabel
                label={i18n.t("mcpTools.oAuthFormFields.issuerLabel", { defaultValue: "Issuer (optional)" })}
                tooltip={i18n.t("mcpTools.oAuthFormFields.issuerTooltip", { defaultValue: "OAuth 2.0 authorization server issuer (RFC 8414). Leave empty to discover endpoints from the upstream resource; set it to pin the trust anchor, which makes this issuer's document the only endpoint source (RFC 8414 §3.3), overriding the Authorization/Token/Registration URLs above and failing closed if its metadata cannot be fetched." })}
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
                label={i18n.t("mcpTools.oAuthFormFields.authorizationUrlOptionalLabel", { defaultValue: "Authorization URL (optional)" })}
                tooltip={i18n.t("mcpTools.oAuthFormFields.authorizationUrlTooltip", { defaultValue: "Optional override for the authorization endpoint." })}
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
            label={<FieldLabel label={i18n.t("mcpTools.oAuthFormFields.tokenUrlOptionalLabel", { defaultValue: "Token URL (optional)" })} tooltip={i18n.t("mcpTools.oAuthFormFields.tokenUrlInteractiveTooltip", { defaultValue: "Optional override for the token endpoint." })} />}
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
                label={i18n.t("mcpTools.oAuthFormFields.registrationUrlOptionalLabel", { defaultValue: "Registration URL (optional)" })}
                tooltip={i18n.t("mcpTools.oAuthFormFields.registrationUrlTooltip", { defaultValue: "Optional override for the dynamic client registration endpoint." })}
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
                label={i18n.t("mcpTools.oAuthFormFields.tokenValidationRulesLabel", { defaultValue: "Token Validation Rules (optional)" })}
                tooltip='JSON object of key-value rules checked against the OAuth token response before storing. Supports dot-notation for nested fields (e.g. {"organization": "my-org", "team.id": "123"}). Tokens that fail validation are rejected with HTTP 403.'
              />
            }
            name="token_validation_json"
            rules={{ validate: { json: parsesAsJson(i18n.t("mcpTools.oAuthFormFields.mustBeValidJson", { defaultValue: i18n.t("routingGroups.routingGroupModal.strategyArgsMustBeJson", { defaultValue: "Must be valid JSON" }) })) } }}
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
                label={i18n.t("mcpTools.oAuthFormFields.tokenStorageTtlLabel", { defaultValue: "Token Storage TTL (seconds, optional)" })}
                tooltip={i18n.t("mcpTools.oAuthFormFields.tokenStorageTtlCacheTooltip", { defaultValue: "How long to cache each user's OAuth access token in Redis before evicting it (never longer than the token's own expires_in). Leave blank to derive the TTL from the token's expires_in, or fall back to the 12-hour default." })}
              />
            }
            name="token_storage_ttl_seconds"
          >
            {(control) => (
              <Input {...numberControl(control)} min={1} placeholder={i18n.t("mcpTools.oAuthFormFields.tokenStorageTtlPlaceholder", { defaultValue: "e.g. 3600" })} className="w-full rounded-lg" />
            )}
          </MountedFormField>
          {oauthFlow && (
            <div className="rounded-lg border border-dashed border-border p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Use OAuth to fetch a fresh access token and temporarily save it in the session as the authentication
                value.
              </p>
              <Button
                variant="secondary"
                onClick={oauthFlow.startOAuthFlow}
                disabled={oauthFlow.status === "authorizing" || oauthFlow.status === "exchanging"}
              >
                {oauthFlow.status === "authorizing"
                  ? i18n.t("mcpTools.oAuthFormFields.waitingForAuthorization", { defaultValue: "Waiting for authorization..." })
                  : oauthFlow.status === "exchanging"
                    ? i18n.t("mcpTools.oAuthFormFields.exchangingCode", { defaultValue: "Exchanging authorization code..." })
                    : i18n.t("mcpTools.oAuthFormFields.authorizeAndFetch", { defaultValue: "Authorize & Fetch Token" })}
              </Button>
              {oauthFlow.error && <p className="text-sm text-destructive">{oauthFlow.error}</p>}
              {oauthFlow.status === "success" && oauthFlow.tokenResponse?.access_token && (
                <p className="text-sm text-success">
                  Token fetched. Expires in {oauthFlow.tokenResponse.expires_in ?? "?"} seconds.
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
