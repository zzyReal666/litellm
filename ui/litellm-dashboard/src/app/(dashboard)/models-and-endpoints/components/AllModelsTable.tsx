"use client";

import { ColumnFiltersState, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ModelData } from "@/components/model_dashboard/types";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { ToolbarSeparator } from "@/components/shared/ToolbarSeparator";
import { cn } from "@/lib/cva.config";

import {
  ACCESS_GROUPS_COLUMN_ID,
  getModelsTableColumns,
  MODEL_NAME_COLUMN_ID,
  STATUS_COLUMN_ID,
} from "./ModelsTableColumns";

export type ModelViewMode = "all" | "current_team";

export const PERSONAL_TEAM_VALUE = "personal";
export const ALL_MODEL_GROUPS_VALUE = "all";
export const WILDCARD_MODEL_GROUP_VALUE = "wildcard";

const MODEL_TABLE_BODY_HEIGHT = 600;

export interface ModelsTableTeamOption {
  value: string;
  label: string;
}

interface AllModelsTableProps {
  data: ModelData[];
  rowCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  onResetFilters: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  teamOptions: ModelsTableTeamOption[];
  selectedTeamValue: string;
  onTeamChange: (value: string) => void;
  isLoadingTeams: boolean;
  viewMode: ModelViewMode;
  onViewModeChange: (viewMode: ModelViewMode) => void;
  onOpenModelSettings: () => void;
  availableModelGroups: string[];
  availableModelAccessGroups: string[];
  userRole: string;
  userID: string;
  isViewOnly: boolean;
  onModelIdClick: (modelId: string) => void;
  onTeamIdClick: (teamId: string) => void;
  onDeleteClick: (modelId: string) => void;
  onTogglePauseClick: (modelId: string, blocked: boolean) => void | Promise<void>;
  pausingModelId: string | null;
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-muted">
        <Search className="size-5 text-muted-foreground" />
      </div>
      <div className="text-base font-semibold text-foreground">
        {t("modelDashboard.allModelsTable.noModels", { defaultValue: "No models found" })}
      </div>
      <div className="max-w-80 text-sm text-muted-foreground">
        {t("pages.allModelsTab.emptyStateDescription", {
          defaultValue: "No models match your search or filters. Try resetting them.",
        })}
      </div>
    </div>
  );
}

