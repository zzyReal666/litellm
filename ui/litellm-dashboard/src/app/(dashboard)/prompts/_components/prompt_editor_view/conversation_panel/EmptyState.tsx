import React from "react";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EmptyStateProps {
  hasVariables: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasVariables }) => {
  const { t } = useTranslation();
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
      <Bot className="mb-4 size-12" aria-hidden="true" />
      <span className="text-base">
        {hasVariables
          ? t("promptsPage.conversationPanel.emptyStateWithVariables", {
              defaultValue: "Fill in the variables above, then type a message to start testing",
            })
          : t("promptsPage.conversationPanel.emptyStateNoVariables", {
              defaultValue: "Type a message below to start testing your prompt",
            })}
      </span>
    </div>
  );
};

export default EmptyState;
