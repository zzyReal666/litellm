"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { GitBranch, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { IdentityCell, ModelsCell } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

import { formatStrategyLabel } from "./strategy";
import type { RoutingGroup } from "./types";

interface RoutingGroupRowActionsProps {
  group: RoutingGroup;
  onEdit: (group: RoutingGroup) => void;
  onDelete: (group: RoutingGroup) => void;
}

function RoutingGroupRowActions({ group, onEdit, onDelete }: RoutingGroupRowActionsProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("pages.modelsAndEndpoints.openActionsFor", {
          name: group.group_name,
          defaultValue: "Open actions for {{name}}",
        })}
        data-testid={`routing-group-actions-${group.group_name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem data-testid="routing-group-action-edit" onClick={() => onEdit(group)}>
          <Pencil />
          {t("common.edit", { defaultValue: "Edit" })}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          data-testid="routing-group-action-delete"
          onClick={() => onDelete(group)}
        >
          <Trash2 />
          {t("common.delete", { defaultValue: "Delete" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface RoutingGroupsTableColumnsDeps {
  onEdit: (group: RoutingGroup) => void;
  onDelete: (group: RoutingGroup) => void;
  onToggleUsage: (group: RoutingGroup) => void;
  t: TFunction;
}

export const getRoutingGroupsTableColumns = ({
  onEdit,
  onDelete,
  onToggleUsage,
  t,
}: RoutingGroupsTableColumnsDeps): ColumnDef<RoutingGroup>[] => [
  {
    id: "group_name",
    accessorKey: "group_name",
    meta: {
      title: t("routingGroups.routingGroupModal.groupNameLabel", { defaultValue: "Group Name" }),
      skeleton: "text",
    },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("routingGroups.routingGroupModal.groupNameLabel", { defaultValue: "Group Name" })}
      />
    ),
    size: 240,
    enableSorting: true,
    cell: ({ row }) => (
      <IdentityCell title={row.original.group_name} className="max-w-60" onClick={() => onToggleUsage(row.original)} />
    ),
  },
  {
    id: "models",
    meta: { title: t("routingGroups.routingGroupModal.modelsLabel", { defaultValue: "Models" }), skeleton: "chips" },
    header: t("routingGroups.routingGroupModal.modelsLabel", { defaultValue: "Models" }),
    size: 320,
    enableSorting: false,
    cell: ({ row }) => <ModelsCell models={row.original.models} />,
  },
  {
    id: "routing_strategy",
    accessorKey: "routing_strategy",
    meta: {
      title: t("routingGroups.routingGroupsTable.colStrategyTitle", { defaultValue: "Strategy" }),
      skeleton: "text",
    },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("routingGroups.routingGroupsTable.colStrategyTitle", { defaultValue: "Strategy" })}
      />
    ),
    size: 180,
    enableSorting: true,
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5 text-sm">
        <GitBranch className="size-4 shrink-0 text-muted-foreground" />
        {formatStrategyLabel(row.original.routing_strategy, t)}
      </span>
    ),
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
        <RoutingGroupRowActions group={row.original} onEdit={onEdit} onDelete={onDelete} />
      </div>
    ),
  },
];
