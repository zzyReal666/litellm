import React, { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { apiClient } from "@/components/networking";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentFormField, type AgentFormValues } from "./AgentFormKit";
import i18n from "@/lib/i18n";
import { entraTenantFromIssuer, IDENTITY_UUID_PATTERN } from "./agent_identity";

const PROVIDER_OPTIONS = [
  { value: "none", label: i18n.t("agents.agentIdentityFields.providerNone", { defaultValue: "No explicit identity binding" }) },
  { value: "microsoft_entra", label: i18n.t("agents.agentIdentityFields.providerEntra", { defaultValue: "Microsoft Entra ID" }) },
];
const EXECUTION_MODE_OPTIONS = [
  { value: "autonomous", label: i18n.t("agents.agentIdentityFields.modeAutonomous", { defaultValue: "Autonomous" }) },
  { value: "delegated", label: i18n.t("agents.agentIdentityFields.modeDelegated", { defaultValue: "On behalf of a user" }) },
  { value: "both", label: i18n.t("agents.agentIdentityFields.modeBoth", { defaultValue: "Both" }) },
];
const EXECUTION_OPTIONS = [
  { value: "enabled", label: i18n.t("agents.agentIdentityFields.executionEnabled", { defaultValue: "Enabled" }) },
  { value: "disabled", label: i18n.t("agents.agentIdentityFields.executionDisabled", { defaultValue: "Disabled" }) },
];

