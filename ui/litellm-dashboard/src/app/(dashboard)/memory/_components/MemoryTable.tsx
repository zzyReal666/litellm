"use client";

import { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { Database } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MemoryRow } from "@/components/networking";
import { DataTable, DataTableToolbar } from "@/components/shared/DataTable";

import { getMemoryTableColumns } from "./MemoryTableColumns";

interface MemoryTableProps {
  data: MemoryRow[];
  isLoading: boolean;
  rowCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  hasActiveSearch: boolean;
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
}

function MemoryEmptyState({ hasActiveSearch }: { hasActiveSearch: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Database className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {hasActiveSearch
          ? t("memoryView.memoryView.noMatchingMemories", { defaultValue: "No matching memories" })
          : t("memoryView.memoryView.emptyNoData", { defaultValue: "No memories stored yet" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {hasActiveSearch
          ? t("memoryView.memoryView.emptyFilteredDesc", { defaultValue: "No memories match your search." })
          : t("memoryView.memoryView.emptyNoDataDesc", {
              defaultValue: "Memories your agents store under /v1/memory will appear here.",
            })}
      </div>
    </div>
  );
}

export function MemoryTable({
  data,
  isLoading,
  rowCount,
  pagination,
  onPaginationChange,
  searchValue,
  onSearchChange,
  isRefreshing,
  onRefresh,
  hasActiveSearch,
  onViewClick,
  onEditClick,
  onDeleteClick,
}: MemoryTableProps) {
  const { t } = useTranslation();
  const columns = useMemo(() => {
    const columnDeps = { onViewClick, onEditClick, onDeleteClick, t };
    return getMemoryTableColumns(columnDeps);
  }, [onViewClick, onEditClick, onDeleteClick, t]);

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.memory_id}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      isLoading={isLoading}
      loadingMessage={t("memoryView.memoryView.loading", { defaultValue: "Loading memories…" })}
      noDataMessage={<MemoryEmptyState hasActiveSearch={hasActiveSearch} />}
      size="compact"
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={t("memoryView.memoryView.searchPlaceholder", {
            defaultValue: "Search by key prefix or memory ID…",
          })}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          showViewOptions={false}
        />
      )}
    />
  );
}

export default MemoryTable;
