"use client";

import { ColumnFiltersState } from "@tanstack/react-table";
import { TFunction } from "i18next";
import { Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ToolRow } from "@/components/networking";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { INPUT_POLICY_OPTIONS, OUTPUT_POLICY_OPTIONS } from "./PolicySelect";
import { getToolPoliciesTableColumns } from "./ToolPoliciesTableColumns";

const ALL_VALUE = "all";

interface PolicyFilterItem {
  value: string;
  labelKey: string;
  label: string;
}

const INPUT_POLICY_FILTER_ITEMS: PolicyFilterItem[] = [
  { value: ALL_VALUE, labelKey: "toolPolicies.allInputPolicies", label: "All Input Policies" },
  ...INPUT_POLICY_OPTIONS.map((option) => ({ value: option.value, labelKey: option.labelKey, label: option.label })),
];

const OUTPUT_POLICY_FILTER_ITEMS: PolicyFilterItem[] = [
  { value: ALL_VALUE, labelKey: "toolPolicies.allOutputPolicies", label: "All Output Policies" },
  ...OUTPUT_POLICY_OPTIONS.map((option) => ({ value: option.value, labelKey: option.labelKey, label: option.label })),
];

const localizeItems = (items: readonly PolicyFilterItem[], t: TFunction): { value: string; label: string }[] =>
  items.map((item) => ({ value: item.value, label: t(item.labelKey, { defaultValue: item.label }) }));

const toFilterValue = (value: string | null): string | undefined =>
  value === null || value === ALL_VALUE ? undefined : value;

interface ToolPoliciesTableProps {
  data: ToolRow[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectTool: (toolName: string) => void;
  savingInput: ReadonlySet<string>;
  savingOutput: ReadonlySet<string>;
  onInputPolicyChange: (toolName: string, policy: string) => void;
  onOutputPolicyChange: (toolName: string, policy: string) => void;
}

function ToolPoliciesEmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Wrench className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {filtered
          ? t("toolPolicies.noMatchingTools", { defaultValue: "No matching tools" })
          : t("toolPolicies.noToolsDiscoveredTitle", { defaultValue: "No tools discovered" })}
      </div>
      <div className="max-w-xs text-center text-sm text-muted-foreground">
        {filtered
          ? t("toolPolicies.noMatchingToolsHint", { defaultValue: "No tools match your search or filters." })
          : t("toolPolicies.noToolsDiscoveredHint", {
              defaultValue: "Make a chat completion that returns tool_calls to start auto-discovery.",
            })}
      </div>
    </div>
  );
}

function uniqueValues(rows: ToolRow[], pick: (row: ToolRow) => string | undefined): string[] {
  return Array.from(new Set(rows.map(pick).filter((value): value is string => Boolean(value))));
}

export function ToolPoliciesTable({
  data,
  isLoading,
  isRefreshing,
  onRefresh,
  onSelectTool,
  savingInput,
  savingOutput,
  onInputPolicyChange,
  onOutputPolicyChange,
}: ToolPoliciesTableProps) {
  const { t } = useTranslation();
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const columns = useMemo(() => {
    const deps = { onSelectTool, savingInput, savingOutput, onInputPolicyChange, onOutputPolicyChange, t };
    return getToolPoliciesTableColumns(deps);
  }, [onSelectTool, savingInput, savingOutput, onInputPolicyChange, onOutputPolicyChange, t]);

  const inputPolicyFilterItems = useMemo(() => localizeItems(INPUT_POLICY_FILTER_ITEMS, t), [t]);
  const outputPolicyFilterItems = useMemo(() => localizeItems(OUTPUT_POLICY_FILTER_ITEMS, t), [t]);

  const teamOptions = useMemo(() => uniqueValues(data, (row) => row.team_id), [data]);
  const keyAliasOptions = useMemo(() => uniqueValues(data, (row) => row.key_alias), [data]);
  const teamFilterItems = useMemo(
    () => [
      { value: ALL_VALUE, label: t("toolPolicies.allTeams", { defaultValue: "All Teams" }) },
      ...teamOptions.map((option) => ({ value: option, label: option })),
    ],
    [teamOptions, t],
  );
  const keyAliasFilterItems = useMemo(
    () => [
      { value: ALL_VALUE, label: t("usage.allKeys", { defaultValue: "All Keys" }) },
      ...keyAliasOptions.map((option) => ({ value: option, label: option })),
    ],
    [keyAliasOptions, t],
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.tool_id}
      sortingMode="client"
      defaultSorting={[{ id: "created_at", desc: true }]}
      paginationMode="client"
      pageSizeOptions={[50, 100]}
      filterMode="client"
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      isLoading={isLoading}
      loadingMessage={t("toolPolicies.loadingTools", { defaultValue: "Loading tools…" })}
      noDataMessage={<ToolPoliciesEmptyState filtered={columnFilters.length > 0 || globalFilter !== ""} />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={globalFilter}
            onSearchChange={setGlobalFilter}
            searchPlaceholder={t("toolPolicies.searchByToolName", { defaultValue: "Search by Tool Name" })}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onOpenFilters={() => setFiltersOpen(true)}
            showViewOptions={false}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t("toolPolicies.filtersButton", { defaultValue: "Filters" })}
            description={t("toolPolicies.filtersDescription", { defaultValue: "Narrow down discovered tools" })}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField label={t("toolPolicies.inputPolicy", { defaultValue: "Input Policy" })}>
                  <Select
                    items={inputPolicyFilterItems}
                    value={(get("input_policy") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("input_policy", toFilterValue(value))}
                  >
                    <SelectTrigger className="w-full" data-testid="filter-input-policy">
                      <SelectValue
                        placeholder={t("toolPolicies.allInputPolicies", { defaultValue: "All Input Policies" })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>
                        {t("toolPolicies.allInputPolicies", { defaultValue: "All Input Policies" })}
                      </SelectItem>
                      {INPUT_POLICY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey, { defaultValue: option.label })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={t("toolPolicies.outputPolicy", { defaultValue: "Output Policy" })}>
                  <Select
                    items={outputPolicyFilterItems}
                    value={(get("output_policy") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("output_policy", toFilterValue(value))}
                  >
                    <SelectTrigger className="w-full" data-testid="filter-output-policy">
                      <SelectValue
                        placeholder={t("toolPolicies.allOutputPolicies", { defaultValue: "All Output Policies" })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>
                        {t("toolPolicies.allOutputPolicies", { defaultValue: "All Output Policies" })}
                      </SelectItem>
                      {OUTPUT_POLICY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey, { defaultValue: option.label })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={t("toolPolicies.teamName", { defaultValue: "Team Name" })}>
                  <Select
                    items={teamFilterItems}
                    value={(get("team_id") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("team_id", toFilterValue(value))}
                  >
                    <SelectTrigger className="w-full" data-testid="filter-team">
                      <SelectValue placeholder={t("toolPolicies.allTeams", { defaultValue: "All Teams" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>
                        {t("toolPolicies.allTeams", { defaultValue: "All Teams" })}
                      </SelectItem>
                      {teamOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={t("toolPolicies.keyName", { defaultValue: "Key Name" })}>
                  <Select
                    items={keyAliasFilterItems}
                    value={(get("key_alias") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("key_alias", toFilterValue(value))}
                  >
                    <SelectTrigger className="w-full" data-testid="filter-key-alias">
                      <SelectValue placeholder={t("usage.allKeys", { defaultValue: "All Keys" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{t("usage.allKeys", { defaultValue: "All Keys" })}</SelectItem>
                      {keyAliasOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
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
