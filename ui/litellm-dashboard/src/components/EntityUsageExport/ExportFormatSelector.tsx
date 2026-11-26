import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import i18n from "@/lib/i18n";
import type { ExportFormat } from "./types";

interface ExportFormatSelectorProps {
  value: ExportFormat;
  onChange: (value: ExportFormat) => void;
}

const formatLabel = (format: ExportFormat): string =>
  format === "csv"
    ? i18n.t("entityUsageExport.formatSelector.csv", { defaultValue: "CSV (Excel, Google Sheets)" })
    : i18n.t("entityUsageExport.formatSelector.json", { defaultValue: "JSON (includes metadata)" });

const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({ value, onChange }) => {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-2">
        {i18n.t("entityUsageExport.formatSelector.format", { defaultValue: "Format" })}
      </label>
      <Select value={value} onValueChange={(next: ExportFormat | null) => next && onChange(next)}>
        <SelectTrigger className="w-full">
          <SelectValue>{formatLabel(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(["csv", "json"] as ExportFormat[]).map((format) => (
            <SelectItem key={format} value={format}>
              {formatLabel(format)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ExportFormatSelector;
