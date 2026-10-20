"use client";

import { SortingState } from "@tanstack/react-table";
import { KeyRound } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CredentialItem } from "@/components/networking";
import { DataTable } from "@/components/shared/DataTable";

import { getCredentialsTableColumns } from "./CredentialsTableColumns";

interface CredentialsTableProps {
  credentials: CredentialItem[];
  canModifyCredentials: boolean;
  onEdit: (credential: CredentialItem) => void;
  onDelete: (credential: CredentialItem) => void;
  isLoading?: boolean;
}

const DEFAULT_SORTING: SortingState = [{ id: "credential_name", desc: false }];

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <KeyRound className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {t("modelAdd.credentials.noCredentials", { defaultValue: "No credentials configured" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {t("modelAdd.credentials.noCredentialsBody", { defaultValue: "Add a credential to connect an AI provider." })}
      </div>
    </div>
  );
}

const CredentialsTable: React.FC<CredentialsTableProps> = ({
  credentials,
  canModifyCredentials,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);

  const columns = useMemo(() => {
    const columnDeps = { canModifyCredentials, onEdit, onDelete, t };
    return getCredentialsTableColumns(columnDeps);
  }, [canModifyCredentials, onEdit, onDelete, t]);

  return (
    <DataTable
      data={credentials}
      paginationMode="client"
      columns={columns}
      getRowId={(credential, index) => credential.credential_name || String(index)}
      sortingMode="client"
      sorting={sorting}
      onSortingChange={setSorting}
      isLoading={isLoading}
      loadingMessage={t("modelAdd.credentials.loadingCredentials", { defaultValue: "Loading credentials…" })}
      noDataMessage={<EmptyState />}
      size="compact"
    />
  );
};

export default CredentialsTable;