export const AgentIdentityFields = ({ accessToken }: { accessToken: string | null }) => {
  const provider = useWatch<AgentFormValues>({ name: "identity_provider" });
  const mode = useWatch<AgentFormValues>({ name: "execution_mode" });
  const showScopes = mode !== "autonomous" && mode !== undefined;
  const [tenants, setTenants] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || provider !== "microsoft_entra") return;
    let active = true;
    apiClient
      .get<string[]>("/v1/agents/identity/providers", { accessToken })
      .then((issuers) => {
        if (active) {
          setError(null);
          setTenants(
            issuers.flatMap((issuer) => {
              const tenant = entraTenantFromIssuer(issuer);
              return tenant ? [tenant] : [];
            }),
          );
        }
      })
      .catch(() => {
        if (active) setError(i18n.t("agents.agentIdentityFields.loadProvidersFailed", { defaultValue: "Could not load the gateway's trusted identity providers" }));
      });
    return () => {
      active = false;
    };
  }, [accessToken, provider]);

  return (
    <>
      <section aria-label={i18n.t("agents.agentIdentityFields.titleAria", { defaultValue: "Agent Identity" })} className="my-6 space-y-4 rounded-lg border border-border p-4">
        <div>
          <h3 className="font-medium">{i18n.t("agents.agentIdentityFields.title", { defaultValue: "Agent Identity" })}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {i18n.t("agents.agentIdentityFields.description", {
              defaultValue: "Connect an existing identity provider application to this agent. Its name and runtime address can change independently.",
            })}
          </p>
        </div>
        <AgentFormField name="identity_provider" label={i18n.t("agents.agentIdentityFields.identityProvider", { defaultValue: "Identity Provider" })} defaultValue="none">
          {({ value, onChange, id }) => (
            <Select
              items={PROVIDER_OPTIONS}
              value={typeof value === "string" ? value : "none"}
              onValueChange={onChange}
            >
              <SelectTrigger id={id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </AgentFormField>
        {provider === "microsoft_entra" && (
          <>
            <AgentFormField
              name="identity_tenant_id"
              label={i18n.t("agents.agentIdentityFields.trustedEntraTenant", { defaultValue: "Trusted Entra Tenant" })}
              rules={{ required: i18n.t("agents.agentIdentityFields.selectTrustedTenant", { defaultValue: "Select a trusted tenant" }) }}
            >
              {({ value, onChange, id }) => (
                <Select value={typeof value === "string" ? value : ""} onValueChange={onChange}>
                  <SelectTrigger id={id}>
                    <SelectValue placeholder={i18n.t("agents.agentIdentityFields.selectTenantPlaceholder", { defaultValue: "Select the gateway's trusted tenant" })} />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant} value={tenant}>
                        {tenant}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AgentFormField>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {!error && tenants.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {i18n.t("agents.agentIdentityFields.noTenantAvailable", {
                  defaultValue: "No trusted Entra tenant is available. Configure JWT issuer and audience validation on the gateway first. Dashboard Microsoft SSO is configured separately.",
                })}
              </p>
            )}
            <AgentFormField
              name="identity_client_id"
              label={i18n.t("agents.agentIdentityFields.applicationClientId", { defaultValue: "Application (Client) ID" })}
              rules={{
                required: i18n.t("agents.agentIdentityFields.enterClientId", { defaultValue: "Enter the Entra application client ID" }),
                pattern: { value: IDENTITY_UUID_PATTERN, message: i18n.t("agents.agentIdentityFields.invalidClientUuid", { defaultValue: "Enter a valid application client UUID" }) },
              }}
              description={i18n.t("agents.agentIdentityFields.clientIdDescription", {
                defaultValue: "Find this under , select your agent application, then Overview. No client secret is required here.",
              })}
            >
              {({ value, onChange, ref, ...control }) => (
                <Input
                  {...control}
                  ref={ref}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              )}
            </AgentFormField>
            <AgentFormField name="execution_mode" label={i18n.t("agents.agentIdentityFields.executionMode", { defaultValue: "Execution Mode" })} defaultValue="autonomous">
              {({ value, onChange, id }) => (
                <Select
                  items={EXECUTION_MODE_OPTIONS}
                  value={typeof value === "string" ? value : "autonomous"}
                  onValueChange={onChange}
                >
                  <SelectTrigger id={id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXECUTION_MODE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AgentFormField>
            <AgentFormField
              name="identity_service_principal_id"
              label={i18n.t("agents.agentIdentityFields.servicePrincipalObjectId", { defaultValue: "Enterprise Application Object ID" })}
              rules={{
                required: mode !== "delegated" ? i18n.t("agents.agentIdentityFields.enterServicePrincipalId", { defaultValue: "Enter the service principal Object ID" }) : false,
                pattern: { value: IDENTITY_UUID_PATTERN, message: i18n.t("agents.agentIdentityFields.invalidServicePrincipalUuid", { defaultValue: "Enter a valid service principal UUID" }) },
              }}
              description={i18n.t("agents.agentIdentityFields.servicePrincipalDescription", {
                defaultValue: "Open , select this application, and copy its Object ID. The App registrations Object ID is a different value.",
              })}
            >
              {({ value, onChange, ref, ...control }) => (
                <Input {...control} ref={ref} value={typeof value === "string" ? value : ""} onChange={onChange} />
              )}
            </AgentFormField>

            <AgentFormField
              name="identity_required_roles"
              label={i18n.t("agents.agentIdentityFields.requiredApplicationRoles", { defaultValue: "Required Application Roles" })}
              description={i18n.t("agents.agentIdentityFields.requiredRolesDescription", { defaultValue: "Comma-separated role values required on autonomous application tokens" })}
            >
              {({ value, onChange, ref, ...control }) => (
                <Input
                  {...control}
                  ref={ref}
                  value={typeof value === "string" ? value : ""}
                  onChange={onChange}
                  placeholder="Agent.Invoke"
                />
              )}
            </AgentFormField>

            {showScopes && (
              <>
                <AgentFormField
                  name="identity_required_scopes"
                  label={i18n.t("agents.agentIdentityFields.requiredDelegatedScopes", { defaultValue: "Required Delegated Scopes" })}
                  defaultValue="user_impersonation"
                  rules={{ required: i18n.t("agents.agentIdentityFields.enterDelegatedScope", { defaultValue: "Enter a delegated scope" }) }}
                >
                  {({ value, onChange, ref, ...control }) => (
                    <Input
                      {...control}
                      ref={ref}
                      value={typeof value === "string" ? value : "user_impersonation"}
                      onChange={onChange}
                    />
                  )}
                </AgentFormField>
                <p className="text-sm text-muted-foreground">
                  {i18n.t("agents.agentIdentityFields.delegatedScopesNote", {
                    defaultValue: "Users must first sign in through this gateway's Microsoft SSO. Subsequent delegated calls must satisfy both user and agent permissions.",
                  })}
                </p>
              </>
            )}
            <AgentFormField name="enabled" label={i18n.t("agents.agentIdentityFields.execution", { defaultValue: "Execution" })} defaultValue={true}>
              {({ value, onChange, id }) => (
                <Select
                  items={EXECUTION_OPTIONS}
                  value={value === false ? "disabled" : "enabled"}
                  onValueChange={(next) => onChange(next === "enabled")}
                >
                  <SelectTrigger id={id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXECUTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </AgentFormField>
            <p className="text-sm text-muted-foreground">
              {i18n.t("agents.agentIdentityFields.verificationNote", {
                defaultValue: "中安云科 AI 安全网关 verifies the agent's Entra token before matching this identity. Saving these fields configures the binding; an authenticated request provides verification. Runtime authentication headers are configured separately.",
              })}
            </p>
          </>
        )}
      </section>
    </>
  );
};
