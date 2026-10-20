"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, DateCell, IdentityCell } from "@/components/shared/table_cells";
import { Tag } from "@/components/tag_management/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

export const DYNAMIC_SPEND_TAG_DESCRIPTION =
  "This is just a spend tag that was passed dynamically in a request. It does not control any LLM models.";

const isDynamicSpendTag = (tag: Tag) => tag.description === DYNAMIC_SPEND_TAG_DESCRIPTION;

function TagNameCell({ tag, onSelectTag, t }: { tag: Tag; onSelectTag: (tagName: string) => void; t: TFunction }) {
  if (isDynamicSpendTag(tag)) {
    return (
      <CellTooltip
        content={t("tagManagement.tagTable.dynamicTagViewDisabled", {
          defaultValue: "You cannot view the information of a dynamically generated spend tag",
        })}
        trigger={<span className="block max-w-60 truncate font-mono text-xs text-muted-foreground">{tag.name}</span>}
      />
    );
  }
  return (
    <IdentityCell
      title={tag.name}
      titleClassName="font-mono text-xs font-normal text-primary"
      className="max-w-60"
      onClick={() => onSelectTag(tag.name)}
    />
  );
}

function TagModelsCell({ tag, t }: { tag: Tag; t: TFunction }) {
  const models = tag.models ?? [];
  if (models.length === 0) {
    return <Badge variant="secondary">{t("tagManagement.tagTable.allModels", { defaultValue: "All Models" })}</Badge>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {models.map((modelId) => (
        <CellTooltip
          key={modelId}
          content={`ID: ${modelId}`}
          trigger={
            <Badge variant="outline" className="cursor-default">
              {tag.model_info?.[modelId] || modelId}
            </Badge>
          }
        />
      ))}
    </div>
  );
}

interface TagRowActionsProps {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tagName: string) => void;
  t: TFunction;
}

function TagRowActions({ tag, onEdit, onDelete, t }: TagRowActionsProps) {
  const isDynamic = isDynamicSpendTag(tag);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("tagManagement.tagTable.openActionsAriaLabel", { defaultValue: "Open tag actions" })}
        data-testid={`tag-actions-${tag.name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          disabled={isDynamic}
          data-testid="tag-action-edit"
          title={
            isDynamic
              ? t("tagManagement.tagTable.dynamicTagEditDisabled", {
                  defaultValue: "Dynamically generated spend tags cannot be edited",
                })
              : undefined
          }
          onClick={() => onEdit(tag)}
        >
          <Pencil />
          {t("common.edit", { defaultValue: "Edit" })}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isDynamic}
          data-testid="tag-action-delete"
          title={
            isDynamic
              ? t("tagManagement.tagTable.dynamicTagDeleteDisabled", {
                  defaultValue: "Dynamically generated spend tags cannot be deleted",
                })
              : undefined
          }
          onClick={() => onDelete(tag.name)}
        >
          <Trash2 />
          {t("commonComponents.deleteResourceModal.okText", { defaultValue: "Delete" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TagTableColumnsDeps {
  onSelectTag: (tagName: string) => void;
  onEdit: (tag: Tag) => void;
  onDelete: (tagName: string) => void;
  t: TFunction;
}

export const getTagTableColumns = ({ onSelectTag, onEdit, onDelete, t }: TagTableColumnsDeps): ColumnDef<Tag>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: { title: t("tagManagement.tagTable.colTagName", { defaultValue: "Tag Name" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("tagManagement.tagTable.colTagName", { defaultValue: "Tag Name" })}
      />
    ),
    size: 260,
    enableSorting: true,
    cell: ({ row }) => <TagNameCell tag={row.original} onSelectTag={onSelectTag} t={t} />,
  },
  {
    id: "description",
    accessorKey: "description",
    meta: { title: t("guardrails.keywordTable.colDescription", { defaultValue: "Description" }) },
    header: t("guardrails.keywordTable.colDescription", { defaultValue: "Description" }),
    size: 300,
    enableSorting: false,
    cell: ({ row }) => {
      const description = row.original.description;
      return (
        <span className="block max-w-72 truncate text-sm text-muted-foreground" title={description}>
          {description || "-"}
        </span>
      );
    },
  },
  {
    id: "models",
    meta: {
      title: t("agentsPage.addAgentForm.allowedModelsLabel", { defaultValue: "Allowed Models" }),
      skeleton: "chips",
    },
    header: t("agentsPage.addAgentForm.allowedModelsLabel", { defaultValue: "Allowed Models" }),
    size: 240,
    enableSorting: false,
    cell: ({ row }) => <TagModelsCell tag={row.original} t={t} />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    sortingFn: "datetime",
    meta: { title: t("oldTeams.columns.created", { defaultValue: "Created" }) },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={t("oldTeams.columns.created", { defaultValue: "Created" })} />
    ),
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
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
        <TagRowActions tag={row.original} onEdit={onEdit} onDelete={onDelete} t={t} />
      </div>
    ),
  },
];
