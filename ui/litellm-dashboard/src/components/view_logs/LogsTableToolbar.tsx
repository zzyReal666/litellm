"use client";

import moment from "moment";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

import { QUICK_SELECT_OPTIONS } from "./constants";
import { getTimeRangeDisplay } from "./logs_utils";

interface LogsTableToolbarProps {
  startTime: string;
  onStartTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  isCustomDate: boolean;
  onIsCustomDateChange: (value: boolean) => void;
  selectedTimeInterval: { value: number; unit: string };
  onSelectedTimeIntervalChange: (value: { value: number; unit: string }) => void;
  isLiveTail: boolean;
  onIsLiveTailChange: (value: boolean) => void;
  excludeInternalHealthChecks: boolean;
  onExcludeInternalHealthChecksChange: (value: boolean) => void;
  onResetToFirstPage: () => void;
  onResetFilters: () => void;
}

export function LogsTableToolbar({
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  isCustomDate,
  onIsCustomDateChange,
  selectedTimeInterval,
  onSelectedTimeIntervalChange,
  isLiveTail,
  onIsLiveTailChange,
  excludeInternalHealthChecks,
  onExcludeInternalHealthChecksChange,
  onResetToFirstPage,
  onResetFilters,
}: LogsTableToolbarProps) {
  const { t } = useTranslation();
  const [quickSelectOpen, setQuickSelectOpen] = useState(false);

  const applyQuickSelect = (option: { label: string; value: number; unit: string }) => {
    onResetToFirstPage();
    onEndTimeChange(moment().format("YYYY-MM-DDTHH:mm"));
    onStartTimeChange(
      moment()
        .subtract(option.value, option.unit as moment.unitOfTime.DurationConstructor)
        .format("YYYY-MM-DDTHH:mm"),
    );
    onSelectedTimeIntervalChange({ value: option.value, unit: option.unit });
    onIsCustomDateChange(false);
    setQuickSelectOpen(false);
  };

  const selectedOption = QUICK_SELECT_OPTIONS.find(
    (option) => option.value === selectedTimeInterval.value && option.unit === selectedTimeInterval.unit,
  );
  const displayLabel = isCustomDate
    ? getTimeRangeDisplay(isCustomDate, startTime, endTime, t)
    : selectedOption !== undefined
      ? t(selectedOption.labelKey, { defaultValue: selectedOption.label })
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={quickSelectOpen} onOpenChange={setQuickSelectOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarDays className="size-4" />
              {displayLabel}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-64 p-2">
          <div className="space-y-1">
            {QUICK_SELECT_OPTIONS.map((option) => (
              <Button
                key={option.label}
                variant="ghost"
                className="w-full justify-start font-normal"
                onClick={() => applyQuickSelect(option)}
              >
                {t(option.labelKey, { defaultValue: option.label })}
              </Button>
            ))}
            <div className="my-2 border-t" />
            <Button
              variant="ghost"
              className="w-full justify-start font-normal"
              onClick={() => {
                onIsCustomDateChange(!isCustomDate);
                onResetToFirstPage();
              }}
            >
              {t("viewLogs.logsTableToolbar.customRange", { defaultValue: "Custom Range" })}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {isCustomDate && (
        <div className="flex items-center gap-2">
          <Input
            type="datetime-local"
            className="w-auto"
            value={startTime}
            onChange={(event) => {
              onStartTimeChange(event.target.value);
              onResetToFirstPage();
            }}
          />
          <span className="text-sm text-muted-foreground">
            {t("viewLogs.logsTableToolbar.to", { defaultValue: "to" })}
          </span>
          <Input
            type="datetime-local"
            className="w-auto"
            value={endTime}
            onChange={(event) => {
              onEndTimeChange(event.target.value);
              onResetToFirstPage();
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {t("viewLogs.logsTableToolbar.liveTail", { defaultValue: "Live Tail" })}
        </span>
        <Switch
          checked={isLiveTail}
          onCheckedChange={onIsLiveTailChange}
          aria-label={t("viewLogs.logsTableToolbar.liveTail", { defaultValue: "Live Tail" })}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {t("viewLogs.logsTableToolbar.hideHealthChecks", { defaultValue: "Hide Health Checks" })}
        </span>
        <Switch
          checked={excludeInternalHealthChecks}
          onCheckedChange={onExcludeInternalHealthChecksChange}
          aria-label={t("viewLogs.logsTableToolbar.hideHealthChecks", { defaultValue: "Hide Health Checks" })}
        />
      </div>

      <Button variant="outline" size="sm" onClick={onResetFilters}>
        {t("molecules.filter.resetFilters", { defaultValue: "Reset Filters" })}
      </Button>
    </div>
  );
}

export function LiveTailBanner({ onStop }: { onStop: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mb-4 flex items-center justify-between rounded-md border border-success/20 bg-success/10 px-4 py-2">
      <span className="text-sm text-success">
        {t("viewLogs.logsTableToolbar.autoRefreshing", { defaultValue: "Auto-refreshing every 15 seconds" })}
      </span>
      <button type="button" onClick={onStop} className="text-sm text-success hover:text-success/80">
        {t("viewLogs.logsTableToolbar.stop", { defaultValue: "Stop" })}
      </button>
    </div>
  );
}
