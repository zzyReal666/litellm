import React from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RedisTypeSelectorProps {
  redisType: string;
  redisTypeDescriptions: Readonly<Record<string, string>>;
  onTypeChange: (type: string) => void;
}

const REDIS_TYPE_LABELS: Readonly<Record<string, string>> = {
  node: "Node (Single Instance)",
  cluster: "Cluster",
  sentinel: "Sentinel",
  semantic: "Semantic",
};

const REDIS_TYPE_LABEL_KEYS: Readonly<Record<string, string>> = {
  node: "cacheSettings.redisTypeSelector.nodeType",
  cluster: "cacheSettings.redisTypeSelector.clusterType",
  sentinel: "cacheSettings.redisTypeSelector.sentinelType",
  semantic: "cacheSettings.redisTypeSelector.semanticType",
};

const RedisTypeSelector: React.FC<RedisTypeSelectorProps> = ({ redisType, redisTypeDescriptions, onTypeChange }) => {
  const { t } = useTranslation();
  const typeLabel = (type: string) =>
    t(REDIS_TYPE_LABEL_KEYS[type] ?? type, { defaultValue: REDIS_TYPE_LABELS[type] ?? type });

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t("cacheSettings.redisTypeSelector.redisType", { defaultValue: "Redis Type" })}
      </label>
      <Select value={redisType} onValueChange={(value) => value !== null && onTypeChange(value)}>
        <SelectTrigger className="w-full">
          <SelectValue>{typeLabel(redisType)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(REDIS_TYPE_LABELS).map(([value]) => (
            <SelectItem key={value} value={value}>
              {typeLabel(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {redisTypeDescriptions[redisType] ||
          t("cacheSettings.redisTypeSelector.selectTypeDescription", {
            defaultValue: "Select the type of Redis deployment you're using",
          })}
      </p>
    </div>
  );
};

export default RedisTypeSelector;
