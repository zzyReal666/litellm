import React from "react";
import i18n from "@/lib/i18n";
import VectorStorePermissions from "./permissions/VectorStorePermissions";
import MCPServerPermissions from "./permissions/MCPServerPermissions";
import AgentPermissions from "./permissions/AgentPermissions";
import type { ObjectPermission } from "./object_permission_types";
import type { InheritedGrant } from "./permissions/inheritedGrants";

interface ObjectPermissionsViewProps {
  objectPermission?: ObjectPermission | null;
  inheritedMcpServers?: InheritedGrant[];
  inheritedAgents?: InheritedGrant[];
  variant?: "card" | "inline";
  className?: string;
  accessToken?: string | null;
}

export function ObjectPermissionsView({
  objectPermission,
  inheritedMcpServers = [],
  inheritedAgents = [],
  variant = "card",
  className = "",
  accessToken,
}: ObjectPermissionsViewProps) {
  const vectorStores = objectPermission?.vector_stores || [];
  const mcpServers = objectPermission?.mcp_servers || [];
  const mcpAccessGroups = objectPermission?.mcp_access_groups || [];
  const mcpToolPermissions = objectPermission?.mcp_tool_permissions || {};
  const mcpToolsets = objectPermission?.mcp_toolsets || [];
  const agents = objectPermission?.agents || [];
  const agentAccessGroups = objectPermission?.agent_access_groups || [];
  const searchTools = objectPermission?.search_tools || [];
  const skills = objectPermission?.skills || [];

  const content = (
    <div className={variant === "card" ? "grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 gap-6" : "space-y-4"}>
      <VectorStorePermissions vectorStores={vectorStores} accessToken={accessToken} />
      <MCPServerPermissions
        mcpServers={mcpServers}
        mcpAccessGroups={mcpAccessGroups}
        mcpToolPermissions={mcpToolPermissions}
        mcpToolsets={mcpToolsets}
        inheritedMcpServers={inheritedMcpServers}
        accessToken={accessToken}
      />
      <AgentPermissions
        agents={agents}
        agentAccessGroups={agentAccessGroups}
        inheritedAgents={inheritedAgents}
        accessToken={accessToken}
      />
      <div className="min-w-0 rounded-md border border-border p-4">
        <p className="text-sm font-medium text-foreground">{i18n.t("objectPermissionsView.search-tools", { defaultValue: "Search tools" })}</p>
        {searchTools.length === 0 ? (
          <p className="mt-1 block text-xs text-muted-foreground">
            {i18n.t("objectPermissionsView.no-restriction-all-configured-search-tools-a", { defaultValue: "No restriction — all configured search tools are allowed for this team." })}{" "}</p>
        ) : (
          <p className="mt-1 block text-xs break-words text-foreground">{searchTools.join(", ")}</p>
        )}
      </div>
      <div className="min-w-0 rounded-md border border-border p-4">
        <p className="text-sm font-medium text-foreground">Skills</p>
        {skills.length === 0 ? (
          <p className="mt-1 block text-xs text-muted-foreground">
            {i18n.t("objectPermissionsView.no-private-skills-granted-only-enabled-publi", { defaultValue: "No private skills granted. Only enabled (public) Claude Code plugins are visible." })}{" "}</p>
        ) : (
          <p className="mt-1 block text-xs break-words text-foreground">{skills.join(", ")}</p>
        )}
      </div>
    </div>
  );

  if (variant === "card") {
    return (
      <div className={`@container bg-card border border-border rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-6">
          <div>
            <p className="font-semibold text-foreground">{i18n.t("objectPermissionsView.object-permissions", { defaultValue: "Object Permissions" })}</p>
            <p className="text-xs text-muted-foreground">{i18n.t("objectPermissionsView.access-control-for-vector-stores-and-mcp-ser", { defaultValue: "Access control for Vector Stores and MCP Servers" })}</p>
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <p className="font-medium text-foreground mb-3">{i18n.t("objectPermissionsView.object-permissions-2", { defaultValue: "Object Permissions" })}</p>
      {content}
    </div>
  );
}

export default ObjectPermissionsView;
