import React from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon, CopyIcon } from "lucide-react";

import type { ObjectPermission } from "@/components/object_permission_types";
import MCPServerPermissions from "@/components/permissions/MCPServerPermissions";
import { getBudgetDurationLabel } from "@/components/common_components/budget_duration_dropdown";
import { Button } from "@/components/ui/button";
import { formatNumberWithCommas } from "@/utils/dataUtils";

export interface UserDetailsValues {
  user_id: string;
  user_email?: string | null;
  user_alias?: string | null;
  user_role?: string | null;
  models?: string[] | null;
  max_budget?: number | null;
  budget_duration?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: Record<string, unknown> | null;
  object_permission?: ObjectPermission | null;
}

interface UserDetailsPanelProps {
  userData: UserDetailsValues;
  accessToken: string | null;
  copiedStates: Record<string, boolean>;
  copyToClipboard: (text: string, key: string) => void;
}

export default function UserDetailsPanel({
  userData,
  accessToken,
  copiedStates,
  copyToClipboard,
}: UserDetailsPanelProps) {
  const { t } = useTranslation();
  const notSet = t("viewUsers.userInfoView.notSet", { defaultValue: "Not Set" });

  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.userIdLabel", { defaultValue: "User ID" })}</p>
        <div className="flex items-center cursor-pointer">
          <span className="font-mono">{userData.user_id}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => copyToClipboard(userData.user_id, "user-id")}
            className={`left-2 z-raised transition-all duration-200 ${
              copiedStates["user-id"]
                ? "text-success bg-success/10 border-success/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {copiedStates["user-id"] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          </Button>
        </div>
      </div>

      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.emailLabel", { defaultValue: "Email" })}</p>
        <p>{userData.user_email || notSet}</p>
      </div>

      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.userAliasLabel", { defaultValue: "User Alias" })}</p>
        <p>{userData.user_alias || notSet}</p>
      </div>

      <div>
        <p className="font-medium">
          {t("viewUsers.userInfoView.globalProxyRoleLabel", { defaultValue: "Global Proxy Role" })}
        </p>
        <p>{userData.user_role || notSet}</p>
      </div>

      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.createdLabel", { defaultValue: "Created" })}</p>
        <p>
          {userData.created_at
            ? new Date(userData.created_at).toLocaleString()
            : t("viewUsers.userInfoView.unknown", { defaultValue: "Unknown" })}
        </p>
      </div>

      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.lastUpdatedLabel", { defaultValue: "Last Updated" })}</p>
        <p>
          {userData.updated_at
            ? new Date(userData.updated_at).toLocaleString()
            : t("viewUsers.userInfoView.unknown", { defaultValue: "Unknown" })}
        </p>
      </div>

      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.personalModels", { defaultValue: "Personal Models" })}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {userData.models?.length && userData.models.length > 0 ? (
            userData.models.map((model, index) => (
              <span key={index} className="px-2 py-1 bg-info/15 rounded-sm text-xs">
                {model}
              </span>
            ))
          ) : (
            <p>{t("viewUsers.userInfoView.allProxyModels", { defaultValue: "All proxy models" })}</p>
          )}
        </div>
      </div>

      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.maxBudgetLabel", { defaultValue: "Max Budget" })}</p>
        <p>
          {userData.max_budget !== null && userData.max_budget !== undefined
            ? `$${formatNumberWithCommas(userData.max_budget, 4)}`
            : t("viewUsers.userInfoView.unlimitedBudget", { defaultValue: "Unlimited" })}
        </p>
      </div>

      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.budgetResetLabel", { defaultValue: "Budget Reset" })}</p>
        <p>{getBudgetDurationLabel(userData.budget_duration ?? null, t)}</p>
      </div>

      <div>
        <p className="font-medium">{t("viewUsers.userInfoView.metadataLabel", { defaultValue: "Metadata" })}</p>
        <pre className="bg-muted p-2 rounded-sm text-xs overflow-auto mt-1">
          {JSON.stringify(userData.metadata || {}, null, 2)}
        </pre>
      </div>

      <div>
        <p className="font-medium mb-2">
          {t("viewUsers.userInfoView.mcpPermissionsLabel", { defaultValue: "MCP Permissions" })}
        </p>
        <MCPServerPermissions
          mcpServers={userData.object_permission?.mcp_servers || []}
          mcpAccessGroups={userData.object_permission?.mcp_access_groups || []}
          mcpToolPermissions={userData.object_permission?.mcp_tool_permissions || {}}
          mcpToolsets={userData.object_permission?.mcp_toolsets || []}
          accessToken={accessToken}
        />
      </div>
    </div>
  );
}
