"use client";

import { Inbox, Plus } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";

import {
  AvailableCallbacks,
  CallbackRow,
  callbackRowMode,
  getLoggingCallbacksTableColumns,
} from "./LoggingCallbacksTableColumns";
import { AlertingObject } from "./types";

type LoggingCallbacksProps = {
  callbacks: AlertingObject[];
  availableCallbacks?: AvailableCallbacks;
  isLoading?: boolean;
  onTest?: (callback: AlertingObject) => void | Promise<void>;
  onEdit?: (callback: AlertingObject) => void;
  onDelete?: (callback: AlertingObject) => void;
  onAdd?: () => void;
};

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {t("settingsPages.loggingCallbacksTable.emptyStateTitle", { defaultValue: "No callbacks configured" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {t("settingsPages.loggingCallbacksTable.emptyStateDesc", {
          defaultValue: "Add your first callback to start logging data to external services.",
        })}
      </div>
    </div>
  );
}

export const LoggingCallbacksTable: React.FC<LoggingCallbacksProps> = ({
  callbacks,
  availableCallbacks = {},
  isLoading = false,
  onTest = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onAdd = () => {},
}) => {
  const { t } = useTranslation();
  const columns = useMemo(() => {
    const deps = { availableCallbacks, onTest, onEdit, onDelete, t };
    return getLoggingCallbacksTableColumns(deps);
  }, [availableCallbacks, onTest, onEdit, onDelete, t]);

  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {t("settingsPages.loggingCallbacksTable.activeCallbacksTitle", { defaultValue: "Active Logging Callbacks" })}
      </h3>
      <div>
        <Button onClick={onAdd}>
          <Plus />
          {t("settingsPages.loggingCallbacksTable.addCallback", { defaultValue: "Add Callback" })}
        </Button>
      </div>
      <DataTable
        data={callbacks as CallbackRow[]}
        columns={columns}
        getRowId={(callback, index) => `${callback.name || index}-${callbackRowMode(callback)}`}
        isLoading={isLoading}
        loadingMessage={t("settingsPages.loggingCallbacksTable.loadingCallbacks", {
          defaultValue: "Loading callbacks…",
        })}
        noDataMessage={<EmptyState />}
        size="compact"
      />
    </div>
  );
};
