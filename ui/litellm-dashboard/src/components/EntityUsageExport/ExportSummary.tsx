import React from "react";
import i18n from "@/lib/i18n";
import type { DateRangePickerValue } from "@/components/shared/date_picker_types";

interface ExportSummaryProps {
  dateRange: DateRangePickerValue;
  selectedFilters: string[];
}

const ExportSummary: React.FC<ExportSummaryProps> = ({ dateRange, selectedFilters }) => {
  return (
    <div className="text-sm text-muted-foreground">
      {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
      {selectedFilters.length > 0 &&
        ` · ${i18n.t("entityUsageExport.summary.filterCount", {
          count: selectedFilters.length,
          defaultValue: "{{count}} filters",
          defaultValue_one: "{{count}} filter",
        })}`}
    </div>
  );
};

export default ExportSummary;
