"use client";

import React, { useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { useInfiniteKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useInfiniteUsers } from "@/app/(dashboard)/hooks/users/useUsers";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import {
  useAutoRouters,
  usePlainChatModelDeployments,
  usePlainChatModelGroups,
  usePlainModelGroups,
} from "@/app/(dashboard)/hooks/models/useModels";
import { buildModelAvailability, deploymentRefsFromModelInfo, resolveAvailableModels } from "@/lib/autorouter_presets";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { PaginatedMultiSelect } from "@/components/shared/PaginatedMultiSelect";
import TeamMultiSelect from "@/components/common_components/team_multi_select";
import { userOptionLabel } from "@/components/common_components/UserDropdown";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useStartShadowEval, type ShadowEvalJob } from "./useShadowEval";

type ShadowEvalDirection = ShadowEvalJob["direction"];

const MAX_ROUTERS = 4;
const MAX_MODELS = 100;
const RECOMMENDED_JUDGE_MODELS = ["anthropic/claude-sonnet-5", "openai/gpt-4o", "gemini/gemini-2.5-pro"] as const;

const DIRECTION_OPTIONS: readonly { value: ShadowEvalDirection; label: string; labelKey: string }[] = [
  {
    value: "forward",
    label: "Adoption check: key's traffic vs the router",
    labelKey: "costOptimization.shadowEvalStartForm.directionForward",
  },
  {
    value: "reverse",
    label: "Regression check: router's picks vs a baseline",
    labelKey: "costOptimization.shadowEvalStartForm.directionReverse",
  },
] as const;

const START_FORM_DESCRIPTION: Record<ShadowEvalDirection, string> = {
  forward:
    "Duplicates a sampled slice of the selected targets' traffic (keys, teams, or users) through the auto-router and has an LLM judge compare both answers blind. Each target gets its own spend budget. The router's answers are never served to users; judge calls bill to the sampled traffic's own identity.",
  reverse:
    "Duplicates a sampled slice of the traffic the auto-router already serves against a fixed baseline model and has an LLM judge compare both answers blind. Each target gets its own spend budget. The baseline's answers are never served to users; judge calls bill to the sampled traffic's own identity.",
};

const START_FORM_DESCRIPTION_KEYS: Record<ShadowEvalDirection, string> = {
  forward: "costOptimization.shadowEvalStartForm.descriptionForward",
  reverse: "costOptimization.shadowEvalStartForm.descriptionReverse",
};

const DURATION_OPTIONS = [
  { value: "1", label: "1 day", labelKey: "costOptimization.shadowEvalStartForm.duration1Day" },
  { value: "3", label: "3 days", labelKey: "costOptimization.shadowEvalStartForm.duration3Days" },
  { value: "7", label: "7 days", labelKey: "commonComponents.keyLifecycleSettings.sevenDays" },
  { value: "14", label: "14 days", labelKey: "costOptimization.shadowEvalStartForm.duration14Days" },
  { value: "30", label: "30 days", labelKey: "commonComponents.keyLifecycleSettings.thirtyDays" },
] as const;

const Field: React.FC<{ label: string; htmlFor?: string; className?: string; children: React.ReactNode }> = ({
  label,
  htmlFor,
  className,
  children,
}) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <Label htmlFor={htmlFor} className="text-xs">
      {label}
    </Label>
    {children}
  </div>
);

