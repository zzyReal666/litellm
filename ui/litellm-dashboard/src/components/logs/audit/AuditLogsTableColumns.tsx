"use client";

import { ColumnDef } from "@tanstack/react-table";

import i18n from "@/lib/i18n";
import { DateCell, IdCell, IdentityCell, StatusBadge, type StatusTone } from "@/components/shared/table_cells";

import DefaultProxyAdminTag from "../../common_components/DefaultProxyAdminTag";

export type AuditLogEntry = {
  id: string;
  updated_at: string;
  changed_by: string;
  changed_by_api_key: string;
  action: string;
  table_name: string;
  object_id: string;
  before_value: Record<string, unknown>;
  updated_values: Record<string, unknown>;
};

export const AUDIT_TABLE_NAME_DISPLAY: Record<string, string> = {
  LiteLLM_VerificationToken: i18n.t("viewLogs.audit.keys", { defaultValue: "Keys" }),
  LiteLLM_TeamTable: i18n.t("viewLogs.audit.teams", { defaultValue: "Teams" }),
  LiteLLM_UserTable: i18n.t("viewLogs.audit.users", { defaultValue: "Users" }),
  LiteLLM_OrganizationTable: i18n.t("viewLogs.audit.organizations", { defaultValue: "Organizations" }),
  LiteLLM_ProxyModelTable: i18n.t("viewLogs.audit.models", { defaultValue: "Models" }),
  LiteLLM_AgentsTable: i18n.t("viewLogs.audit.agents", { defaultValue: "Agents" }),
};

const ACTION_TONE: Record<string, StatusTone> = {
  created: "success",
  updated: "info",
  deleted: "error",
  rotated: "warning",
  kill_switch_fired: "error",
};

const ACTION_LABELS: Record<string, string> = {
  created: i18n.t("viewLogs.audit.created", { defaultValue: "Created" }),
  updated: i18n.t("viewLogs.audit.updated", { defaultValue: "Updated" }),
  deleted: i18n.t("viewLogs.audit.deleted", { defaultValue: "Deleted" }),
  rotated: i18n.t("viewLogs.audit.rotated", { defaultValue: "Rotated" }),
  kill_switch_fired: i18n.t("viewLogs.audit.killSwitchFired", { defaultValue: "Kill switch fired" }),
};

export const auditActionLabel = (action: string): string =>
  ACTION_LABELS[action] ?? action.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

interface AuditLogsTableColumnsDeps {
  onViewLog: (log: AuditLogEntry) => void;
}

export const getAuditLogsTableColumns = ({ onViewLog }: AuditLogsTableColumnsDeps): ColumnDef<AuditLogEntry>[] => [
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: i18n.t("viewLogs.audit.timestamp", { defaultValue: "Timestamp" }),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} />,
  },
  {
    id: "action",
    accessorKey: "action",
    header: i18n.t("viewLogs.audit.action", { defaultValue: "Action" }),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge tone={ACTION_TONE[row.original.action] ?? "neutral"} label={auditActionLabel(row.original.action)} />
    ),
  },
  {
    id: "table_name",
    accessorKey: "table_name",
    header: i18n.t("viewLogs.audit.table", { defaultValue: "Table" }),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{AUDIT_TABLE_NAME_DISPLAY[row.original.table_name] ?? row.original.table_name}</span>
    ),
  },
  {
    id: "object_id",
    accessorKey: "object_id",
    header: i18n.t("viewLogs.audit.objectId", { defaultValue: "Object ID" }),
    minSize: 220,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.object_id}
        titleClassName="font-mono text-xs font-normal text-primary"
        className="max-w-72"
        onClick={() => onViewLog(row.original)}
      />
    ),
  },
  {
    id: "changed_by",
    accessorKey: "changed_by",
    header: i18n.t("viewLogs.audit.changedBy", { defaultValue: "Changed By" }),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DefaultProxyAdminTag userId={row.original.changed_by} />,
  },
  {
    id: "changed_by_api_key",
    accessorKey: "changed_by_api_key",
    header: i18n.t("viewLogs.audit.apiKeyHash", { defaultValue: "API Key (Hash)" }),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.changed_by_api_key} variant="plain" />,
  },
];
