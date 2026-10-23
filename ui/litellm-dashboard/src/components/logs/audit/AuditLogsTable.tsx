"use client";

import { ColumnFiltersState, OnChangeFn, PaginationState } from "@tanstack/react-table";
import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";

import i18n from "@/lib/i18n";

import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AUDIT_TABLE_NAME_DISPLAY, AuditLogEntry, getAuditLogsTableColumns } from "./AuditLogsTableColumns";

interface AuditLogsTableProps {
  data: AuditLogEntry[];
  rowCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh: () => void;
  onViewLog: (log: AuditLogEntry) => void;
}

const ALL_VALUE = "all";

const ACTION_OPTIONS = [
  { label: i18n.t("viewLogs.audit.created", { defaultValue: "Created" }), value: "created" },
  { label: i18n.t("viewLogs.audit.updated", { defaultValue: "Updated" }), value: "updated" },
  { label: i18n.t("viewLogs.audit.deleted", { defaultValue: "Deleted" }), value: "deleted" },
  { label: i18n.t("viewLogs.audit.rotated", { defaultValue: "Rotated" }), value: "rotated" },
  { label: i18n.t("viewLogs.audit.killSwitchFired", { defaultValue: "Kill switch fired" }), value: "kill_switch_fired" },
] as const;

const TABLE_OPTIONS = [
  { label: i18n.t("viewLogs.audit.keys", { defaultValue: "Keys" }), value: "LiteLLM_VerificationToken" },
  { label: i18n.t("viewLogs.audit.teams", { defaultValue: "Teams" }), value: "LiteLLM_TeamTable" },
  { label: i18n.t("viewLogs.audit.users", { defaultValue: "Users" }), value: "LiteLLM_UserTable" },
  { label: i18n.t("viewLogs.audit.organizations", { defaultValue: "Organizations" }), value: "LiteLLM_OrganizationTable" },
  { label: i18n.t("viewLogs.audit.models", { defaultValue: "Models" }), value: "LiteLLM_ProxyModelTable" },
  { label: i18n.t("viewLogs.audit.agents", { defaultValue: "Agents" }), value: "LiteLLM_AgentsTable" },
] as const;

const ACTION_FILTER_ITEMS = [
  { value: ALL_VALUE, label: i18n.t("viewLogs.audit.allActions", { defaultValue: "All Actions" }) },
  ...ACTION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

const TABLE_FILTER_ITEMS = [
  { value: ALL_VALUE, label: i18n.t("viewLogs.audit.allTables", { defaultValue: "All Tables" }) },
  ...TABLE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

const FILTER_LABELS: Record<string, string> = {
  object_id: i18n.t("viewLogs.audit.objectId", { defaultValue: "Object ID" }),
  changed_by: i18n.t("viewLogs.audit.changedBy", { defaultValue: "Changed By" }),
  team_id: i18n.t("viewLogs.filters.teamId", { defaultValue: "Team ID" }),
  key_hash: i18n.t("viewLogs.filters.keyHash", { defaultValue: "Key Hash" }),
  action: i18n.t("viewLogs.audit.action", { defaultValue: "Action" }),
  table_name: i18n.t("viewLogs.audit.table", { defaultValue: "Table" }),
};

const formatFilterValue = (columnId: string, value: unknown): string => {
  const raw = String(value);
  if (columnId === "action") {
    return ACTION_OPTIONS.find((option) => option.value === raw)?.label ?? raw;
  }
  if (columnId === "table_name") {
    return AUDIT_TABLE_NAME_DISPLAY[raw] ?? raw;
  }
  return raw;
};

function AuditLogsEmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <ScrollText className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {filtered
          ? i18n.t("viewLogs.audit.noMatchingAuditLogs", { defaultValue: "No matching audit logs" })
          : i18n.t("viewLogs.audit.noAuditLogsYet", { defaultValue: "No audit logs yet" })}
      </div>
      <div className="max-w-xs text-center text-sm text-muted-foreground">
        {filtered
          ? i18n.t("viewLogs.audit.noMatchingDescription", { defaultValue: "No audit log entries match your filters." })
          : i18n.t("viewLogs.audit.adminChangesDescription", {
              defaultValue: "Administrative changes to keys, teams, users, and models will appear here.",
            })}
      </div>
    </div>
  );
}

