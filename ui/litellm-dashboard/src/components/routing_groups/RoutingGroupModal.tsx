"use client";

import React, { useEffect, useMemo } from "react";
import { useWatch } from "react-hook-form";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/lib/forms/useZodForm";
import {
  GROUP_NAME_MAX_LENGTH,
  STRATEGIES_WITH_ARGS,
  argsForStrategy,
  buildRoutingGroupPayload,
  toRoutingGroupFormValues,
} from "./routingGroupPayload";
import type { RoutingGroup } from "./types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RoutingGroupModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValue: RoutingGroup | null;
  availableStrategies: string[];
  strategyDescriptions: Record<string, string>;
  modelOptions: string[];
  existingGroupNames: string[];
  onClose: () => void;
  onSubmit: (group: RoutingGroup) => Promise<void> | void;
  saving?: boolean;
}

const argsExampleDescription = (t: TFunction, strategy: string): string =>
  strategy === "latency-based-routing"
    ? t("routingGroups.routingGroupModal.strategyArgsExampleLatency", {
        defaultValue: `Example: { "ttl": 3600, "lowest_latency_buffer": 0 }`,
      })
    : t("routingGroups.routingGroupModal.strategyArgsExampleUsage", { defaultValue: `Example: { "ttl": 60 }` });

