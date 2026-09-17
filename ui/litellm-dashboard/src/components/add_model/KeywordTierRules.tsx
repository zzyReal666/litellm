import { Inbox, Info, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React from "react";

import { emptyKeywordTierRuleIndexes } from "./complexity_router_keywords";
import { tierOptions, translatedDefaultTierLabel } from "./complexity_router_tiers";

export type ComplexityTier = "NON_REASONING" | "SIMPLE" | "MEDIUM" | "COMPLEX" | "REASONING";

export interface KeywordTierRule {
  id: string;
  keywords: string[];
  /** A built-in tier name, or with a custom tier set, one of the defined tier names. */
  tier: string;
}

interface KeywordTierRulesProps {
  rules: KeywordTierRule[];
  onChange: (rules: KeywordTierRule[]) => void;
  tierLabels?: Partial<Record<ComplexityTier, string>>;
  tierNames?: string[];
}

// A row exists only because the caller asked for it, so it reports its own gap straight away
// rather than waiting for a submit; the submit button is disabled while one is outstanding, so
// there is no failed attempt left to surface it.
const KeywordTierRules: React.FC<KeywordTierRulesProps> = ({ rules, onChange, tierLabels, tierNames }) => {
  const { t } = useTranslation();
  const emptyRuleIndexes = new Set(emptyKeywordTierRuleIndexes(rules));
  const options = tierOptions(tierLabels, tierNames).map((option) => ({
    value: option.value,
    label: translatedDefaultTierLabel(option.value, option.label, t),
  }));

  const replaceKeywords = (rule: KeywordTierRule) => (keywords: string[]) => {
    updateRule(rule.id, { keywords });
  };

  const addRule = () => {
    onChange([...rules, { id: `${Date.now()}`, keywords: [], tier: tierNames?.[0] ?? "COMPLEX" }]);
  };

  const updateRule = (id: string, updates: Partial<Omit<KeywordTierRule, "id">>) => {
    onChange(rules.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule)));
  };

  const removeRule = (id: string) => {
    onChange(rules.filter((rule) => rule.id !== id));
  };

  return (
    <div className="w-full max-w-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="m-0 text-xl font-semibold text-foreground">
            {t("addModel.keywordTierRules.title", { defaultValue: "Keyword Tier Overrides" })}
          </h4>
          <SimpleTooltip
            content={t("addModel.keywordTierRules.tooltip", {
              defaultValue:
                "Match known terms and force the request straight to a chosen complexity tier, bypassing rule-based scoring.",
            })}
          >
            <Info className="size-4 text-muted-foreground" />
          </SimpleTooltip>
        </div>
        <Button variant="outline" onClick={addRule}>
          <Plus />
          {t("addModel.keywordTierRules.addRuleButton", { defaultValue: "Add keyword rule" })}
        </Button>
      </div>
      <span className="mb-4 block text-muted-foreground">
        {t("addModel.keywordTierRules.description", {
          defaultValue:
            'Optional: route requests containing specific keywords directly to a tier, e.g. route "invoice, refund, billing" to the medium tier.',
        })}
      </span>

      {rules.length === 0 ? (
        <Card className="bg-muted">
          <CardContent>
            <div className="py-2 text-center">
              <Inbox className="mx-auto mb-2 size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {t("addModel.keywordTierRules.emptyTitle", { defaultValue: "No keyword tier overrides configured" })}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map((rule, index) => (
            <Card key={rule.id} size="sm">
              <CardContent>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <strong className="mb-2 block font-semibold">
                      {t("addModel.keywordTierRules.ruleKeywordsLabel", {
                        defaultValue: "Keywords {{index}}",
                        index: index + 1,
                      })}
                    </strong>
                    <MultiSelect
                      options={rule.keywords.map((keyword) => ({ label: keyword, value: keyword }))}
                      value={rule.keywords}
                      onValueChange={replaceKeywords(rule)}
                      placeholder="e.g., invoice, refund, billing"
                      emptyText={t("addModel.keywordTierRules.emptyText", { defaultValue: "Type to add a keyword" })}
                      allowCustomValues
                      className={emptyRuleIndexes.has(index) ? "w-full border-destructive" : "w-full"}
                    />
                    {emptyRuleIndexes.has(index) && (
                      <span className="text-xs text-destructive">
                        {t("addModel.keywordTierRules.keywordRequired", {
                          defaultValue: "At least one keyword is required",
                        })}
                      </span>
                    )}
                  </div>
                  <div style={{ width: 220 }}>
                    <strong className="mb-2 block font-semibold">
                      {t("addModel.keywordTierRules.routeToTierLabel", { defaultValue: "Route to tier" })}
                    </strong>
                    <Select
                      items={options}
                      value={rule.tier}
                      onValueChange={(tier: string | null) => tier && updateRule(rule.id, { tier })}
                    >
                      <SelectTrigger
                        aria-label={t("addModel.keywordTierRules.routeAriaLabel", {
                          defaultValue: "Route keyword rule {{index}} to tier",
                          index: index + 1,
                        })}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/80"
                    aria-label={t("addModel.keywordTierRules.removeAriaLabel", {
                      defaultValue: "Remove keyword rule {{index}}",
                      index: index + 1,
                    })}
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeywordTierRules;
