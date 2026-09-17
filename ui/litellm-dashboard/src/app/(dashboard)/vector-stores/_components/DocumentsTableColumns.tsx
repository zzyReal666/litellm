"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TFunction } from "i18next";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentUpload } from "@/components/vector_store_management/types";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

const STATUS_CONFIG: Record<DocumentUpload["status"], { tone: StatusTone; labelKey: string; label: string }> = {
  uploading: { tone: "info", labelKey: "vectorStoreManagement.documentsTable.statusUploading", label: "Uploading" },
  done: { tone: "success", labelKey: "priceDataReload.statusReady", label: "Ready" },
  error: { tone: "error", labelKey: "molecules.notificationsManager.error", label: "Error" },
  removed: { tone: "neutral", labelKey: "vectorStoreManagement.documentsTable.statusRemoved", label: "Removed" },
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return "-";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function DocumentRowActions({ document, onRemove }: { document: DocumentUpload; onRemove: (uid: string) => void }) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("vectorStores.documentsTableColumns.openActions", { defaultValue: "Open document actions" })}
        data-testid={`document-actions-${document.uid}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="document-action-copy"
          onClick={() =>
            void copyToClipboard(
              document.uid,
              t("vectorStoreManagement.documentsTable.idCopied", { defaultValue: "Document ID copied to clipboard" }),
            )
          }
        >
          <Copy />
          {t("vectorStores.documentsTableColumns.copyId", { defaultValue: "Copy document ID" })}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          data-testid="document-action-remove"
          onClick={() => onRemove(document.uid)}
        >
          <Trash2 />
          {t("common.remove", { defaultValue: "Remove" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DocumentsTableColumnsDeps {
  onRemove: (uid: string) => void;
  t: TFunction;
}

export const getDocumentsTableColumns = ({ onRemove, t }: DocumentsTableColumnsDeps): ColumnDef<DocumentUpload>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: { title: t("common.name", { defaultValue: "Name" }) },
    header: t("common.name", { defaultValue: "Name" }),
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="block max-w-72 truncate text-sm" title={row.original.name}>
          {row.original.name}
        </span>
        {row.original.size ? (
          <span className="text-xs text-muted-foreground">({formatFileSize(row.original.size)})</span>
        ) : null}
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    meta: { title: t("common.status", { defaultValue: "Status" }), skeleton: "badge" },
    header: t("common.status", { defaultValue: "Status" }),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const config = STATUS_CONFIG[row.original.status];
      return config ? (
        <StatusBadge tone={config.tone} label={t(config.labelKey, { defaultValue: config.label })} />
      ) : (
        <StatusBadge tone="neutral" label={row.original.status} />
      );
    },
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("common.actions", { defaultValue: "Actions" })}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <DocumentRowActions document={row.original} onRemove={onRemove} />
      </div>
    ),
  },
];
