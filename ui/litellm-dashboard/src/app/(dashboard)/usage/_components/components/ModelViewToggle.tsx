import { useTranslation } from "react-i18next";

export type ModelViewType = "groups" | "individual";

const MODEL_VIEW_OPTIONS: readonly { value: ModelViewType; label: string; labelKey: string }[] = [
  { value: "groups", label: "Public Model Name", labelKey: "usagePage.usagePageView.publicModelName" },
  { value: "individual", label: "Litellm Model Name", labelKey: "usagePage.usagePageView.litellmModelName" },
];

interface ModelViewToggleProps {
  value: ModelViewType;
  onChange: (value: ModelViewType) => void;
}

export default function ModelViewToggle({ value, onChange }: ModelViewToggleProps) {
  const { t } = useTranslation();
  return (
    <div className="flex bg-muted rounded-lg p-1">
      {MODEL_VIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            value === option.value ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange(option.value)}
        >
          {t(option.labelKey, { defaultValue: option.label })}
        </button>
      ))}
    </div>
  );
}
