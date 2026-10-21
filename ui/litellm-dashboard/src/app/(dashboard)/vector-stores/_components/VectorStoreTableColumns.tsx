"use client";

import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, DateCell, IdentityCell, StatusBadge } from "@/components/shared/table_cells";
import { getVectorStoreProviderLogoAndName } from "@/components/vector_store_providers";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VectorStore } from "@/components/vector_store_management/types";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

const CONFIG_STORE_HINT =
  "Read only: this vector store is defined in the config file and cannot be edited or deleted on the dashboard.";

function VectorStoreProviderCell({ provider }: { provider: string }) {
  const { displayName, logo } = getVectorStoreProviderLogoAndName(provider);
  return (
    <div className="flex items-center gap-2">
      {logo ? (
        <img
          src={logo}
          alt=""
          className="size-4 shrink-0"
          onError={(event) => {
            (event.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      <span className="truncate text-sm">{displayName}</span>
    </div>
  );
}

function VectorStoreFilesCell({ vectorStore }: { vectorStore: VectorStore }) {
  const { t } = useTranslation();
  const ingestedFiles = vectorStore.vector_store_metadata?.ingested_files || [];
  if (ingestedFiles.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const filenames = ingestedFiles.map((file) => file.filename || file.file_url || t("common.unknown", { defaultValue: "Unknown" })).join(", ");
  const displayText =
    ingestedFiles.length === 1
      ? ingestedFiles[0].filename || ingestedFiles[0].file_url || t("vectorStoreManagement.vectorStoreTable.oneFile", { defaultValue: "1 file" })
      : t("vectorStoreManagement.vectorStoreTable.nFiles", { count: ingestedFiles.length, defaultValue: "{{count}} files" });

  return (
    <CellTooltip
      content={filenames}
      trigger={<span className="block max-w-60 truncate text-sm text-primary">{displayText}</span>}
    />
  );
}

interface VectorStoreRowActionsProps {
  vectorStore: VectorStore;
  onEdit: (vectorStoreId: string) => void;
  onDelete: (vectorStoreId: string) => void;
}

function VectorStoreRowActions({ vectorStore, onEdit, onDelete }: VectorStoreRowActionsProps) {
  const { t } = useTranslation();
  const isFromConfig = vectorStore.is_config ?? false;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("vectorStores.vectorStoreTableColumns.openActions", { defaultValue: "Open vector store actions" })}
        data-testid={`vector-store-actions-${vectorStore.vector_store_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="vector-store-action-edit"
          disabled={isFromConfig}
          onClick={() => onEdit(vectorStore.vector_store_id)}
        >
          <Pencil />
          {t("common.edit", { defaultValue: "Edit" })}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="vector-store-action-copy"
          onClick={() => void copyToClipboard(vectorStore.vector_store_id, t("vectorStores.vectorStoreTableColumns.idCopied", { defaultValue: "Vector store ID copied" }))}
        >
          <Copy />
          {t("vectorStores.vectorStoreTableColumns.copyId", { defaultValue: "Copy vector store ID" })}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          data-testid="vector-store-action-delete"
          disabled={isFromConfig}
          onClick={() => onDelete(vectorStore.vector_store_id)}
        >
          <Trash2 />
          {t("common.delete", { defaultValue: "Delete" })}
        </DropdownMenuItem>
        {isFromConfig && (
          <div data-testid="vector-store-config-hint" className="px-2 py-1.5 text-xs text-muted-foreground">
            {CONFIG_STORE_HINT}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface VectorStoreTableColumnsDeps {
  onView: (vectorStoreId: string) => void;
  onEdit: (vectorStoreId: string) => void;
  onDelete: (vectorStoreId: string) => void;
}

export const getVectorStoreTableColumns = ({
  onView,
  onEdit,
  onDelete,
}: VectorStoreTableColumnsDeps): ColumnDef<VectorStore>[] => [
  {
    id: "vector_store_id",
    accessorKey: "vector_store_id",
    meta: { title: i18n.t("vectorStoreManagement.vectorStoreTable.colVectorStoreId", { defaultValue: "Vector Store ID" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("vectorStoreManagement.vectorStoreTable.colVectorStoreId", { defaultValue: "Vector Store ID" })} />,
    size: 220,
    enableSorting: true,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.vector_store_id}
        titleClassName="font-mono text-xs font-normal"
        className="max-w-60"
        onClick={() => onView(row.original.vector_store_id)}
      />
    ),
  },
  {
    id: "vector_store_name",
    accessorKey: "vector_store_name",
    meta: { title: i18n.t("common.name", { defaultValue: "Name" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("common.name", { defaultValue: "Name" })} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => {
      const name = row.original.vector_store_name;
      return (
        <span className="block max-w-60 truncate text-sm font-medium" title={name ?? undefined}>
          {name || "-"}
        </span>
      );
    },
  },
  {
    id: "vector_store_description",
    accessorKey: "vector_store_description",
    meta: { title: i18n.t("common.description", { defaultValue: "Description" }) },
    header: i18n.t("common.description", { defaultValue: "Description" }),
    size: 280,
    enableSorting: false,
    cell: ({ row }) => {
      const description = row.original.vector_store_description;
      return (
        <span className="block max-w-72 truncate text-sm text-muted-foreground" title={description ?? undefined}>
          {description || "-"}
        </span>
      );
    },
  },
  {
    id: "source",
    accessorFn: (row) => row.is_config ?? false,
    meta: { title: "Source", skeleton: "badge" },
    header: ({ column }) => <DataTableSortHeader column={column} title="Source" />,
    size: 110,
    enableSorting: true,
    cell: ({ row }) => {
      const isFromConfig = row.original.is_config ?? false;
      return <StatusBadge tone={isFromConfig ? "neutral" : "info"} label={isFromConfig ? "Config" : "DB"} />;
    },
  },
  {
    id: "files",
    meta: { title: i18n.t("vectorStoreManagement.vectorStoreTable.colFiles", { defaultValue: "Files" }) },
    header: i18n.t("vectorStoreManagement.vectorStoreTable.colFiles", { defaultValue: "Files" }),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <VectorStoreFilesCell vectorStore={row.original} />,
  },
  {
    id: "provider",
    accessorKey: "custom_llm_provider",
    meta: { title: i18n.t("vectorStoreManagement.vectorStoreForm.providerLabel", { defaultValue: "Provider" }) },
    header: i18n.t("vectorStoreManagement.vectorStoreForm.providerLabel", { defaultValue: "Provider" }),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <VectorStoreProviderCell provider={row.original.custom_llm_provider} />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    sortingFn: "datetime",
    meta: { title: i18n.t("guardrails.guardrailInfo.createdAt", { defaultValue: "Created At" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("guardrails.guardrailInfo.createdAt", { defaultValue: "Created At" })} />,
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    sortingFn: "datetime",
    meta: { title: i18n.t("guardrails.guardrailTable.colUpdatedAt", { defaultValue: "Updated At" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("guardrails.guardrailTable.colUpdatedAt", { defaultValue: "Updated At" })} />,
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.updated_at} precision="date" />,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{i18n.t("common.actions", { defaultValue: "Actions" })}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <VectorStoreRowActions vectorStore={row.original} onEdit={onEdit} onDelete={onDelete} />
      </div>
    ),
  },
];