const KeySelect: React.FC<{ value: string[]; onChange: (tokens: string[]) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteKeys(50, {
    selectedKeyAlias: search || null,
  });
  const options = useMemo<SearchSelectOption[]>(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.keys)
        .map((key) => ({
          label: key.key_alias || key.key_name || key.token,
          value: key.token,
          sublabel: key.token,
        })),
    [data],
  );
  return (
    <PaginatedMultiSelect
      inputId="shadow-eval-key"
      options={options}
      value={value}
      onValueChange={onChange}
      onSearchChange={setSearch}
      onLoadMore={() => void fetchNextPage()}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isPending}
      placeholder={t("costOptimization.shadowEvalStartForm.searchKeysByAlias", {
        defaultValue: "Search keys by alias",
      })}
      emptyText={t("policies.addAttachmentForm.noMatchingKeys", { defaultValue: "No matching keys" })}
      errorText={
        isError
          ? t("costOptimization.shadowEvalStartForm.keysLoadFailed", {
              defaultValue: "Keys could not be loaded. Refresh the page to retry.",
            })
          : undefined
      }
    />
  );
};

const UserSelect: React.FC<{ value: string[]; onChange: (ids: string[]) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteUsers(
    50,
    search || undefined,
  );
  const options = useMemo<SearchSelectOption[]>(
    () =>
      Array.from(
        new Map(
          (data?.pages ?? [])
            .flatMap((page) => page.users)
            .map((user) => [user.user_id, { label: userOptionLabel(user), value: user.user_id }] as const),
        ).values(),
      ),
    [data],
  );
  return (
    <PaginatedMultiSelect
      inputId="shadow-eval-user"
      options={options}
      value={value}
      onValueChange={onChange}
      onSearchChange={setSearch}
      onLoadMore={() => void fetchNextPage()}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isPending}
      placeholder={t("costOptimization.shadowEvalStartForm.searchUsersByEmail", {
        defaultValue: "Search users by email",
      })}
      emptyText={t("costOptimization.shadowEvalStartForm.noMatchingUsers", { defaultValue: "No matching users" })}
      errorText={
        isError
          ? t("costOptimization.shadowEvalStartForm.usersLoadFailed", {
              defaultValue: "Users could not be loaded. Refresh the page to retry.",
            })
          : undefined
      }
    />
  );
};

const RouterField: React.FC<{
  options: SearchSelectOption[];
  routerNames: string[];
  onChange: (names: string[]) => void;
  direction: ShadowEvalDirection;
}> = ({ options, routerNames, onChange, direction }) => {
  const { t } = useTranslation();
  return (
    <Field label={t("costOptimization.shadowEvalStartForm.autoRouters", { defaultValue: "Auto-routers" })}>
      <MultiSelect
        options={options}
        value={routerNames}
        onValueChange={onChange}
        placeholder={t("costOptimization.shadowEvalStartForm.selectUpToRouters", {
          defaultValue: "Select up to 4 auto-routers",
        })}
        emptyText={t("costOptimization.shadowEvalStartForm.noAutoRouters", {
          defaultValue: "No auto-routers configured",
        })}
      />
      {routerNames.length > MAX_ROUTERS && (
        <p className="text-xs text-destructive">
          {t("costOptimization.shadowEvalStartForm.pickAtMostRouters", {
            defaultValue: "Pick at most {{max}} auto-routers",
            max: MAX_ROUTERS,
          })}
        </p>
      )}
      {direction === "reverse" && routerNames.length > 1 && (
        <p className="text-xs text-destructive">
          {t("costOptimization.shadowEvalStartForm.regressionOneRouter", {
            defaultValue: "A regression check compares one router to its baseline",
          })}
        </p>
      )}
      {direction === "forward" && routerNames.length > 1 && (
        <p className="text-xs text-muted-foreground">
          {t("costOptimization.shadowEvalStartForm.sameSampledRequests", {
            defaultValue: "Every router sees the same sampled requests, judged against the same live responses",
          })}
        </p>
      )}
    </Field>
  );
};

interface StartFormValidityInputs {
  accessToken: string | null | undefined;
  apiKeyIds: string[];
  teamIds: string[];
  userIds: string[];
  models: string[];
  routerNames: string[];
  direction: ShadowEvalDirection;
  baselineModel: string | null;
  judgeModel: string | null;
  percentage: string;
  maxBudget: string;
}

