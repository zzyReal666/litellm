import React, { useId } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";

interface TagFilteringToggleProps {
  enabled: boolean;
  routerFieldsMetadata: { [key: string]: any };
  onToggle: (enabled: boolean) => void;
}

const TagFilteringToggle: React.FC<TagFilteringToggleProps> = ({ enabled, routerFieldsMetadata, onToggle }) => {
  const toggleId = useId();
  const { t } = useTranslation();

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label htmlFor={toggleId} className="text-xs font-medium text-foreground uppercase tracking-wide">
            {t("routerSettings.fields.enable_tag_filtering.label", {
              defaultValue: routerFieldsMetadata["enable_tag_filtering"]?.ui_field_name || "Enable Tag Filtering",
            })}
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("routerSettings.fields.enable_tag_filtering.description", {
              defaultValue: routerFieldsMetadata["enable_tag_filtering"]?.field_description || "",
            })}
          </p>
        </div>
        <Switch id={toggleId} checked={enabled} onCheckedChange={onToggle} className="ml-4" />
      </div>
    </div>
  );
};

export default TagFilteringToggle;
