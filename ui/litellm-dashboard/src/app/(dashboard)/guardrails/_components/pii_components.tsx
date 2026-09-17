import React from "react";
import { EyeOff, Filter, Info, Ban, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PiiEntityCategory } from "@/components/guardrails/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Helper functions
export const formatEntityName = (name: string) => {
  return name.replace(/_/g, " ");
};

export const getActionIcon = (action: string) => {
  switch (action) {
    case "MASK":
      return <EyeOff className="mr-1 size-3.5" />;
    case "BLOCK":
      return <Ban className="mr-1 size-3.5" />;
    default:
      return null;
  }
};

// CategoryFilter component
export interface CategoryFilterProps {
  categories: PiiEntityCategory[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategories, onChange }) => {
  const { t } = useTranslation();
  const anchor = useComboboxAnchor();
  const categoryNames = categories.map((cat) => cat.category);

  return (
    <div>
      <div className="mb-2 flex items-center">
        <Filter className="mr-1 size-4 text-muted-foreground" />
        <span className="font-medium text-muted-foreground">
          {t("guardrails.piiComponents.filterByCategory", { defaultValue: "Filter by category" })}
        </span>
      </div>
      <Combobox items={categoryNames} value={selectedCategories} onValueChange={onChange} multiple>
        <ComboboxChips render={<div ref={anchor} />} className="mb-4 w-full">
          {selectedCategories.map((category) => (
            <ComboboxChip key={category} aria-label={category}>
              {category}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            placeholder={
              selectedCategories.length === 0
                ? t("guardrails.piiComponents.selectCategoriesPlaceholder", {
                    defaultValue: "Select categories to filter by",
                  })
                : undefined
            }
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>
            {t("guardrails.piiComponents.noMatchingCategories", { defaultValue: "No matching categories" })}
          </ComboboxEmpty>
          <ComboboxList>
            {(category: string) => (
              <ComboboxItem key={category} value={category}>
                {category}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
};

// QuickActions component
export interface QuickActionsProps {
  onSelectAll: (action: string) => void;
  onUnselectAll: () => void;
  hasSelectedEntities: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onSelectAll, onUnselectAll, hasSelectedEntities }) => {
  const { t } = useTranslation();

  return (
    <div className="mb-6 rounded-lg border border-border bg-muted/40 p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-base font-semibold">
            {t("guardrails.piiComponents.quickActions", { defaultValue: "Quick Actions" })}
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="ml-2 cursor-help text-muted-foreground">
                  <Info className="size-3.5" />
                </span>
              }
            />
            <TooltipContent>
              {t("guardrails.piiComponents.quickActionsTooltip", {
                defaultValue: "Apply action to all PII types at once",
              })}
            </TooltipContent>
          </Tooltip>
        </div>
        <Button variant="outline" onClick={onUnselectAll} disabled={!hasSelectedEntities}>
          <X />
          {t("guardrails.piiComponents.unselectAll", { defaultValue: "Unselect All" })}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-10 w-full" onClick={() => onSelectAll("MASK")}>
          <EyeOff />
          {t("guardrails.piiComponents.selectAllMask", { defaultValue: "Select All & Mask" })}
        </Button>
        <Button variant="outline" className="h-10 w-full" onClick={() => onSelectAll("BLOCK")}>
          <Ban />
          {t("guardrails.piiComponents.selectAllBlock", { defaultValue: "Select All & Block" })}
        </Button>
      </div>
    </div>
  );
};

// PiiEntityList component
export interface PiiEntityListProps {
  entities: string[];
  selectedEntities: string[];
  selectedActions: { [key: string]: string };
  actions: string[];
  onEntitySelect: (entity: string) => void;
  onActionSelect: (entity: string, action: string) => void;
  entityToCategoryMap: Map<string, string>;
}

export const PiiEntityList: React.FC<PiiEntityListProps> = ({
  entities,
  selectedEntities,
  selectedActions,
  actions,
  onEntitySelect,
  onActionSelect,
  entityToCategoryMap,
}) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-xs">
      <div className="flex border-b border-border bg-muted/40 px-5 py-3">
        <span className="flex-1 font-semibold">
          {t("guardrails.piiComponents.piiTypeHeader", { defaultValue: "PII Type" })}
        </span>
        <span className="w-32 text-right font-semibold">
          {t("guardrails.piiComponents.actionHeader", { defaultValue: "Action" })}
        </span>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {entities.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {t("guardrails.piiComponents.noMatch", { defaultValue: "No PII types match your filter criteria" })}
          </div>
        ) : (
          entities.map((entity) => {
            const isSelected = selectedEntities.includes(entity);
            return (
              <div
                key={entity}
                className={`flex items-center justify-between border-b border-border px-5 py-3 hover:bg-muted/40 ${
                  isSelected ? "bg-accent" : ""
                }`}
              >
                <div className="flex flex-1 items-center">
                  <Checkbox className="mr-3" checked={isSelected} onCheckedChange={() => onEntitySelect(entity)} />
                  <span className={isSelected ? "font-medium text-foreground" : "text-muted-foreground"}>
                    {formatEntityName(entity)}
                  </span>
                  {entityToCategoryMap.get(entity) && (
                    <Badge variant="secondary" className="ml-2">
                      {entityToCategoryMap.get(entity)}
                    </Badge>
                  )}
                </div>
                <div className="w-32">
                  <Select
                    value={isSelected ? selectedActions[entity] || "MASK" : "MASK"}
                    onValueChange={(value: string | null) => value && onActionSelect(entity, value)}
                    disabled={!isSelected}
                  >
                    <SelectTrigger
                      className={`w-[120px] ${isSelected ? "" : "opacity-50"}`}
                      aria-label={t("guardrails.piiComponents.actionHeader", { defaultValue: "Action" })}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          <span className="flex items-center">
                            {getActionIcon(action)}
                            {action}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
