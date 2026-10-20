import React from "react";
import { ArrowLeftIcon, SaveIcon, ClockIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import PromptCodeSnippets from "./PromptCodeSnippets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ENVIRONMENT_ITEMS = [
  { value: "development", label: "Development", labelKey: "promptsPage.promptEditorHeader.envDevelopment" },
  { value: "staging", label: "Staging", labelKey: "promptsPage.promptEditorHeader.envStaging" },
  { value: "production", label: "Production", labelKey: "promptsPage.promptEditorHeader.envProduction" },
];

interface PromptEditorHeaderProps {
  promptName: string;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onSave: () => void;
  isSaving: boolean;
  editMode?: boolean;
  onShowHistory?: () => void;
  version?: string | null;
  promptModel?: string | null;
  promptVariables?: Record<string, string>;
  accessToken: string | null;
  proxySettings?: {
    PROXY_BASE_URL?: string;
    LITELLM_UI_API_DOC_BASE_URL?: string | null;
  };
  environment: string;
  onEnvironmentChange: (env: string) => void;
}

const PromptEditorHeader: React.FC<PromptEditorHeaderProps> = ({
  promptName,
  onNameChange,
  onBack,
  onSave,
  isSaving,
  editMode = false,
  onShowHistory,
  version,
  promptModel = "gpt-4o",
  promptVariables = {},
  accessToken,
  proxySettings,
  environment,
  onEnvironmentChange,
}) => {
  const { t } = useTranslation();
  const environmentLabel = (item: (typeof ENVIRONMENT_ITEMS)[number]) => t(item.labelKey, { defaultValue: item.label });
  const environmentItems = ENVIRONMENT_ITEMS.map((item) => ({ ...item, label: environmentLabel(item) }));

  return (
    <div className="bg-background border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" onClick={onBack} size="sm">
          <ArrowLeftIcon />
          {t("common.back", { defaultValue: "Back" })}
        </Button>
        <Input
          aria-label={t("promptsPage.promptEditorHeader.promptNameAriaLabel", { defaultValue: "Prompt name" })}
          value={promptName}
          onChange={(e) => onNameChange(e.target.value)}
          className="text-base font-medium border-none shadow-none"
          style={{ width: "200px" }}
        />
        {version && <Badge>{version}</Badge>}
        <Select
          items={environmentItems}
          value={environment}
          onValueChange={(value) => onEnvironmentChange(String(value))}
        >
          <SelectTrigger
            size="sm"
            className="w-[140px]"
            aria-label={t("promptsPage.promptTable.colEnvironment", { defaultValue: "Environment" })}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENVIRONMENT_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {environmentLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{t("promptsPage.promptEditorHeader.draft", { defaultValue: "Draft" })}</Badge>
        <span className="text-xs text-muted-foreground">
          {t("promptsPage.promptEditorHeader.unsavedChanges", { defaultValue: "Unsaved changes" })}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <PromptCodeSnippets
          promptId={promptName}
          model={promptModel ?? "YOUR_MODEL"}
          promptVariables={promptVariables}
          accessToken={accessToken}
          version={version?.replace("v", "") || "1"}
          environment={environment}
          proxySettings={proxySettings}
        />
        {editMode && onShowHistory && (
          <Button variant="outline" onClick={onShowHistory}>
            <ClockIcon />
            {t("promptsPage.promptEditorHeader.history", { defaultValue: "History" })}
          </Button>
        )}
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? <LoaderCircleIcon className="animate-spin" /> : <SaveIcon />}
          {editMode ? t("common.update", { defaultValue: "Update" }) : t("common.save", { defaultValue: "Save" })}
        </Button>
      </div>
    </div>
  );
};

export default PromptEditorHeader;
