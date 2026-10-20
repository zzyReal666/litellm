"use client";

import { ColumnFiltersState, OnChangeFn, PaginationState } from "@tanstack/react-table";
import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TFunction } from "i18next";

import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  AUDIT_TABLE_NAME_DISPLAY,
  AUDIT_TABLE_NAME_DISPLAY_KEYS,
  AuditLogEntry,
  getAuditLogsTableColumns,
} from "./AuditLogsTableColumns";

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
  { labelKey: "viewLogs.auditLogs.actionCreated", label: "Created", value: "created" },
  { labelKey: "viewLogs.auditLogs.actionUpdated", label: "Updated", value: "updated" },
  { labelKey: "viewLogs.auditLogs.actionDeleted", label: "Deleted", value: "deleted" },
  { labelKey: "viewLogs.auditLogs.actionRotated", label: "Rotated", value: "rotated" },
] as const;

const TABLE_OPTIONS = [
  { labelKey: "viewLogs.columns.auditTableKeys", label: "Keys", value: "LiteLLM_VerificationToken" },
  { labelKey: "viewLogs.columns.auditTableTeams", label: "Teams", value: "LiteLLM_TeamTable" },
  { labelKey: "viewLogs.columns.auditTableUsers", label: "Users", value: "LiteLLM_UserTable" },
  { labelKey: "viewLogs.columns.auditTableOrganizations", label: "Organizations", value: "LiteLLM_OrganizationTable" },
  { labelKey: "viewLogs.columns.auditTableModels", label: "Models", value: "LiteLLM_ProxyModelTable" },
] as const;

const ACTION_FILTER_ITEMS = [
  { value: ALL_VALUE, labelKey: "viewLogs.auditLogs.allActions", label: "All Actions" },
  ...ACTION_OPTIONS.map((option) => ({ value: option.value, labelKey: option.labelKey, label: option.label })),
];

const TABLE_FILTER_ITEMS = [
  { value: ALL_VALUE, labelKey: "viewLogs.auditLogs.allTables", label: "All Tables" },
  ...TABLE_OPTIONS.map((option) => ({ value: option.value, labelKey: option.labelKey, label: option.label })),
];

const FILTER_LABELS: Record<string, { labelKey: string; label: string }> = {
  object_id: { labelKey: "viewLogs.auditLogs.colObjectId", label: "Object ID" },
  changed_by: { labelKey: "viewLogs.auditLogs.colChangedBy", label: "Changed By" },
  team_id: { labelKey: "viewLogs.filterOptions.teamIdLabel", label: "Team ID" },
  key_hash: { labelKey: "viewLogs.filterOptions.keyHashLabel", label: "Key Hash" },
  action: { labelKey: "viewLogs.auditLogs.colAction", label: "Action" },
  table_name: { labelKey: "viewLogs.auditLogs.colTable", label: "Table" },
};

const formatFilterValue = (t: TFunction, columnId: string, value: unknown): string => {
  const raw = String(value);
  if (columnId === "action") {
    const option = ACTION_OPTIONS.find((entry) => entry.value === raw);
    return option ? t(option.labelKey, { defaultValue: option.label }) : raw;
  }
  if (columnId === "table_name") {
    const labelKey = AUDIT_TABLE_NAME_DISPLAY_KEYS[raw];
    return labelKey ? t(labelKey, { defaultValue: AUDIT_TABLE_NAME_DISPLAY[raw] ?? raw }) : raw;
  }
  return raw;
};

function AuditLogsEmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <ScrollText className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {filtered
          ? t("viewLogs.auditLogsTable.noMatchingLogs", { defaultValue: "No matching audit logs" })
          : t("viewLogs.auditLogsTable.noLogsYet", { defaultValue: "No audit logs yet" })}
      </div>
      <div className="max-w-xs text-center text-sm text-muted-foreground">
        {filtered
          ? t("viewLogs.auditLogsTable.noMatchingLogsHint", {
              defaultValue: "No audit log entries match your filters.",
            })
          : t("viewLogs.auditLogsTable.logsAppearHere", {
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
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const columns = useMemo(() => getAuditLogsTableColumns({ onViewLog, t }), [onViewLog, t]);
  const hasActiveSearch = Boolean(searchValue?.trim());

  return (
    <DataTable
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
      loadingMessage={t("viewLogs.auditLogsTable.loadingAuditLogs", { defaultValue: "Loading audit logs…" })}
      noDataMessage={<AuditLogsEmptyState filtered={columnFilters.length > 0 || hasActiveSearch} />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={t("viewLogs.auditLogsTable.searchPlaceholder", {
              defaultValue: "Search audit logs by ID…",
            })}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onOpenFilters={() => setFiltersOpen(true)}
            filterLabels={Object.fromEntries(
              Object.entries(FILTER_LABELS).map(([filterId, spec]) => [
                filterId,
                t(spec.labelKey, { defaultValue: spec.label }),
              ]),
            )}
            formatFilterValue={(columnId, value) => formatFilterValue(t, columnId, value)}
            showViewOptions={false}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t("molecules.filter.filters", { defaultValue: "Filters" })}
            description={t("viewLogs.auditLogsTable.filtersDescription", {
              defaultValue: "Narrow down audit log entries",
            })}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField label={t("viewLogs.auditLogs.colObjectId", { defaultValue: "Object ID" })}>
                  <Input
                    value={(get("object_id") as string) ?? ""}
                    onChange={(event) => set("object_id", event.target.value)}
                    placeholder={t("viewLogs.auditLogsTable.objectIdPlaceholder", {
                      defaultValue: "Enter object ID…",
                    })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("viewLogs.auditLogs.colChangedBy", { defaultValue: "Changed By" })}>
                  <Input
                    value={(get("changed_by") as string) ?? ""}
                    onChange={(event) => set("changed_by", event.target.value)}
                    placeholder={t("viewLogs.auditLogsTable.userIdPlaceholder", {
                      defaultValue: "Enter user ID…",
                    })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("viewLogs.filterOptions.teamIdLabel", { defaultValue: "Team ID" })}>
                  <Input
                    value={(get("team_id") as string) ?? ""}
                    onChange={(event) => set("team_id", event.target.value)}
                    placeholder={t("viewLogs.auditLogsTable.teamIdPlaceholder", {
                      defaultValue: "Enter team ID…",
                    })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("viewLogs.filterOptions.keyHashLabel", { defaultValue: "Key Hash" })}>
                  <Input
                    value={(get("key_hash") as string) ?? ""}
                    onChange={(event) => set("key_hash", event.target.value)}
                    placeholder={t("viewLogs.filterOptions.keyHashPlaceholder", { defaultValue: "Enter key hash…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("viewLogs.auditLogs.colAction", { defaultValue: "Action" })}>
                  <Select
                    items={ACTION_FILTER_ITEMS}
                    value={(get("action") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("action", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("viewLogs.auditLogs.allActions", { defaultValue: "All Actions" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>
                        {t("viewLogs.auditLogs.allActions", { defaultValue: "All Actions" })}
                      </SelectItem>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey, { defaultValue: option.label })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={t("viewLogs.auditLogs.colTable", { defaultValue: "Table" })}>
                  <Select
                    items={TABLE_FILTER_ITEMS}
                    value={(get("table_name") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("table_name", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("viewLogs.auditLogs.allTables", { defaultValue: "All Tables" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>
                        {t("viewLogs.auditLogs.allTables", { defaultValue: "All Tables" })}
                      </SelectItem>
                      {TABLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey, { defaultValue: option.label })}
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
