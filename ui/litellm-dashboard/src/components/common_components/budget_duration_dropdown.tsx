import React from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const NEVER_RESETS_BUDGET_DURATION = "none";

interface DurationLabel {
  key: string;
  label: string;
}

const DURATION_LABELS: Record<string, DurationLabel> = {
  [NEVER_RESETS_BUDGET_DURATION]: {
    key: "commonComponents.budgetDurationDropdown.neverResets",
    label: "Never resets",
  },
  "1h": { key: "commonComponents.budgetDurationDropdown.hourly", label: "hourly" },
  "24h": { key: "commonComponents.budgetDurationDropdown.daily", label: "daily" },
  "7d": { key: "commonComponents.budgetDurationDropdown.weekly", label: "weekly" },
  "30d": { key: "commonComponents.budgetDurationDropdown.monthly", label: "monthly" },
};

interface BudgetDurationDropdownProps {
  id?: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  showNeverResets?: boolean;
}

const BudgetDurationDropdown: React.FC<BudgetDurationDropdownProps> = ({
  id,
  value,
  onChange,
  className = "",
  style = {},
  placeholder = "n/a",
  showNeverResets = false,
}) => {
  const { t } = useTranslation();
  const labelFor = (duration: string): string => {
    const entry = DURATION_LABELS[duration];
    return entry ? t(entry.key, { defaultValue: entry.label }) : duration;
  };

  return (
    <Select
      items={Object.fromEntries(Object.entries(DURATION_LABELS).map(([k, v]) => [k, labelFor(k)]))}
      value={value || null}
      onValueChange={onChange}
    >
      <SelectTrigger id={id} className={`w-full ${className}`} style={style}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>{placeholder}</SelectItem>
        {showNeverResets ? (
          <SelectItem value={NEVER_RESETS_BUDGET_DURATION}>{labelFor(NEVER_RESETS_BUDGET_DURATION)}</SelectItem>
        ) : null}
        <SelectItem value="1h">{labelFor("1h")}</SelectItem>
        <SelectItem value="24h">{labelFor("24h")}</SelectItem>
        <SelectItem value="7d">{labelFor("7d")}</SelectItem>
        <SelectItem value="30d">{labelFor("30d")}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const getBudgetDurationLabel = (value: string | null | undefined): string => {
  if (!value) return "Not set";

  const budgetDurationMap: Record<string, string> = {
    "1h": "hourly",
    "24h": "daily",
    "7d": "weekly",
    "30d": "monthly",
  };

  return budgetDurationMap[value] || value;
};

export default BudgetDurationDropdown;
