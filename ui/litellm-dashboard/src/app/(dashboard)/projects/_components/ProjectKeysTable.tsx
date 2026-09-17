"use client";

import { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { KeyRound } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { KeyResponse } from "@/components/key_team_helpers/key_list";
import { DataTable } from "@/components/shared/DataTable";

import { getProjectKeysTableColumns } from "./ProjectKeysTableColumns";

interface ProjectKeysTableProps {
  keys: KeyResponse[];
  totalCount: number;
  isLoading: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
}

const PAGE_SIZE_OPTIONS = [5, 10, 25];

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <KeyRound className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {t("projects.projectKeysTable.noKeysFound", { defaultValue: "No keys found" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {t("projects.projectKeysTable.emptyHint", {
          defaultValue: "Keys created in this project will show up here.",
        })}
      </div>
    </div>
  );
}

export function ProjectKeysTable({
  keys,
  totalCount,
  isLoading,
  pagination,
  onPaginationChange,
}: ProjectKeysTableProps) {
  const { t } = useTranslation();
  const columns = useMemo(() => getProjectKeysTableColumns({ t }), [t]);

  return (
    <DataTable
      data={keys}
      columns={columns}
      getRowId={(key, index) => key.token || String(index)}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={totalCount}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      isLoading={isLoading}
      loadingMessage={t("projects.projectKeysTable.loading", { defaultValue: "Loading keys…" })}
      noDataMessage={<EmptyState />}
      size="compact"
    />
  );
}