export function AllModelsTable({
  data,
  rowCount,
  isLoading,
  isRefreshing,
  onRefresh,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  columnFilters,
  onColumnFiltersChange,
  onResetFilters,
  searchValue,
  onSearchChange,
  teamOptions,
  selectedTeamValue,
  onTeamChange,
  isLoadingTeams,
  viewMode,
  onViewModeChange,
  onOpenModelSettings,
  availableModelGroups,
  availableModelAccessGroups,
  userRole,
  userID,
  isViewOnly,
  onModelIdClick,
  onTeamIdClick,
  onDeleteClick,
  onTogglePauseClick,
  pausingModelId,
}: AllModelsTableProps) {
  const { t } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const columns = useMemo(() => {
    const columnDeps = {
      userRole,
      userID,
      isViewOnly,
      onModelIdClick,
      onTeamIdClick,
      onDeleteClick,
      onTogglePauseClick,
      pausingModelId,
      t,
    };
    return getModelsTableColumns(columnDeps);
  }, [
    userRole,
    userID,
    isViewOnly,
    onModelIdClick,
    onTeamIdClick,
    onDeleteClick,
    onTogglePauseClick,
    pausingModelId,
    t,
  ]);

  const modelGroupOptions = useMemo(
    () => [
      { label: t("pages.allModelsTab.allModels", { defaultValue: "All Models" }), value: ALL_MODEL_GROUPS_VALUE },
      {
        label: t("pages.allModelsTab.wildcardModels", { defaultValue: "Wildcard Models (*)" }),
        value: WILDCARD_MODEL_GROUP_VALUE,
      },
      ...availableModelGroups.map((group) => ({ label: group, value: group })),
    ],
    [availableModelGroups, t],
  );

  const accessGroupOptions = useMemo(
    () => [
      {
        label: t("pages.allModelsTab.allModelAccessGroups", { defaultValue: "All Model Access Groups" }),
        value: ALL_MODEL_GROUPS_VALUE,
      },
      ...availableModelAccessGroups.map((accessGroup) => ({ label: accessGroup, value: accessGroup })),
    ],
    [availableModelAccessGroups, t],
  );

  const formatFilterValue = (columnId: string, value: unknown): string => {
    const raw = String(value);
    if (columnId === MODEL_NAME_COLUMN_ID && raw === WILDCARD_MODEL_GROUP_VALUE) {
      return t("pages.allModelsTab.wildcardModels", { defaultValue: "Wildcard Models (*)" });
    }
    return raw;
  };

  const selectedTeamLabel =
    teamOptions.find((option) => option.value === selectedTeamValue)?.label ?? teamOptions[0]?.label ?? "";

  const viewModeLabels: Record<ModelViewMode, string> = {
    current_team: t("pages.allModelsTab.currentTeamModels", { defaultValue: "Current Team Models" }),
    all: t("pages.allModelsTab.allAvailableModels", { defaultValue: "All Available Models" }),
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row, index) => row.model_info?.id ?? String(index)}
      sortingMode="server"
      sorting={sorting}
      onSortingChange={onSortingChange}
      enableSortingRemoval
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      pageSizeOptions={[10, 25, 50]}
      filterMode="server"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      defaultColumnVisibility={{ [STATUS_COLUMN_ID]: false }}
      enableColumnResizing
      maxBodyHeight={MODEL_TABLE_BODY_HEIGHT}
      isLoading={isLoading}
      loadingMessage={t("pages.allModelsTab.loadingModels", { defaultValue: "Loading models…" })}
      noDataMessage={<EmptyState />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={t("pages.allModelsTab.searchPlaceholderEllipsis", {
              defaultValue: "Search model names…",
            })}
            onOpenFilters={() => setFiltersOpen(true)}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            filterLabels={{
              [MODEL_NAME_COLUMN_ID]: t("molecules.modelsColumns.publicModelName", {
                defaultValue: "Public Model Name",
              }),
              [ACCESS_GROUPS_COLUMN_ID]: t("molecules.modelsColumns.modelAccessGroup", {
                defaultValue: "Model Access Group",
              }),
            }}
            formatFilterValue={formatFilterValue}
          >
            <Select value={selectedTeamValue} onValueChange={(value) => onTeamChange(String(value))}>
              <SelectTrigger
                size="sm"
                aria-label={t("pages.allModelsTab.currentTeamAria", { defaultValue: "Current team" })}
                data-testid="models-team-select"
                className="gap-2 bg-secondary"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    selectedTeamValue === PERSONAL_TEAM_VALUE ? "bg-info" : "bg-success",
                  )}
                />
                <span className="text-muted-foreground">
                  {t("pages.allModelsTab.teamLabel", { defaultValue: "Team" })}
                </span>
                <span className="truncate font-semibold">{selectedTeamLabel}</span>
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={isLoadingTeams}
                    className="[&>div]:min-w-0"
                  >
                    <span data-slot="select-item-label" className="min-w-0 truncate" title={option.label}>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={viewMode} onValueChange={(value) => onViewModeChange(value as ModelViewMode)}>
              <SelectTrigger
                size="sm"
                aria-label={t("common.view", { defaultValue: "View" })}
                data-testid="models-view-select"
                className="gap-2"
              >
                <span className="text-muted-foreground">{t("common.view", { defaultValue: "View" })}</span>
                <span className="truncate">{viewModeLabels[viewMode]}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_team">{viewModeLabels.current_team}</SelectItem>
                <SelectItem value="all">{viewModeLabels.all}</SelectItem>
              </SelectContent>
            </Select>

            <ToolbarSeparator className="mx-0.5" />

            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t("pages.allModelsTab.modelSettings", { defaultValue: "Model Settings" })}
              title={t("pages.allModelsTab.modelSettings", { defaultValue: "Model Settings" })}
              data-testid="models-settings-trigger"
              onClick={onOpenModelSettings}
            >
              <Settings />
            </Button>
          </DataTableToolbar>
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t("pages.allModelsTab.filters", { defaultValue: "Filters" })}
            description={t("pages.modelsAndEndpoints.filtersDrawerDescription", {
              defaultValue: "Narrow down models + endpoints",
            })}
            resetLabel={t("pages.allModelsTab.resetFilters", { defaultValue: "Reset Filters" })}
            onReset={onResetFilters}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField
                  label={t("molecules.modelsColumns.publicModelName", { defaultValue: "Public Model Name" })}
                >
                  <SearchSelect
                    options={modelGroupOptions}
                    value={(get(MODEL_NAME_COLUMN_ID) as string) ?? ALL_MODEL_GROUPS_VALUE}
                    onValueChange={(value) =>
                      set(MODEL_NAME_COLUMN_ID, value === ALL_MODEL_GROUPS_VALUE ? undefined : value ?? undefined)
                    }
                    placeholder={t("pages.allModelsTab.filterByPublicModelName", {
                      defaultValue: "Filter by Public Model Name",
                    })}
                    emptyText={t("modelDashboard.allModelsTable.noModels", { defaultValue: "No models found" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField
                  label={t("molecules.modelsColumns.modelAccessGroup", { defaultValue: "Model Access Group" })}
                >
                  <SearchSelect
                    options={accessGroupOptions}
                    value={(get(ACCESS_GROUPS_COLUMN_ID) as string) ?? ALL_MODEL_GROUPS_VALUE}
                    onValueChange={(value) =>
                      set(ACCESS_GROUPS_COLUMN_ID, value === ALL_MODEL_GROUPS_VALUE ? undefined : value ?? undefined)
                    }
                    placeholder={t("pages.allModelsTab.filterByModelAccessGroup", {
                      defaultValue: "Filter by Model Access Group",
                    })}
                    emptyText={t("pages.allModelsTab.noModelAccessGroups", {
                      defaultValue: "No model access groups found",
                    })}
                  />
                </DataTableFilterField>
              </>
            )}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}
