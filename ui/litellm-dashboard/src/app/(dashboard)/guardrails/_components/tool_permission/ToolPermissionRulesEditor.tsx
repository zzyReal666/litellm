import React from "react";
import type { TFunction } from "i18next";
import { Info, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ToolPermissionDecision = "allow" | "deny";
export type ToolPermissionDefaultAction = "allow" | "deny";
export type ToolPermissionOnDisallowedAction = "block" | "rewrite";

export interface ToolPermissionRuleConfig {
  id: string;
  tool_name?: string;
  tool_type?: string;
  decision: ToolPermissionDecision;
  allowed_param_patterns?: Record<string, string>;
}

export interface ToolPermissionConfig {
  rules: ToolPermissionRuleConfig[];
  default_action: ToolPermissionDefaultAction;
  on_disallowed_action: ToolPermissionOnDisallowedAction;
  violation_message_template?: string;
}

interface ToolPermissionRulesEditorProps {
  value?: ToolPermissionConfig;
  onChange?: (config: ToolPermissionConfig) => void;
  disabled?: boolean;
}

const getDecisionItems = (t: TFunction) => [
  { value: "allow", label: t("guardrails.toolPermissionRulesEditor.allow", { defaultValue: "Allow" }) },
  { value: "deny", label: t("guardrails.toolPermissionRulesEditor.deny", { defaultValue: "Deny" }) },
];

const getOnDisallowedItems = (t: TFunction) => [
  { value: "block", label: t("guardrails.toolPermissionRulesEditor.block", { defaultValue: "Block" }) },
  { value: "rewrite", label: t("guardrails.toolPermissionRulesEditor.rewrite", { defaultValue: "Rewrite" }) },
];

const DEFAULT_CONFIG: ToolPermissionConfig = {
  rules: [],
  default_action: "deny",
  on_disallowed_action: "block",
  violation_message_template: "",
};

const ensureConfig = (config?: ToolPermissionConfig): ToolPermissionConfig => ({
  ...DEFAULT_CONFIG,
  ...(config || {}),
  rules: config?.rules ? [...config.rules] : [],
});

const ToolPermissionRulesEditor: React.FC<ToolPermissionRulesEditorProps> = ({ value, onChange, disabled = false }) => {
  const { t } = useTranslation();
  const decisionItems = getDecisionItems(t);
  const onDisallowedItems = getOnDisallowedItems(t);
  const config = ensureConfig(value);

  const updateConfig = (partial: Partial<ToolPermissionConfig>) => {
    const nextConfig: ToolPermissionConfig = {
      ...config,
      ...partial,
    };
    onChange?.(nextConfig);
  };

  const updateRule = (ruleIndex: number, updates: Partial<ToolPermissionRuleConfig>) => {
    const nextRules = config.rules.map((rule, index) => (index === ruleIndex ? { ...rule, ...updates } : rule));
    updateConfig({ rules: nextRules });
  };

  const addRule = () => {
    const nextRules = [
      ...config.rules,
      {
        id: `rule_${Math.random().toString(36).slice(2, 8)}`,
        decision: "allow" as ToolPermissionDecision,
        allowed_param_patterns: undefined,
      },
    ];
    updateConfig({ rules: nextRules });
  };

  const removeRule = (ruleIndex: number) => {
    const nextRules = config.rules.filter((_, index) => index !== ruleIndex);
    updateConfig({ rules: nextRules });
  };

  const updateAllowedParamEntries = (ruleIndex: number, mutate: (entries: [string, string][]) => void) => {
    const targetRule = config.rules[ruleIndex];
    if (!targetRule) {
      return;
    }
    const entries = Object.entries(targetRule.allowed_param_patterns || {});
    mutate(entries);
    const updatedObject: Record<string, string> = {};
    entries.forEach(([key, value]) => {
      updatedObject[key] = value;
    });
    updateRule(ruleIndex, {
      allowed_param_patterns: Object.keys(updatedObject).length > 0 ? updatedObject : undefined,
    });
  };

  const updateAllowedParamPath = (ruleIndex: number, entryIndex: number, nextPath: string) => {
    updateAllowedParamEntries(ruleIndex, (entries) => {
      if (!entries[entryIndex]) {
        return;
      }
      const [, value] = entries[entryIndex];
      entries[entryIndex] = [nextPath, value];
    });
  };

  const updateAllowedParamPattern = (ruleIndex: number, entryIndex: number, pattern: string) => {
    updateAllowedParamEntries(ruleIndex, (entries) => {
      if (!entries[entryIndex]) {
        return;
      }
      const [path] = entries[entryIndex];
      entries[entryIndex] = [path, pattern];
    });
  };

  const renderAllowedParamPatterns = (rule: ToolPermissionRuleConfig, index: number) => {
    const entries = Object.entries(rule.allowed_param_patterns || {});
    if (entries.length === 0) {
      return (
        <Button
          variant="outline"
          disabled={disabled}
          size="sm"
          onClick={() => updateRule(index, { allowed_param_patterns: { "": "" } })}
        >
          {t("guardrails.toolPermissionRulesEditor.restrictArgs", {
            defaultValue: "+ Restrict tool arguments (optional)",
          })}
        </Button>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("guardrails.toolPermissionRulesEditor.argConstraints", {
            defaultValue: "Argument constraints (dot or array paths)",
          })}
        </p>
        {entries.map(([path, pattern], patternIndex) => (
          <div key={`${rule.id || index}-${patternIndex}`} className="flex items-start gap-2">
            <Input
              disabled={disabled}
              placeholder="messages[0].content"
              value={path}
              onChange={(e) => updateAllowedParamPath(index, patternIndex, e.target.value)}
            />
            <Input
              disabled={disabled}
              placeholder="^email@.*$"
              value={pattern}
              onChange={(e) => updateAllowedParamPattern(index, patternIndex, e.target.value)}
            />
            <Button
              variant="outline"
              size="icon"
              aria-label={t("guardrails.toolPermissionRulesEditor.removeConstraint", {
                defaultValue: "Remove constraint",
              })}
              disabled={disabled}
              onClick={() =>
                updateAllowedParamEntries(index, (entries) => {
                  entries.splice(patternIndex, 1);
                })
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          disabled={disabled}
          size="sm"
          onClick={() =>
            updateRule(index, {
              allowed_param_patterns: {
                ...(rule.allowed_param_patterns || {}),
                "": "",
              },
            })
          }
        >
          {t("guardrails.toolPermissionRulesEditor.addConstraint", { defaultValue: "+ Add another constraint" })}
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">
              {t("guardrails.toolPermissionRulesEditor.title", { defaultValue: "LiteLLM Tool Permission Guardrail" })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("guardrails.toolPermissionRulesEditor.subtitle", {
                defaultValue:
                  "Provide regex patterns (e.g., ^mcp__github_.*$) for tool names or types and optionally constrain payload fields.",
              })}
            </p>
          </div>
          {!disabled && (
            <Button onClick={addRule}>
              <Plus />
              {t("guardrails.toolPermissionRulesEditor.addRule", { defaultValue: "Add Rule" })}
            </Button>
          )}
        </div>

        <Separator className="my-4" />

        {config.rules.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            {t("guardrails.toolPermissionRulesEditor.noRules", { defaultValue: "No tool rules added yet" })}
          </div>
        ) : (
          <div className="space-y-4">
            {config.rules.map((rule, index) => (
              <Card key={rule.id || index} className="bg-muted/40">
                <CardContent>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold">
                      {t("guardrails.toolPermissionRulesEditor.ruleLabel", {
                        index: index + 1,
                        defaultValue: "Rule {{index}}",
                      })}
                    </p>
                    <Button variant="ghost" disabled={disabled} onClick={() => removeRule(index)}>
                      <Trash2 />
                      {t("common.remove", { defaultValue: "Remove" })}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">
                        {t("guardrails.toolPermissionRulesEditor.ruleId", { defaultValue: "Rule ID" })}
                      </p>
                      <Input
                        disabled={disabled}
                        placeholder="unique_rule_id"
                        value={rule.id}
                        onChange={(e) => updateRule(index, { id: e.target.value })}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {t("guardrails.toolPermissionRulesEditor.toolName", { defaultValue: "Tool Name (optional)" })}
                      </p>
                      <Input
                        disabled={disabled}
                        placeholder="^mcp__github_.*$"
                        value={rule.tool_name ?? ""}
                        onChange={(e) =>
                          updateRule(index, {
                            tool_name: e.target.value.trim() === "" ? undefined : e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">
                        {t("guardrails.toolPermissionRulesEditor.toolType", { defaultValue: "Tool Type (optional)" })}
                      </p>
                      <Input
                        disabled={disabled}
                        placeholder="^function$"
                        value={rule.tool_type ?? ""}
                        onChange={(e) =>
                          updateRule(index, {
                            tool_type: e.target.value.trim() === "" ? undefined : e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-sm font-medium">
                      {t("guardrails.toolPermissionRulesEditor.decision", { defaultValue: "Decision" })}
                    </p>
                    <Select
                      items={decisionItems}
                      disabled={disabled}
                      value={rule.decision}
                      onValueChange={(value: string | null) =>
                        value && updateRule(index, { decision: value as ToolPermissionDecision })
                      }
                    >
                      <SelectTrigger
                        className="w-[200px]"
                        aria-label={t("guardrails.toolPermissionRulesEditor.decision", { defaultValue: "Decision" })}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {decisionItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4">{renderAllowedParamPatterns(rule, index)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Separator className="my-4" />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium">
              {t("guardrails.toolPermissionRulesEditor.defaultAction", { defaultValue: "Default action" })}
            </p>
            <Select
              items={decisionItems}
              disabled={disabled}
              value={config.default_action}
              onValueChange={(value: string | null) =>
                value && updateConfig({ default_action: value as ToolPermissionDefaultAction })
              }
            >
              <SelectTrigger
                className="w-full"
                aria-label={t("guardrails.toolPermissionRulesEditor.defaultAction", { defaultValue: "Default action" })}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {decisionItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-medium">
              {t("guardrails.toolPermissionRulesEditor.onDisallowedAction", { defaultValue: "On disallowed action" })}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="cursor-help text-muted-foreground">
                      <Info className="size-3.5" />
                    </span>
                  }
                />
                <TooltipContent>
                  {t("guardrails.toolPermissionRulesEditor.onDisallowedTooltip", {
                    defaultValue:
                      "Block returns an error when a forbidden tool is invoked. Rewrite strips the tool call but lets the rest of the response continue.",
                  })}
                </TooltipContent>
              </Tooltip>
            </p>
            <Select
              items={onDisallowedItems}
              disabled={disabled}
              value={config.on_disallowed_action}
              onValueChange={(value: string | null) =>
                value && updateConfig({ on_disallowed_action: value as ToolPermissionOnDisallowedAction })
              }
            >
              <SelectTrigger
                className="w-full"
                aria-label={t("guardrails.toolPermissionRulesEditor.onDisallowedAction", {
                  defaultValue: "On disallowed action",
                })}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {onDisallowedItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium">
            {t("guardrails.toolPermissionRulesEditor.violationMessage", {
              defaultValue: "Violation message (optional)",
            })}
          </p>
          <Textarea
            className="field-sizing-fixed"
            disabled={disabled}
            rows={3}
            placeholder={t("guardrails.toolPermissionRulesEditor.violationMessagePlaceholder", {
              defaultValue: "This violates our org policy...",
            })}
            value={config.violation_message_template}
            onChange={(e) => updateConfig({ violation_message_template: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolPermissionRulesEditor;
