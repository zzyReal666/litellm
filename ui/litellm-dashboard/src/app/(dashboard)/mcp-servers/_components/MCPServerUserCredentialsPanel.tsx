"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShieldOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { fetchMCPServerUserCredentials, revokeMCPServerUserCredential } from "@/components/networking";
import type { MCPServerUserCredentialListItem } from "@/components/mcp_tools/types";
import { createQueryKeys } from "@/app/(dashboard)/hooks/common/queryKeysFactory";
import i18n from "@/lib/i18n";

const mcpServerUserCredentialKeys = createQueryKeys("mcpServerUserCredentials");

export function credentialTypeLabel(credentialType: MCPServerUserCredentialListItem["credential_type"]): string {
  return credentialType === "oauth2"
    ? i18n.t("mcpServerCredentials.oauth2", { defaultValue: "OAuth2" })
    : i18n.t("mcpServerCredentials.byokApiKey", { defaultValue: "BYOK API key" });
}

export function formatTimestamp(value: string | null): string {
  if (value === null) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function CredentialsBody({
  items,
  error,
  isLoading,
  onRevoke,
}: {
  items: MCPServerUserCredentialListItem[] | undefined;
  error: Error | null;
  isLoading: boolean;
  onRevoke: ((item: MCPServerUserCredentialListItem) => void) | null;
}) {
  if (isLoading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card p-12"
      >
        <UiLoadingSpinner className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{i18n.t("mcpServerCredentials.loading", { defaultValue: "Loading user credentials..." })}</p>
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{i18n.t("mcpServerCredentials.couldNotLoad", { defaultValue: "Could not load user credentials" })}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  if (!items) return null;
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">{i18n.t("mcpServerCredentials.noCredentials", { defaultValue: "No user has a stored credential for this server." })}</p>
      </div>
    );
  }
  return (
    <section aria-label={i18n.t("mcpServerCredentials.storedCredentials", { defaultValue: "Stored user credentials" })} className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{i18n.t("mcpServerCredentials.user", { defaultValue: "User" })}</TableHead>
            <TableHead>{i18n.t("mcpServerCredentials.type", { defaultValue: "Type" })}</TableHead>
            <TableHead>{i18n.t("mcpServerCredentials.connected", { defaultValue: "Connected" })}</TableHead>
            <TableHead>{i18n.t("mcpServerCredentials.expires", { defaultValue: "Expires" })}</TableHead>
            <TableHead>{i18n.t("mcpServerCredentials.updated", { defaultValue: "Updated" })}</TableHead>
            {onRevoke ? <TableHead className="text-right">{i18n.t("mcpServerCredentials.actions", { defaultValue: "Actions" })}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.user_id}>
              <TableCell className="font-mono text-xs">{item.user_id}</TableCell>
              <TableCell>
                <Badge variant="secondary">{credentialTypeLabel(item.credential_type)}</Badge>
              </TableCell>
              <TableCell className="text-xs">{formatTimestamp(item.connected_at)}</TableCell>
              <TableCell className="text-xs">{formatTimestamp(item.expires_at)}</TableCell>
              <TableCell className="text-xs">{formatTimestamp(item.updated_at)}</TableCell>
              {onRevoke ? (
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRevoke(item)}
                    aria-label={i18n.t("mcpServerCredentials.revokeAria", { user: item.user_id, defaultValue: `Revoke credential for user ${item.user_id}` })}
                  >
                    <ShieldOff className="size-4" />
                    {i18n.t("mcpServerCredentials.revoke", { defaultValue: "Revoke" })}
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

interface MCPServerUserCredentialsPanelProps {
  serverId: string;
  accessToken: string | null;
  canRevoke: boolean;
}

export function MCPServerUserCredentialsPanel({
  serverId,
  accessToken,
  canRevoke,
}: MCPServerUserCredentialsPanelProps) {
  const queryClient = useQueryClient();
  const [pendingItem, setPendingItem] = useState<MCPServerUserCredentialListItem | null>(null);
  const queryKey = mcpServerUserCredentialKeys.detail(serverId);
  const { data, error, isLoading, isFetching, refetch } = useQuery<MCPServerUserCredentialListItem[], Error>({
    queryKey,
    queryFn: () => fetchMCPServerUserCredentials(accessToken!, serverId),
    enabled: !!accessToken,
  });
  const revoke = useMutation<void, Error, MCPServerUserCredentialListItem>({
    mutationFn: (item) => revokeMCPServerUserCredential(accessToken!, serverId, item.user_id, item.credential_type),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
  const confirmRevoke = () => {
    if (pendingItem === null) return;
    revoke.mutate(pendingItem);
    setPendingItem(null);
  };

  return (
    <div className="space-y-4" data-testid="mcp-server-user-credentials-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{i18n.t("mcpServerCredentials.title", { defaultValue: "User Credentials" })}</h2>
          <p className="text-sm text-muted-foreground">
            {i18n.t("mcpServerCredentials.description", {
              defaultValue:
                "Per-user OAuth2 tokens and BYOK API keys stored for this server. Revoking one deletes it from the database and clears the cached copy, so the user must connect again before the gateway will call this server for them.",
            })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={i18n.t("mcpServerCredentials.refreshAria", { defaultValue: "Refresh user credentials" })}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          {i18n.t("mcpServerCredentials.refresh", { defaultValue: "Refresh" })}
        </Button>
      </div>

      {revoke.isError ? (
        <Alert variant="destructive">
          <AlertTitle>{i18n.t("mcpServerCredentials.couldNotRevoke", { defaultValue: "Could not revoke credential" })}</AlertTitle>
          <AlertDescription>{revoke.error.message}</AlertDescription>
        </Alert>
      ) : null}
      {revoke.isSuccess ? (
        <Alert>
          <AlertTitle>{i18n.t("mcpServerCredentials.revoked", { defaultValue: "Credential revoked" })}</AlertTitle>
          <AlertDescription>
            {i18n.t("mcpServerCredentials.revokedDescription", {
              type: credentialTypeLabel(revoke.variables.credential_type),
              user: revoke.variables.user_id,
              defaultValue: `The stored ${credentialTypeLabel(revoke.variables.credential_type)} credential for user ${revoke.variables.user_id} was deleted.`,
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      <CredentialsBody items={data} error={error} isLoading={isLoading} onRevoke={canRevoke ? setPendingItem : null} />

      <AlertDialog open={pendingItem !== null} onOpenChange={(open) => !open && setPendingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{i18n.t("mcpServerCredentials.revokeTitle", { defaultValue: "Revoke stored credential" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingItem
                ? i18n.t("mcpServerCredentials.revokeConfirmDescription", {
                    type: credentialTypeLabel(pendingItem.credential_type),
                    user: pendingItem.user_id,
                    defaultValue: `This deletes the ${credentialTypeLabel(pendingItem.credential_type)} credential stored for user ${pendingItem.user_id}. `,
                  })
                : ""}
              {i18n.t("mcpServerCredentials.revokeConsequence", { defaultValue: "Their next MCP request to this server fails until they connect again." })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setPendingItem(null)}>
              {i18n.t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button variant="destructive" onClick={confirmRevoke} disabled={revoke.isPending}>
              {i18n.t("mcpServerCredentials.revoke", { defaultValue: "Revoke" })}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MCPServerUserCredentialsPanel;
