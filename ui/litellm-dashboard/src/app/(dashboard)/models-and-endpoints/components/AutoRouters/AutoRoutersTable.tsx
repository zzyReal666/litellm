"use client";

import { SortingState } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/shared/DataTable";
import { AutoRouterIcon } from "@/components/shared/table_cells";

import { getAutoRoutersTableColumns } from "./AutoRoutersTableColumns";
import { AutoRouterRow } from "./autoRouterRows";

interface AutoRoutersTableProps {
  routers: AutoRouterRow[];
  isLoading: boolean;
  canModify: boolean;
  onRouterClick: (row: AutoRouterRow) => void;
  onDeleteClick: (row: AutoRouterRow) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const DEFAULT_SORTING: SortingState = [
  { id: "createdAt", desc: true },
  { id: "name", desc: false },
];

function EmptyState({ canModify, t }: { canModify: boolean; t: TFunction }) {
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <AutoRouterIcon size={20} className="text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {t("pages.modelsAndEndpoints.noAutoRouters", { defaultValue: "No auto routers yet" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {canModify
          ? t("pages.modelsAndEndpoints.noAutoRoutersCreate", {
              defaultValue: "Create an auto router to pick the right model per request instead of pinning one.",
            })
          : t("pages.modelsAndEndpoints.noAutoRoutersDescription", {
              defaultValue: "An auto router picks the right model per request instead of pinning one.",
            })}
      </div>
    </div>
  );
}

export function AutoRoutersTable({
  routers,
  isLoading,
  canModify,
  onRouterClick,
  onDeleteClick,
}: AutoRoutersTableProps) {
  const { t } = useTranslation();
  const columns = useMemo(() => {
    const columnDeps = { canModify, onRouterClick, onDeleteClick, t };
    return getAutoRoutersTableColumns(columnDeps);
  }, [canModify, onRouterClick, onDeleteClick, t]);

  return (
    <DataTable
      data={routers}
      columns={columns}
      getRowId={(router) => router.id}
      sortingMode="client"
      defaultSorting={DEFAULT_SORTING}
      paginationMode="client"
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      isLoading={isLoading}
      loadingMessage={t("pages.modelsAndEndpoints.loadingAutoRouters", { defaultValue: "Loading auto routers…" })}
      noDataMessage={<EmptyState canModify={canModify} t={t} />}
      size="compact"
    />
  );
}
