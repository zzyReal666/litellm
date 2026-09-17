"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

import { AlertingObject } from "./types";

export type CallbackRow = AlertingObject & {
  mode?: "success" | "failure" | "info" | string;
};

export interface AvailableCallbackMeta {
  litellm_callback_name: string;
  litellm_callback_params: string[];
  ui_callback_name: string;
}

export type AvailableCallbacks = Record<string, AvailableCallbackMeta>;

export const callbackRowMode = (record: CallbackRow): string => record.type || record.mode || "success";

const callbackModeLabel = (mode: string, t: TFunction): string => {
  if (mode === "success") {
    return t("settingsPages.loggingCallbacksTable.modeSuccess", { defaultValue: "Success" });
  }
  if (mode === "failure") {
    return t("settingsPages.loggingCallbacksTable.modeFailure", { defaultValue: "Failure" });
  }
  if (mode === "success_and_failure") {
    return t("settingsPages.loggingCallbacksTable.modeSuccessAndFailure", { defaultValue: "Success & Failure" });
  }
  return mode;
};

function callbackModeTone(mode: string): StatusTone {
  if (mode === "success") return "success";
  if (mode === "failure") return "error";
  return "info";
}

interface CallbackRowActionsProps {
  callback: CallbackRow;
  onTest: (callback: AlertingObject) => void | Promise<void>;
  onEdit: (callback: AlertingObject) => void;
  onDelete: (callback: AlertingObject) => void;
}

function CallbackRowActions({ callback, onTest, onEdit, onDelete }: CallbackRowActionsProps) {
  const { t } = useTranslation();
  if (callback.read_only) {
    return (
      <span
        className="text-xs text-muted-foreground"
        title={t("settingsPages.loggingCallbacksTable.readOnlyTooltip", {
          defaultValue: "Active callback that was not added through the dashboard. Edit it where it was configured.",
        })}
      >
        {t("settingsPages.loggingCallbacksTable.readOnlyLabel", { defaultValue: "Read only" })}
      </span>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("settingsPages.loggingCallbacksTable.openActionsAriaLabel", {
          defaultValue: "Open callback actions",
        })}
        data-testid={`callback-actions-${callback.name}-${callbackRowMode(callback)}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem data-testid="callback-action-test" onClick={() => void onTest(callback)}>
          <Play />
          {t("common.test", { defaultValue: "Test" })}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="callback-action-edit" onClick={() => onEdit(callback)}>
          <Pencil />
          {t("common.edit", { defaultValue: "Edit" })}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" data-testid="callback-action-delete" onClick={() => onDelete(callback)}>
          <Trash2 />
          {t("common.delete", { defaultValue: "Delete" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface LoggingCallbacksTableColumnsDeps {
  availableCallbacks: AvailableCallbacks;
  onTest: (callback: AlertingObject) => void | Promise<void>;
  onEdit: (callback: AlertingObject) => void;
  onDelete: (callback: AlertingObject) => void;
  t: TFunction;
}

export const getLoggingCallbacksTableColumns = ({
  availableCallbacks,
  onTest,
  onEdit,
  onDelete,
  t,
}: LoggingCallbacksTableColumnsDeps): ColumnDef<CallbackRow>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: { title: t("settingsPages.loggingCallbacksTable.callbackNameColumn", { defaultValue: "Callback Name" }) },
    header: t("settingsPages.loggingCallbacksTable.callbackNameColumn", { defaultValue: "Callback Name" }),
    enableSorting: false,
    cell: ({ row }) => {
      const id = row.original.name;
      const displayName = availableCallbacks[id]?.ui_callback_name || id;
      return (
        <span className="block max-w-72 truncate text-sm font-medium" title={displayName}>
          {displayName}
        </span>
      );
    },
  },
  {
    id: "mode",
    meta: { title: t("settingsPages.loggingCallbacksTable.modeColumn", { defaultValue: "Mode" }), skeleton: "badge" },
    header: t("settingsPages.loggingCallbacksTable.modeColumn", { defaultValue: "Mode" }),
    size: 240,
    enableSorting: false,
    cell: ({ row }) => {
      const mode = callbackRowMode(row.original);
      return <StatusBadge tone={callbackModeTone(mode)} label={callbackModeLabel(mode, t)} />;
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
        <CallbackRowActions callback={row.original} onTest={onTest} onEdit={onEdit} onDelete={onDelete} />
      </div>
    ),
  },
];
