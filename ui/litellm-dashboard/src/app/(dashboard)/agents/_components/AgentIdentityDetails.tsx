import React from "react";
import type { components } from "@/lib/http/schema";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/components/networking";
import { Button } from "@/components/ui/button";
import i18n from "@/lib/i18n";
import { readAgentIdentity } from "./agent_identity";

const authenticationMessage = (error: boolean, lastAuthenticated?: string | null): string => {
  if (error) return i18n.t("' + A + '.couldNotLoadEvidence", { defaultValue: "Could not load authentication evidence" });
  if (lastAuthenticated)
    return i18n.t("' + A + '.lastAuthenticated", {
      defaultValue: "Last authenticated identity match: {{time}}",
      time: new Date(lastAuthenticated).toLocaleString(),
    });
  return i18n.t("' + A + '.awaitingAuth", { defaultValue: "Configured, awaiting an authenticated request" });
};

export const AgentIdentityDetails = ({
  agentId,
  identity: value,
  accessToken,
  isAdmin,
}: {
  agentId: string;
  identity: unknown;
  accessToken: string | null;
  isAdmin: boolean;
}) => {
  const identity = readAgentIdentity(value);
  const { data, isError, isFetching, refetch } = useQuery({
    queryKey: ["agent-identity", agentId, identity],
    queryFn: () =>
      apiClient.get<components["schemas"]["ManagedAgentIdentityStatus"]>(
        `/v1/agents/${encodeURIComponent(agentId)}/identity`,
        {
          accessToken: accessToken ?? "",
        },
      ),
    enabled: Boolean(isAdmin && accessToken && identity),
  });

  if (!identity || !isAdmin) return null;
  const executionLabel = data?.enabled
    ? i18n.t("agentsPage.agentIdentity.enabled", { defaultValue: "Enabled" })
    : i18n.t("agentsPage.agentIdentity.disabled", { defaultValue: "Disabled" });
  return (
    <section aria-label={i18n.t("agentsPage.agentIdentity.sectionAria", { defaultValue: "Agent Identity" })} className="mb-6 space-y-2 rounded-lg border border-border p-4">
      <h3 className="font-medium">{i18n.t("agentsPage.agentIdentity.title", { defaultValue: "Agent Identity: Microsoft Entra ID" })}</h3>
      <p className="text-sm">
        {i18n.t("' + A + '.tenant", { defaultValue: "Tenant:" })} <span className="font-mono">{identity.tenant_id}</span>
      </p>
      <>
        <p className="text-sm">
          {i18n.t("' + A + '.clientId", { defaultValue: "Application (Client) ID:" })}{" "}
          <span className="font-mono">{identity.client_id}</span>
        </p>
        <p className="text-sm">
          {i18n.t("' + A + '.objectId", { defaultValue: "Enterprise application Object ID:" })}{" "}
          {identity.service_principal_id || i18n.t("' + A + '.notConfigured", { defaultValue: "Not configured" })}
        </p>
      </>
      <p className="text-sm">
        {i18n.t("' + A + '.execution", {
          defaultValue: "Execution: {{state}} · Mode: {{mode}}",
          state: data ? executionLabel : i18n.t("' + A + '.loading", { defaultValue: "Loading" }),
          mode: data?.execution_mode ?? i18n.t("' + A + '.loading", { defaultValue: "Loading" }),
        })}
      </p>
      <p className="text-sm">
        {data?.identity?.active === false
          ? i18n.t("' + A + '.unbound", { defaultValue: "Identity unbound; execution is disabled" })
          : authenticationMessage(isError, data?.last_authenticated_at)}
      </p>
      <p className="text-xs text-muted-foreground">
        {i18n.t("' + A + '.evidenceNote", {
          defaultValue:
            "Recent evidence comes from a validated Entra token matching this binding. It is persisted across restarts and cleared when the binding changes. Tool and model permissions are checked separately.",
        })}
      </p>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => {
            void refetch();
          }}
        >
          {i18n.t("' + A + '.refreshEvidence", { defaultValue: "Refresh authentication evidence" })}
        </Button>
        <a className="text-sm underline" href="/ui/logs/">
          {i18n.t("' + A + '.viewRequestLogs", { defaultValue: "View request logs" })}
        </a>
      </div>
    </section>
  );
};
