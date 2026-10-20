import { Info } from "lucide-react";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import React from "react";
import { useTranslation } from "react-i18next";
import { ModelGroup } from "@/components/llm_calls/fetch_models";

const DEFAULT_MATCH_THRESHOLD = 0.5;

interface SemanticKeywordMatchingProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  embeddingModel: string | undefined;
  onEmbeddingModelChange: (model: string) => void;
  matchThreshold: number;
  onMatchThresholdChange: (threshold: number) => void;
  modelInfo: ModelGroup[];
  showValidationErrors?: boolean;
}

const SemanticKeywordMatching: React.FC<SemanticKeywordMatchingProps> = ({
  enabled,
  onEnabledChange,
  embeddingModel,
  onEmbeddingModelChange,
  matchThreshold,
  onMatchThresholdChange,
  modelInfo,
  showValidationErrors = false,
}) => {
  const { t } = useTranslation();
  const embeddingModels = modelInfo.filter((model) => model.mode === "embedding");
  const modelOptions = Array.from(new Set(embeddingModels.map((model) => model.model_group))).map((model_group) => ({
    value: model_group,
    label: model_group,
  }));
  const embeddingModelMissing = showValidationErrors && !embeddingModel;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {t("addModel.semanticKeywordMatching.enableLabel", { defaultValue: "Semantic keyword matching" })}
            </span>
            <SimpleTooltip
              content={t("addModel.semanticKeywordMatching.enableTooltip", {
                defaultValue:
                  "Recognize related phrasing beyond exact keyword matches by comparing embeddings instead of plain text. Overrides direct keyword matching",
              })}
            >
              <Info className="size-4 text-muted-foreground" />
            </SimpleTooltip>
          </div>
          <span className="text-muted-foreground text-sm">
            {t("addModel.semanticKeywordMatching.enableHint", {
              defaultValue:
                "Uses same keyword-tier pairs as above and overrides direct keyword matching. Adds latency based on embedding model network request.",
            })}
          </span>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label={t("addModel.semanticKeywordMatching.enableLabel", {
            defaultValue: "Semantic keyword matching",
          })}
        />
      </div>

      {enabled && (
        <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-border">
          <div>
            <span className="mb-1 block text-sm font-medium">
              {t("addModel.semanticKeywordMatching.embeddingModelLabel", { defaultValue: "Embedding model" })}
            </span>
            <SearchSelect
              options={modelOptions}
              value={embeddingModel ?? ""}
              onValueChange={(model) => {
                if (model !== null) onEmbeddingModelChange(model);
              }}
              placeholder={t("vectorStoreManagement.s3VectorsConfig.embeddingModelPlaceholder", {
                defaultValue: "Select an embedding model",
              })}
              emptyText={t("addModel.semanticKeywordMatching.noEmbeddingModels", {
                defaultValue: "No embedding models found",
              })}
              aria-label={t("addModel.semanticKeywordMatching.embeddingModelLabel", {
                defaultValue: "Embedding model",
              })}
              allowClear={false}
              className={embeddingModelMissing ? "border-destructive" : undefined}
            />
            {embeddingModelMissing && (
              <span className="text-xs text-destructive">
                {t("addModel.semanticKeywordMatching.embeddingModelRequired", {
                  defaultValue: "An embedding model is required",
                })}
              </span>
            )}
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium">
              {t("addModel.semanticKeywordMatching.matchThresholdLabel", { defaultValue: "Minimum match score" })}
            </span>
            <Input
              type="number"
              value={matchThreshold}
              onChange={(event) =>
                onMatchThresholdChange(event.target.value === "" ? DEFAULT_MATCH_THRESHOLD : event.target.valueAsNumber)
              }
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              {t("addModel.semanticKeywordMatching.matchThresholdHint", {
                defaultValue: "Match only at or above this similarity score.",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemanticKeywordMatching;
export { DEFAULT_MATCH_THRESHOLD };