export function AuditLogsTable({
  data,
  rowCount,
  isLoading,
  isRefreshing,
  pagination,
  onPaginationChange,
  columnFilters,
  onColumnFiltersChange,
  searchValue,
  onSearchChange,
  onRefresh,
  onViewLog,
}: AuditLogsTableProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const columns = useMemo(() => getAuditLogsTableColumns({ onViewLog }), [onViewLog]);
  const hasActiveSearch = Boolean(searchValue?.trim());

  return (
    <DataTable
      fillHeight
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      filterMode="server"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      isLoading={isLoading}
      loadingMessage={i18n.t("viewLogs.audit.loading", { defaultValue: "Loading audit logs…" })}
      noDataMessage={<AuditLogsEmptyState filtered={columnFilters.length > 0 || hasActiveSearch} />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={i18n.t("viewLogs.audit.searchAuditLogs", { defaultValue: "Search audit logs by ID…" })}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onOpenFilters={() => setFiltersOpen(true)}
            filterLabels={FILTER_LABELS}
            formatFilterValue={formatFilterValue}
            showViewOptions={false}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={i18n.t("viewLogs.audit.filters", { defaultValue: "Filters" })}
            description={i18n.t("viewLogs.audit.narrowDown", { defaultValue: "Narrow down audit log entries" })}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField label={i18n.t("viewLogs.audit.objectId", { defaultValue: "Object ID" })}>
                  <Input
                    value={(get("object_id") as string) ?? ""}
                    onChange={(event) => set("object_id", event.target.value)}
                    placeholder={i18n.t("viewLogs.audit.enterObjectId", { defaultValue: "Enter object ID…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={i18n.t("viewLogs.audit.changedBy", { defaultValue: "Changed By" })}>
                  <Input
                    value={(get("changed_by") as string) ?? ""}
                    onChange={(event) => set("changed_by", event.target.value)}
                    placeholder={i18n.t("viewLogs.audit.enterUserId", { defaultValue: "Enter user ID…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={i18n.t("viewLogs.filters.teamId", { defaultValue: "Team ID" })}>
                  <Input
                    value={(get("team_id") as string) ?? ""}
                    onChange={(event) => set("team_id", event.target.value)}
                    placeholder={i18n.t("viewLogs.audit.enterTeamId", { defaultValue: "Enter team ID…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={i18n.t("viewLogs.filters.keyHash", { defaultValue: "Key Hash" })}>
                  <Input
                    value={(get("key_hash") as string) ?? ""}
                    onChange={(event) => set("key_hash", event.target.value)}
                    placeholder={i18n.t("viewLogs.filters.enterKeyHash", { defaultValue: "Enter key hash…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={i18n.t("viewLogs.audit.action", { defaultValue: "Action" })}>
                  <Select
                    items={ACTION_FILTER_ITEMS}
                    value={(get("action") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("action", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={i18n.t("viewLogs.audit.allActions", { defaultValue: "All Actions" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{i18n.t("viewLogs.audit.allActions", { defaultValue: "All Actions" })}</SelectItem>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={i18n.t("viewLogs.audit.table", { defaultValue: "Table" })}>
                  <Select
                    items={TABLE_FILTER_ITEMS}
                    value={(get("table_name") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("table_name", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={i18n.t("viewLogs.audit.allTables", { defaultValue: "All Tables" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{i18n.t("viewLogs.audit.allTables", { defaultValue: "All Tables" })}</SelectItem>
                      {TABLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
              </>
            )}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}
