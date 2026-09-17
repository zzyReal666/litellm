"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import { DateCell, IdCell, IdentityCell, StatusBadge, type StatusTone } from "@/components/shared/table_cells";

import DefaultProxyAdminTag from "../common_components/DefaultProxyAdminTag";

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
  LiteLLM_VerificationToken: "Keys",
  LiteLLM_TeamTable: "Teams",
  LiteLLM_UserTable: "Users",
  LiteLLM_OrganizationTable: "Organizations",
  LiteLLM_ProxyModelTable: "Models",
};

export const AUDIT_TABLE_NAME_DISPLAY_KEYS: Record<string, string> = {
  LiteLLM_VerificationToken: "viewLogs.columns.auditTableKeys",
  LiteLLM_TeamTable: "viewLogs.columns.auditTableTeams",
  LiteLLM_UserTable: "viewLogs.columns.auditTableUsers",
  LiteLLM_OrganizationTable: "viewLogs.columns.auditTableOrganizations",
  LiteLLM_ProxyModelTable: "viewLogs.columns.auditTableModels",
};

export const AUDIT_LOGS_COLUMN_HEADERS: Record<string, { labelKey: string; label: string }> = {
  updated_at: { labelKey: "viewLogs.auditLogs.colTimestamp", label: "Timestamp" },
  action: { labelKey: "viewLogs.auditLogs.colAction", label: "Action" },
  table_name: { labelKey: "viewLogs.auditLogs.colTable", label: "Table" },
  object_id: { labelKey: "viewLogs.auditLogs.colObjectId", label: "Object ID" },
  changed_by: { labelKey: "viewLogs.auditLogs.colChangedBy", label: "Changed By" },
  changed_by_api_key: { labelKey: "viewLogs.auditLogs.colApiKeyHash", label: "API Key (Hash)" },
};

const headerText = (t: TFunction, columnId: string): string => {
  const spec = AUDIT_LOGS_COLUMN_HEADERS[columnId];
  return t(spec.labelKey, { defaultValue: spec.label });
};

const ACTION_TONE: Record<string, StatusTone> = {
  created: "success",
  updated: "info",
  deleted: "error",
  rotated: "warning",
};

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

interface AuditLogsTableColumnsDeps {
  onViewLog: (log: AuditLogEntry) => void;
  t: TFunction;
}

export const getAuditLogsTableColumns = ({ onViewLog, t }: AuditLogsTableColumnsDeps): ColumnDef<AuditLogEntry>[] => [
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: headerText(t, "updated_at"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} />,
  },
  {
    id: "action",
    accessorKey: "action",
    header: headerText(t, "action"),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge tone={ACTION_TONE[row.original.action] ?? "neutral"} label={capitalize(row.original.action)} />
    ),
  },
  {
    id: "table_name",
    accessorKey: "table_name",
    header: headerText(t, "table_name"),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">
        {t(AUDIT_TABLE_NAME_DISPLAY_KEYS[row.original.table_name], {
          defaultValue: AUDIT_TABLE_NAME_DISPLAY[row.original.table_name] ?? row.original.table_name,
        })}
      </span>
    ),
  },
  {
    id: "object_id",
    accessorKey: "object_id",
    header: headerText(t, "object_id"),
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
    header: headerText(t, "changed_by"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DefaultProxyAdminTag userId={row.original.changed_by} />,
  },
  {
    id: "changed_by_api_key",
    accessorKey: "changed_by_api_key",
    header: headerText(t, "changed_by_api_key"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.changed_by_api_key} variant="plain" />,
  },
];