const RoutingGroupModal: React.FC<RoutingGroupModalProps> = ({
  open,
  mode,
  initialValue,
  availableStrategies,
  strategyDescriptions,
  modelOptions,
  existingGroupNames,
  onClose,
  onSubmit,
  saving,
}) => {
  const { t } = useTranslation();
  const modelsAnchor = useComboboxAnchor();
  const strategyItems = availableStrategies.map((strategy) => ({ label: strategy, value: strategy }));

  const reservedNames = useMemo(() => {
    const others = existingGroupNames.filter((n) => n !== initialValue?.group_name);
    return new Set(others.map((n) => n.toLowerCase()));
  }, [existingGroupNames, initialValue]);

  const schema = useMemo(() => {
    const shape = {
      group_name: z
        .string()
        .trim()
        .min(1, t("routingGroups.routingGroupModal.groupNameRequired", { defaultValue: "Group name is required" }))
        .max(
          GROUP_NAME_MAX_LENGTH,
          t("routingGroups.routingGroupModal.groupNameMaxLength", {
            max: GROUP_NAME_MAX_LENGTH,
            defaultValue: "Must be {{max}} characters or fewer",
          }),
        )
        .refine(
          (value) => !reservedNames.has(value.toLowerCase()),
          t("routingGroups.routingGroupModal.groupNameExists", {
            defaultValue: "A group with this name already exists",
          }),
        ),
      models: z
        .array(z.string())
        .min(1, t("routingGroups.routingGroupModal.modelsRequired", { defaultValue: "Select at least one model" })),
      routing_strategy: z
        .string()
        .min(1, t("routingGroups.routingGroupModal.routingStrategyRequired", { defaultValue: "Strategy is required" })),
      routing_strategy_args: z.string(),
    };
    return z.object(shape);
  }, [reservedNames, t]);

  const form = useZodForm(schema, { defaultValues: toRoutingGroupFormValues(initialValue, availableStrategies) });

  useEffect(() => {
    form.reset(toRoutingGroupFormValues(initialValue, availableStrategies));
  }, [open, initialValue, availableStrategies, form]);

  const selectedStrategy = useWatch({ control: form.control, name: "routing_strategy" });

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    const payload = buildRoutingGroupPayload(values);
    if (!payload.ok) {
      form.setError("routing_strategy_args", {
        message: t("routingGroups.routingGroupModal.strategyArgsMustBeJson", { defaultValue: payload.argsError }),
      });
      return;
    }
    await onSubmit(payload.group);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("routingGroups.routingGroupModal.titleCreate", { defaultValue: "Create Routing Group" })
              : t("routingGroups.routingGroupModal.titleEdit", {
                  groupName: initialValue?.group_name ?? "",
                  defaultValue: "Edit {{groupName}}",
                })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <FieldGroup>
            <FormField
              control={form.control}
              name="group_name"
              label={t("routingGroups.routingGroupModal.groupNameLabel", { defaultValue: "Group Name" })}
              description={t("routingGroups.routingGroupModal.groupNameExtra", {
                defaultValue:
                  "Use this name as the model in API calls — LiteLLM routes the request to one of the group's models.",
              })}
            >
              {({ ref, ...field }) => (
                <Input
                  {...field}
                  ref={ref}
                  placeholder={t("routingGroups.routingGroupModal.groupNamePlaceholder", { defaultValue: "fast-chat" })}
                  disabled={mode === "edit"}
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="models"
              label={t("routingGroups.routingGroupModal.modelsLabel", { defaultValue: "Models" })}
              description={t("routingGroups.routingGroupModal.modelsExtra", {
                defaultValue: "Models from your model list that this group routes between.",
              })}
            >
              {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                <Combobox multiple items={modelOptions} value={value} onValueChange={onChange}>
                  <ComboboxChips render={<div ref={modelsAnchor} />}>
                    <ComboboxValue>
                      {(selected: string[]) => (
                        <>
                          {selected.map((model) => (
                            <ComboboxChip key={model} aria-label={model}>
                              {model}
                            </ComboboxChip>
                          ))}
                          <ComboboxChipsInput
                            id={id}
                            aria-invalid={ariaInvalid}
                            aria-describedby={ariaDescribedBy}
                            placeholder={t("routingGroups.routingGroupModal.modelsPlaceholder", {
                              defaultValue: "Select models",
                            })}
                          />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={modelsAnchor}>
                    <ComboboxEmpty>
                      {t("viewLogs.filterOptions.noModelsFoundLabel", { defaultValue: "No models found" })}
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(model: string) => (
                        <ComboboxItem key={model} value={model}>
                          {model}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            </FormField>

            <FormField
              control={form.control}
              name="routing_strategy"
              label={t("routingGroups.routingGroupModal.routingStrategyLabel", { defaultValue: "Routing Strategy" })}
              description={strategyDescriptions[selectedStrategy]}
            >
              {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                <Select
                  items={strategyItems}
                  value={value}
                  onValueChange={(next: string | null) => {
                    onChange(next ?? "");
                    form.setValue(
                      "routing_strategy_args",
                      argsForStrategy(next ?? "", form.getValues("routing_strategy_args")),
                    );
                  }}
                >
                  <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
                    <SelectValue
                      placeholder={t("routingGroups.routingGroupModal.strategyPlaceholder", {
                        defaultValue: "Select strategy",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStrategies.map((strategy) => (
                      <SelectItem key={strategy} value={strategy}>
                        {strategy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            {STRATEGIES_WITH_ARGS.has(selectedStrategy) && (
              <FormField
                control={form.control}
                name="routing_strategy_args"
                label={t("routingGroups.routingGroupModal.strategyArgsLabel", {
                  defaultValue: "Strategy Arguments (JSON)",
                })}
                description={argsExampleDescription(t, selectedStrategy)}
              >
                {({ ref, ...field }) => (
                  <Textarea
                    {...field}
                    ref={ref}
                    rows={4}
                    placeholder={t("routingGroups.routingGroupModal.strategyArgsPlaceholder", {
                      defaultValue: `{ "ttl": 3600 }`,
                    })}
                    className="font-mono text-xs"
                  />
                )}
              </FormField>
            )}

            <p className="text-xs text-muted-foreground">
              {t("routingGroups.routingGroupModal.fallbackNote", {
                defaultValue:
                  "Models not claimed by an explicit group fall through to the proxy's top-level routing strategy.",
              })}
            </p>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={() => void form.handleSubmit(handleSubmit)()} disabled={saving} aria-busy={saving}>
            {mode === "create"
              ? t("routingGroups.routingGroupModal.okTextCreate", { defaultValue: "Create Group" })
              : t("routingGroups.routingGroupModal.okTextEdit", { defaultValue: "Save Changes" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoutingGroupModal;
