import React from "react";
import i18n from "@/lib/i18n";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KeyValuePair } from "./key_value_input";

interface QueryParamInputProps {
  value?: readonly KeyValuePair[];
  onChange?: (value: readonly KeyValuePair[]) => void;
}

const QueryParamInput: React.FC<QueryParamInputProps> = ({ value = [], onChange }) => {
  const handleAdd = () => onChange?.([...value, ["", ""]]);

  const handleRemove = (index: number) => onChange?.(value.filter((_, i) => i !== index));

  const handleChange = (index: number, pair: KeyValuePair) =>
    onChange?.(value.map((existing, i) => (i === index ? pair : existing)));

  return (
    <div className="space-y-2">
      {value.map(([key, val], index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder={i18n.t("queryParamInput.parameter-name-e-g-version", { defaultValue: "Parameter Name (e.g., version)" })}
            value={key}
            onChange={(e) => handleChange(index, [e.target.value, val])}
          />
          <Input
            placeholder={i18n.t("queryParamInput.parameter-value-e-g-v1", { defaultValue: "Parameter Value (e.g., v1)" })}
            value={val}
            onChange={(e) => handleChange(index, [key, e.target.value])}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleRemove(index)}
            aria-label={`Remove query parameter ${index + 1}`}
          >
            <Minus />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={handleAdd}>
        <Plus />
        {i18n.t("queryParamInput.add-query-parameter", { defaultValue: "Add Query Parameter" })}</Button>
    </div>
  );
};

export default QueryParamInput;
