"use client";

import { formatDateOnly, formatDateTime, formatTableDateTime } from "@/utils/dateFormat";
import { CellTooltip } from "./cell_tooltip";



export type DatePrecision = "datetime" | "date";

interface DateCellProps {
  value: string | null | undefined;
  precision?: DatePrecision;
  fallback?: string;
}

const pad = (n: number): string => String(n).padStart(2, "0");

export const formatCellDate = (date: Date, precision: DatePrecision): string =>
  (precision === "date" ? formatDateOnly(date) : formatTableDateTime(date)) ?? "-";

export const formatFullTimestamp = (date: Date): string => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `${formatDateTime(date)} (${timeZone})`;
};

export function DateCell({ value, precision = "datetime", fallback = "-" }: DateCellProps) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">{fallback}</span>;
  }

  return (
    <CellTooltip
      content={formatFullTimestamp(date)}
      trigger={<span className="whitespace-nowrap">{formatCellDate(date, precision)}</span>}
    />
  );
}