const startFormValidity = (inputs: StartFormValidityInputs) => {
  const parsedPct = Number.parseFloat(inputs.percentage);
  const percentageValid = parsedPct >= 0.1 && parsedPct <= 100;
  const parsedMaxBudget = Number.parseFloat(inputs.maxBudget);
  const maxBudgetValid = parsedMaxBudget >= 0.01 && parsedMaxBudget <= 10000;
  const baselinePicked = inputs.direction === "forward" || Boolean(inputs.baselineModel);
  const targetsPicked = inputs.apiKeyIds.length + inputs.teamIds.length + inputs.userIds.length > 0;
  const routerCountValid = inputs.routerNames.length >= 1 && inputs.routerNames.length <= MAX_ROUTERS;
  const routersMatchDirection = inputs.direction === "forward" || inputs.routerNames.length === 1;
  const routersValid = routerCountValid && routersMatchDirection;
  const scopeValid = routersValid && (inputs.direction === "reverse" || inputs.models.length <= MAX_MODELS);
  const modelsPicked = scopeValid && Boolean(inputs.judgeModel) && baselinePicked;
  const filled = targetsPicked && modelsPicked;
  const boundsValid = percentageValid && maxBudgetValid;
  const valid = Boolean(inputs.accessToken) && filled && boundsValid;
  return { parsedPct, parsedMaxBudget, percentageValid, maxBudgetValid, valid };
};

interface StartBodyInputs {
  apiKeyIds: string[];
  teamIds: string[];
  userIds: string[];
  models: string[];
  routerNames: string[];
  direction: ShadowEvalDirection;
  baselineModel: string | null;
  shadowPercentage: number;
  durationDays: number;
  maxBudget: number;
  judgeModel: string;
}

const buildStartBody = (inputs: StartBodyInputs) => ({
  api_key_ids: inputs.apiKeyIds,
  team_ids: inputs.teamIds,
  user_ids: inputs.userIds,
  models: inputs.direction === "forward" ? inputs.models : [],
  router_names: inputs.routerNames,
  direction: inputs.direction,
  ...(inputs.direction === "reverse" ? { baseline_model: inputs.baselineModel ?? undefined } : {}),
  shadow_percentage: inputs.shadowPercentage,
  duration_days: inputs.durationDays,
  max_budget: inputs.maxBudget,
  judge_model: inputs.judgeModel,
});

const optionLabel = (option: { label: string; labelKey: string } | undefined, t: TFunction): string | null =>
  option === undefined ? null : t(option.labelKey, { defaultValue: option.label });

