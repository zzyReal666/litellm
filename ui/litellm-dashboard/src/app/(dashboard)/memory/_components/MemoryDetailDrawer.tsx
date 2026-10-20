"use client";

import React from "react";
import { useTranslation } from "react-i18next";

import { MemoryRow } from "@/components/networking";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MemoryDetailDrawerProps {
  row: MemoryRow | null;
  onClose: () => void;
}

const CODE_CLASS = "rounded-sm border border-border bg-muted px-1 py-0.5 font-mono text-xs text-foreground";
const BLOCK_CLASS = "mt-1 rounded-md bg-muted p-3 font-mono whitespace-pre-wrap text-foreground";
const LABEL_CLASS = "text-sm font-semibold text-foreground";

function formatTimestamp(ts?: string): string {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

export function MemoryDetailDrawer({ row, onClose }: MemoryDetailDrawerProps) {
  const { t } = useTranslation();
  return (
    <Sheet
      open={!!row}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:sm:w-[720px] data-[side=right]:sm:max-w-full">
        <SheetHeader className="border-b">
          <SheetTitle>
            {row ? (
              <code className={CODE_CLASS}>{row.key}</code>
            ) : (
              t("memoryView.memoryView.pageTitle", { defaultValue: "Memory" })
            )}
          </SheetTitle>
        </SheetHeader>
        {row && (
          <div className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <span className={`block ${LABEL_CLASS}`}>
                  {t("memoryView.memoryView.labelMemoryId", { defaultValue: "Memory ID" })}
                </span>
                <code className={CODE_CLASS}>{row.memory_id}</code>
              </div>
              <div>
                <span className={`block ${LABEL_CLASS}`}>
                  {t("memoryView.memoryView.colUserId", { defaultValue: "User ID" })}
                </span>
                <span className={row.user_id ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                  {row.user_id ?? "-"}
                </span>
              </div>
              <div>
                <span className={`block ${LABEL_CLASS}`}>
                  {t("memoryView.memoryView.colTeamId", { defaultValue: "Team ID" })}
                </span>
                <span className={row.team_id ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                  {row.team_id ?? "-"}
                </span>
              </div>
            </div>
            <div>
              <span className={LABEL_CLASS}>{t("memoryView.memoryView.labelValue", { defaultValue: "Value" })}</span>
              <p className={`${BLOCK_CLASS} text-[13px]`}>{row.value}</p>
            </div>
            {row.metadata !== undefined && row.metadata !== null && (
              <div>
                <span className={LABEL_CLASS}>
                  {t("memoryView.memoryView.labelMetadata", { defaultValue: "Metadata" })}
                </span>
                <p className={`${BLOCK_CLASS} text-xs`}>{JSON.stringify(row.metadata, null, 2)}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {row.created_by
                  ? t("memoryView.memoryView.createdAtBy", {
                      timestamp: formatTimestamp(row.created_at),
                      by: row.created_by,
                      defaultValue: "Created {{timestamp}} by {{by}}",
                    })
                  : t("memoryView.memoryView.createdAt", {
                      timestamp: formatTimestamp(row.created_at),
                      defaultValue: "Created {{timestamp}}",
                    })}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {row.updated_by
                  ? t("memoryView.memoryView.updatedAtBy", {
                      timestamp: formatTimestamp(row.updated_at),
                      by: row.updated_by,
                      defaultValue: "Updated {{timestamp}} by {{by}}",
                    })
                  : t("memoryView.memoryView.updatedAt", {
                      timestamp: formatTimestamp(row.updated_at),
                      defaultValue: "Updated {{timestamp}}",
                    })}
              </span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default MemoryDetailDrawer;
