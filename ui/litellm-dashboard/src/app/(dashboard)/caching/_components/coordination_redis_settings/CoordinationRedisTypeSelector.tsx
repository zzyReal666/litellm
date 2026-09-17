import React from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COORDINATION_REDIS_TYPES,
  COORDINATION_REDIS_TYPE_DESCRIPTIONS,
  COORDINATION_REDIS_TYPE_LABEL_KEYS,
  COORDINATION_REDIS_TYPE_LABELS,
  CoordinationRedisType,
} from "./coordinationRedisFields";

interface CoordinationRedisTypeSelectorProps {
  redisType: CoordinationRedisType;
  onTypeChange: (type: CoordinationRedisType) => void;
}

const CoordinationRedisTypeSelector: React.FC<CoordinationRedisTypeSelectorProps> = ({ redisType, onTypeChange }) => {
  const { t } = useTranslation();
  const typeLabel = (type: CoordinationRedisType) =>
    t(COORDINATION_REDIS_TYPE_LABEL_KEYS[type], { defaultValue: COORDINATION_REDIS_TYPE_LABELS[type] });

  return (
    <div className="space-y-2">
      <label htmlFor="coordination-redis-type" className="text-sm font-medium">
        {t("cacheSettings.redisTypeSelector.redisType", { defaultValue: "Redis Type" })}
      </label>
      <Select value={redisType} onValueChange={(value) => value !== null && onTypeChange(value)}>
        <SelectTrigger id="coordination-redis-type" className="w-full">
          <SelectValue>{typeLabel(redisType)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COORDINATION_REDIS_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {typeLabel(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{COORDINATION_REDIS_TYPE_DESCRIPTIONS[redisType]}</p>
    </div>
  );
};

export default CoordinationRedisTypeSelector;