export const StartForm: React.FC = () => {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const [apiKeyIds, setApiKeyIds] = useState<string[]>([]);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [routerNames, setRouterNames] = useState<string[]>([]);
  const [direction, setDirection] = useState<ShadowEvalDirection>("forward");
  const [baselineModel, setBaselineModel] = useState<string | null>(null);
  const [percentage, setPercentage] = useState("10");
  const [durationDays, setDurationDays] = useState("7");
  const [judgeModel, setJudgeModel] = useState<string | null>(null);
  const [maxBudget, setMaxBudget] = useState("10");
  const { data: autoRouters } = useAutoRouters();
  const configuredGroups = usePlainModelGroups();
  const chatGroups = usePlainChatModelGroups();
  const chatDeployments = usePlainChatModelDeployments();
  const modelOptions = useMemo<SearchSelectOption[]>(
    () => [...configuredGroups].toSorted((a, b) => a.localeCompare(b)).map((name) => ({ label: name, value: name })),
    [configuredGroups],
  );
  const chatOptions = useMemo(
    () => modelOptions.filter((option) => chatGroups.has(option.value)),
    [modelOptions, chatGroups],
  );
  const chatAvailability = useMemo(
    () => buildModelAvailability(chatGroups, deploymentRefsFromModelInfo(chatDeployments)),
    [chatDeployments, chatGroups],
  );
  const recommendedJudgeModels = useMemo(
    () => new Set(RECOMMENDED_JUDGE_MODELS.flatMap((model) => resolveAvailableModels(model, chatAvailability))),
    [chatAvailability],
  );
  const judgeOptions = useMemo(
    () =>
      chatOptions.map((option) =>
        recommendedJudgeModels.has(option.value)
          ? {
              ...option,
              sublabel: t("costOptimization.shadowEvalStartForm.recommended", { defaultValue: "Recommended" }),
            }
          : option,
      ),
    [chatOptions, recommendedJudgeModels, t],
  );
  const start = useStartShadowEval();

  const routerOptions = useMemo<SearchSelectOption[]>(() => {
    const names = new Set(
      (autoRouters ?? []).map((deployment) => deployment.model_name).filter((name): name is string => Boolean(name)),
    );
    return [...names].toSorted().map((name) => ({ label: name, value: name }));
  }, [autoRouters]);

  const validityInputs: StartFormValidityInputs = {
    accessToken,
    apiKeyIds,
    teamIds,
    userIds,
    models,
    routerNames,
    direction,
    baselineModel,
    judgeModel,
    percentage,
    maxBudget,
  };
  const { parsedPct, parsedMaxBudget, percentageValid, maxBudgetValid, valid } = startFormValidity(validityInputs);
  const handleStart = () => {
    if (!valid || !judgeModel) return;
    const bodyInputs: StartBodyInputs = {
      apiKeyIds,
      teamIds,
      userIds,
      models,
      routerNames,
      direction,
      baselineModel,
      shadowPercentage: parsedPct,
      durationDays: Number.parseInt(durationDays, 10),
      maxBudget: parsedMaxBudget,
      judgeModel,
    };
    start.mutate(buildStartBody(bodyInputs));
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          {t("costOptimization.shadowEvalStartForm.title", { defaultValue: "Start a shadow eval" })}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t(START_FORM_DESCRIPTION_KEYS[direction], { defaultValue: START_FORM_DESCRIPTION[direction] })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("costOptimization.shadowEvalStartForm.direction", { defaultValue: "Direction" })}>
            <Select
              value={direction}
              onValueChange={(v: string | null) => setDirection(v === "reverse" ? "reverse" : "forward")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {optionLabel(
                    DIRECTION_OPTIONS.find((o) => o.value === direction),
                    t,
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DIRECTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {optionLabel(option, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label={t("costOptimization.shadowEvalStartForm.keysToShadow", { defaultValue: "Keys to shadow" })}
            htmlFor="shadow-eval-key"
          >
            <KeySelect value={apiKeyIds} onChange={setApiKeyIds} />
          </Field>
          <Field label={t("costOptimization.shadowEvalStartForm.teamsToShadow", { defaultValue: "Teams to shadow" })}>
            <TeamMultiSelect
              value={teamIds}
              onChange={setTeamIds}
              placeholder={t("costOptimization.shadowEvalStartForm.searchTeamsByAlias", {
                defaultValue: "Search teams by alias",
              })}
            />
          </Field>
          <Field
            label={t("costOptimization.shadowEvalStartForm.usersToShadow", { defaultValue: "Users to shadow" })}
            htmlFor="shadow-eval-user"
          >
            <UserSelect value={userIds} onChange={setUserIds} />
          </Field>
          {direction === "forward" && (
            <Field label={t("costOptimization.shadowEvalStartForm.onlyOnModels", { defaultValue: "Only on models" })}>
              <MultiSelect
                options={modelOptions}
                value={models}
                onValueChange={setModels}
                placeholder={t("costOptimization.shadowEvalStartForm.everyModelTargetsUse", {
                  defaultValue: "Every model the targets use",
                })}
                emptyText={t("costOptimization.shadowEvalStartForm.noModelsConfigured", {
                  defaultValue: "No models configured",
                })}
              />
              {models.length > MAX_MODELS ? (
                <p className="text-xs text-destructive">
                  {t("costOptimization.shadowEvalStartForm.pickAtMostModels", {
                    defaultValue: "Pick at most {{max}} models",
                    max: MAX_MODELS,
                  })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("costOptimization.shadowEvalStartForm.narrowsTargets", {
                    defaultValue: "Narrows every target above to requests for these models",
                  })}
                </p>
              )}
            </Field>
          )}
          <RouterField
            options={routerOptions}
            routerNames={routerNames}
            onChange={setRouterNames}
            direction={direction}
          />
          <Field
            label={t("costOptimization.shadowEvalStartForm.trafficSampled", { defaultValue: "Traffic sampled" })}
            htmlFor="shadow-eval-pct"
          >
            <div className="flex items-center gap-2">
              <Input
                id="shadow-eval-pct"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                className="w-24"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">
                {t("costOptimization.shadowEvalStartForm.percentOfTraffic", { defaultValue: "% of traffic" })}
              </span>
            </div>
            <div>
              {percentage.trim() !== "" && !percentageValid && (
                <p className="text-xs text-destructive">
                  {t("costOptimization.shadowEvalStartForm.percentRangeError", {
                    defaultValue: "Enter a value from 0.1 to 100",
                  })}
                </p>
              )}
            </div>
          </Field>
          <Field label={t("viewLogs.logDetailContent.labelDuration", { defaultValue: "Duration" })}>
            <Select value={durationDays} onValueChange={(v: string | null) => setDurationDays(v ?? "7")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {optionLabel(
                    DURATION_OPTIONS.find((o) => o.value === durationDays),
                    t,
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {optionLabel(option, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("costOptimization.shadowEvalStartForm.spendBudget", { defaultValue: "Spend budget" })}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={0.01}
                max={10000}
                step={0.01}
                className="w-24"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">
                {t("costOptimization.shadowEvalStartForm.maxSpendHint", {
                  defaultValue: "max shadow + judge spend, per target",
                })}
              </span>
            </div>
            {maxBudget.trim() !== "" && !maxBudgetValid && (
              <p className="text-xs text-destructive">
                {t("costOptimization.shadowEvalStartForm.budgetRangeError", {
                  defaultValue: "Enter a value from 0.01 to 10000",
                })}
              </p>
            )}
          </Field>
          {direction === "reverse" && (
            <Field label={t("costOptimization.shadowEvalStartForm.baselineModel", { defaultValue: "Baseline model" })}>
              <SearchSelect
                options={chatOptions}
                value={baselineModel}
                onValueChange={setBaselineModel}
                placeholder={t("costOptimization.shadowEvalStartForm.selectBaselineModel", {
                  defaultValue: "Select a baseline model",
                })}
                emptyText={t("costOptimization.shadowEvalStartForm.noChatModels", {
                  defaultValue: "No chat models available",
                })}
              />
            </Field>
          )}
          <Field
            label={t("costOptimization.shadowEvalStartForm.judgeModel", { defaultValue: "Judge model" })}
            className="sm:col-span-2"
          >
            <SearchSelect
              options={judgeOptions}
              value={judgeModel}
              onValueChange={setJudgeModel}
              placeholder={t("guardrails.lLMJudgeFields.judgeModelRequired", {
                defaultValue: "Select a judge model",
              })}
              emptyText={t("costOptimization.shadowEvalStartForm.noChatModels", {
                defaultValue: "No chat models available",
              })}
            />
          </Field>
        </div>
        <Button disabled={!valid || start.isPending} onClick={handleStart}>
          {start.isPending
            ? t("costOptimization.shadowEvalStartForm.starting", { defaultValue: "Starting..." })
            : t("costOptimization.shadowEvalStartForm.startButton", { defaultValue: "Start shadow eval" })}
        </Button>
      </CardContent>
    </Card>
  );
};
