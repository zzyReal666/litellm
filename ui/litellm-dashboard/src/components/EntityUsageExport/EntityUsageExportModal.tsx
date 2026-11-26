import { Loader2 } from "lucide-react";
import i18n from "@/lib/i18n";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import ExportFormatSelector from "./ExportFormatSelector";
import ExportSummary from "./ExportSummary";
import ExportTypeSelector from "./ExportTypeSelector";
import type { EntityType, EntityUsageExportModalProps, ExportFormat, ExportType } from "./types";
import { downloadBlob, exportFilename } from "./utils";

const entityLabelOf = (entityType: EntityType): string =>
  i18n.t(`entityUsageExport.entityTypes.${entityType}`, { defaultValue: entityType });

const EntityUsageExportModal: React.FC<EntityUsageExportModalProps> = ({
  isOpen,
  onClose,
  entityType,
  onExport,
  dateRange,
  selectedFilters = [],
  customTitle,
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportType, setExportType] = useState<ExportType>("daily");
  const [isExporting, setIsExporting] = useState(false);

  const entityLabel = entityLabelOf(entityType);
  const modalTitle =
    customTitle ??
    i18n.t("entityUsageExport.modal.title", { defaultValue: "Export {{entity}} usage data", entity: entityLabel });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await onExport(exportType, exportFormat);
      downloadBlob(blob, exportFilename(entityType, exportType, exportFormat, dateRange));
      toast.success(
        i18n.t("entityUsageExport.modal.exportSuccess", {
          defaultValue: "{{entity}} usage data exported successfully as {{format}}",
          entity: entityLabel,
          format: exportFormat.toUpperCase(),
        }),
      );
      onClose();
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.fromError(i18n.t("entityUsageExport.modal.exportFailed", { defaultValue: "Failed to export data" }));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{modalTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <ExportSummary dateRange={dateRange} selectedFilters={selectedFilters} />
          <ExportTypeSelector value={exportType} onChange={setExportType} entityType={entityType} />
          <ExportFormatSelector value={exportFormat} onChange={setExportFormat} />
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              {i18n.t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting && <Loader2 className="animate-spin" />}
              {isExporting
                ? i18n.t("entityUsageExport.modal.exporting", { defaultValue: "Exporting..." })
                : i18n.t("entityUsageExport.modal.exportButton", {
                    defaultValue: "Export {{format}}",
                    format: exportFormat.toUpperCase(),
                  })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityUsageExportModal;
