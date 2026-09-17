import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatGuardrailMode } from "@/app/(dashboard)/guardrails/_components/guardrail_info_helpers";

interface GuardrailInfo {
  guardrail_name: string;
  description: string;
  alreadyExists: boolean;
  definition: any;
}

interface GuardrailSelectionModalProps {
  visible: boolean;
  template: any;
  existingGuardrails: Set<string>;
  onConfirm: (selectedGuardrails: any[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  progressInfo?: { current: number; total: number } | null;
}

const GuardrailSelectionModal: React.FC<GuardrailSelectionModalProps> = ({
  visible,
  template,
  existingGuardrails,
  onConfirm,
  onCancel,
  isLoading = false,
  progressInfo,
}) => {
  const { t } = useTranslation();
  const [selectedGuardrails, setSelectedGuardrails] = useState<Set<string>>(new Set());

  // Prepare guardrail info with existence status
  const guardrailsInfo: GuardrailInfo[] = (template?.guardrailDefinitions || []).map((def: any) => ({
    guardrail_name: def.guardrail_name,
    description:
      def.guardrail_info?.description ||
      t("policies.guardrailSelectionModal.noDescriptionAvailable", { defaultValue: "No description available" }),
    alreadyExists: existingGuardrails.has(def.guardrail_name),
    definition: def,
  }));

  // Initialize selection: select only new guardrails by default
  useEffect(() => {
    if (visible && template) {
      const newGuardrails = guardrailsInfo.filter((g) => !g.alreadyExists).map((g) => g.guardrail_name);
      setSelectedGuardrails(new Set(newGuardrails));
    }
  }, [visible, template]);

  const handleToggle = (guardrailName: string) => {
    setSelectedGuardrails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(guardrailName)) {
        newSet.delete(guardrailName);
      } else {
        newSet.add(guardrailName);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allNew = guardrailsInfo.filter((g) => !g.alreadyExists).map((g) => g.guardrail_name);
    setSelectedGuardrails(new Set(allNew));
  };

  const handleDeselectAll = () => {
    setSelectedGuardrails(new Set());
  };

  const handleConfirm = () => {
    const selectedDefinitions = guardrailsInfo
      .filter((g) => selectedGuardrails.has(g.guardrail_name))
      .map((g) => g.definition);
    onConfirm(selectedDefinitions);
  };

  const newGuardrailsCount = guardrailsInfo.filter((g) => !g.alreadyExists).length;
  const existingCount = guardrailsInfo.filter((g) => g.alreadyExists).length;
  const selectedCount = selectedGuardrails.size;

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-175">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {template?.title}
            {progressInfo && (
              <Badge variant="secondary">
                {t("policies.guardrailSelectionModal.templateProgress", {
                  current: progressInfo.current,
                  total: progressInfo.total,
                  defaultValue: "Template {{current}} of {{total}}",
                })}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {t("policies.guardrailSelectionModal.subtitle", {
              defaultValue: "Review and select guardrails to create for this template",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Summary Stats */}
          <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-muted p-3">
            <Info className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-medium">
                  {t("policies.guardrailSelectionModal.totalGuardrails", {
                    count: guardrailsInfo.length,
                    defaultValue: "{{count}} total guardrails",
                  })}
                </span>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="font-medium text-success">
                  {t("policies.guardrailSelectionModal.newCount", {
                    count: newGuardrailsCount,
                    defaultValue: "{{count}} new",
                  })}
                </span>
                {existingCount > 0 && (
                  <>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {t("policies.guardrailSelectionModal.alreadyExistCount", {
                        count: existingCount,
                        defaultValue: "{{count}} already exist",
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
            {newGuardrailsCount > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {t("policies.guardrailSelectionModal.selectAllNew", { defaultValue: "Select All New" })}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  {t("policies.guardrailSelectionModal.deselectAll", { defaultValue: "Deselect All" })}
                </Button>
              </div>
            )}
          </div>

          {/* Guardrails List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {guardrailsInfo.map((guardrail) => (
              <div
                key={guardrail.guardrail_name}
                className={`rounded-lg border p-4 transition-colors ${
                  guardrail.alreadyExists ? "border-border bg-muted/50" : "border-border bg-card hover:border-ring"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 pt-0.5">
                    {guardrail.alreadyExists ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Checkbox
                        checked={selectedGuardrails.has(guardrail.guardrail_name)}
                        onCheckedChange={() => handleToggle(guardrail.guardrail_name)}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">{guardrail.guardrail_name}</span>
                      {guardrail.alreadyExists && (
                        <Badge variant="secondary">
                          {t("policies.guardrailSelectionModal.alreadyExists", { defaultValue: "Already exists" })}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{guardrail.description}</p>

                    {/* Show guardrail type and mode */}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {guardrail.definition?.litellm_params?.guardrail ||
                          t("policies.guardrailSelectionModal.unknown", { defaultValue: "unknown" })}
                      </Badge>
                      <Badge variant="secondary">
                        {formatGuardrailMode(guardrail.definition?.litellm_params?.mode, t) ||
                          t("policies.guardrailSelectionModal.unknown", { defaultValue: "unknown" })}
                      </Badge>
                      {guardrail.definition?.litellm_params?.patterns && (
                        <Badge variant="secondary">
                          {t("policies.guardrailSelectionModal.patternCount", {
                            count: guardrail.definition.litellm_params.patterns.length,
                            defaultValue: "{{count}} patterns",
                          })}
                        </Badge>
                      )}
                      {guardrail.definition?.litellm_params?.categories && (
                        <Badge variant="secondary">
                          {t("policies.guardrailSelectionModal.categoryCount", {
                            count: guardrail.definition.litellm_params.categories.length,
                            defaultValue: "{{count}} categories",
                          })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {guardrailsInfo.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p>
                {t("policies.guardrailSelectionModal.noGuardrailsDefined", {
                  defaultValue: "No guardrails defined for this template.",
                })}
              </p>
              <p className="text-sm mt-2">
                {t("policies.guardrailSelectionModal.usesExistingGuardrails", {
                  defaultValue: "This template will use existing guardrails in your system.",
                })}
              </p>
            </div>
          )}

          {/* Discovered Competitors */}
          {template?.discoveredCompetitors?.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="rounded-lg border border-border bg-muted p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <span className="text-sm font-medium">
                    {t("policies.guardrailSelectionModal.aiDiscoveredCompetitors", {
                      count: template.discoveredCompetitors.length,
                      defaultValue: "AI-Discovered Competitors ({{count}})",
                    })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {template.discoveredCompetitors.map((name: string) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("policies.guardrailSelectionModal.competitorBlockerNote", {
                    defaultValue:
                      "These competitor names will be automatically blocked by the competitor-name-blocker guardrail.",
                  })}
                </p>
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Selected Summary */}
          <div className="text-sm text-muted-foreground">
            {selectedCount > 0 ? (
              <p>
                {t("policies.guardrailSelectionModal.willBeCreated", {
                  count: selectedCount,
                  defaultValue: "{{count}} guardrails will be created",
                })}
              </p>
            ) : existingCount > 0 ? (
              <p className="text-success">
                {t("policies.guardrailSelectionModal.allExistProceed", {
                  defaultValue: "All guardrails already exist. You can proceed to use this template.",
                })}
              </p>
            ) : (
              <p className="text-warning">
                {t("policies.guardrailSelectionModal.selectAtLeastOne", {
                  defaultValue:
                    'Select at least one guardrail to create, or click "Use Template" to proceed without creating new guardrails.',
                })}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || (selectedCount === 0 && existingCount === 0)}>
            {selectedCount > 0
              ? t("policies.guardrailSelectionModal.createAndUseTemplate", {
                  count: selectedCount,
                  defaultValue: "Create {{count}} Guardrails & Use Template",
                })
              : t("policies.guardrailSelectionModal.useTemplate", { defaultValue: "Use Template" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuardrailSelectionModal;
