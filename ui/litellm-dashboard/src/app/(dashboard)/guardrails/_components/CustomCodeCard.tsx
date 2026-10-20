import { Code } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CustomCodeCardProps {
  code: string;
  canEdit: boolean;
  onEdit: () => void;
}

export const CustomCodeCard: React.FC<CustomCodeCardProps> = ({ code, canEdit, onEdit }) => {
  const { t } = useTranslation();

  return (
    <Card className="block mt-6 p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Code className="text-info" />
          <p className="font-medium text-lg">
            {t("guardrails.guardrailInfo.customCode", { defaultValue: "Custom Code" })}
          </p>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Code />
            {t("guardrails.guardrailInfo.editCode", { defaultValue: "Edit Code" })}
          </Button>
        )}
      </div>
      <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e]">
        <pre
          className="p-4 text-sm text-gray-200 overflow-x-auto"
          style={{ fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace" }}
        >
          <code>{code}</code>
        </pre>
      </div>
    </Card>
  );
};
