"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell, StatusBadge } from "@/components/shared/table_cells";
import { getCategoryBadgeColor } from "@/components/claude_code_plugins/helpers";
import { Plugin } from "@/components/claude_code_plugins/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

const CATEGORY_BADGE_CLASS: Record<ReturnType<typeof getCategoryBadgeColor>, string> = {
  blue: "border-info/20 bg-info/10 text-info",
  green: "border-success/20 bg-success/10 text-success",
  purple:
    "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
  red: "border-destructive/20 bg-destructive/10 text-destructive",
  orange: "border-warning/20 bg-warning/10 text-warning",
  yellow: "border-warning/20 bg-warning/10 text-warning",
  gray: "border-border bg-muted text-muted-foreground",
};

function PluginCategoryBadge({ category }: { category?: string }) {
  const { t } = useTranslation();
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-normal", CATEGORY_BADGE_CLASS[getCategoryBadgeColor(category)])}
    >
      {category || t("claudeCodePluginsPage.pluginTable.uncategorized", { defaultValue: "Uncategorized" })}
    </Badge>
  );
}

interface PluginRowActionsProps {
  plugin: Plugin;
  isAdmin: boolean;
  onDeleteClick: (pluginName: string, displayName: string) => void;
}

function PluginRowActions({ plugin, isAdmin, onDeleteClick }: PluginRowActionsProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("aiHub.skillHubTableColumns.openSkillActions", { defaultValue: "Open skill actions" })}
        data-testid={`plugin-actions-${plugin.name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="plugin-action-copy"
          onClick={() =>
            void copyToClipboard(
              plugin.id,
              t("claudeCodePluginsPage.pluginTable.skillIdCopied", { defaultValue: "Skill ID copied" }),
            )
          }
        >
          <Copy />
          {t("claudeCodePluginsPage.pluginTable.copySkillId", { defaultValue: "Copy skill ID" })}
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              data-testid="plugin-action-delete"
              onClick={() => onDeleteClick(plugin.name, plugin.name)}
            >
              <Trash2 />
              {t("common.delete", { defaultValue: "Delete" })}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PluginTableColumnsDeps {
  isAdmin: boolean;
  onPluginClick: (pluginId: string) => void;
  onDeleteClick: (pluginName: string, displayName: string) => void;
  t: TFunction;
}

export const getPluginTableColumns = ({
  isAdmin,
  onPluginClick,
  onDeleteClick,
  t,
}: PluginTableColumnsDeps): ColumnDef<Plugin>[] => {
  const skillName = t("claudeCodePluginsPage.pluginTable.colSkillName", { defaultValue: "Skill Name" });
  const createdAt = t("common.createdAt", { defaultValue: "Created At" });
  return [
    {
      id: "name",
      accessorKey: "name",
      meta: { title: skillName },
      header: ({ column }) => <DataTableSortHeader column={column} title={skillName} />,
      size: 220,
      enableSorting: true,
      cell: ({ row }) => (
        <IdentityCell
          title={row.original.name}
          titleClassName="font-mono text-xs font-normal"
          className="max-w-60"
          onClick={() => onPluginClick(row.original.id)}
        />
      ),
    },
    {
      id: "version",
      accessorKey: "version",
      meta: { title: t("claudeCodePluginsPage.pluginTable.colVersion", { defaultValue: "Version" }) },
      header: t("claudeCodePluginsPage.pluginTable.colVersion", { defaultValue: "Version" }),
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.version || t("claudeCodePluginsPage.pluginTable.versionNA", { defaultValue: "N/A" })}
        </span>
      ),
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
            {description || t("claudeCodePluginsPage.pluginTable.noDescription", { defaultValue: "No description" })}
          </span>
        );
      },
    },
    {
      id: "category",
      accessorKey: "category",
      meta: {
        title: t("claudeCodePluginsPage.pluginTable.colCategory", { defaultValue: "Category" }),
        skeleton: "badge",
      },
      header: t("claudeCodePluginsPage.pluginTable.colCategory", { defaultValue: "Category" }),
      size: 150,
      enableSorting: false,
      cell: ({ row }) => <PluginCategoryBadge category={row.original.category} />,
    },
    {
      id: "enabled",
      accessorKey: "enabled",
      meta: { title: t("claudeCodePluginsPage.pluginTable.colPublic", { defaultValue: "Public" }), skeleton: "badge" },
      header: t("claudeCodePluginsPage.pluginTable.colPublic", { defaultValue: "Public" }),
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge
          tone={row.original.enabled ? "success" : "neutral"}
          label={
            row.original.enabled ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })
          }
        />
      ),
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      sortingFn: "datetime",
      meta: { title: createdAt },
      header: ({ column }) => <DataTableSortHeader column={column} title={createdAt} />,
      size: 160,
      enableSorting: true,
      cell: ({ row }) => <DateCell value={row.original.created_at} />,
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
          <PluginRowActions plugin={row.original} isAdmin={isAdmin} onDeleteClick={onDeleteClick} />
        </div>
      ),
    },
  ];
};
