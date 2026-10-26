"use client";

import { useState } from "react";
import i18n from "@/lib/i18n";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import type { InvestigationInput } from "../investigationSchema";
import type { ScopeOptions } from "../useMatchingActivity";

import { MetadataFilters } from "./MetadataFilters";

const selectClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export function ScopeFields({ names, agentsLoading, agentsError, retryAgents, attributes, keys }: ScopeOptions) {
  const { control, register, setValue } = useFormContext<InvestigationInput>();
  const selection = useWatch({ control, name: "selection" });
  const filters = selection.filters ?? [];
  const hasOptionalScope = !!selection.team_id || !!selection.service;
  const showAdvancedByDefault = !!selection.filters.length || hasOptionalScope || selection.source !== "traces";
  const [advanced, setAdvanced] = useState(showAdvancedByDefault);
  const nameFieldName = selection.source === "requests" ? "selection.service" : "selection.agent_name";
  const selectedName = selection.source === "requests" ? selection.service : selection.agent_name;
  const nameLabel =
    selection.source === "requests"
      ? i18n.t("lens.scopeFields.modelGroupOptional", { defaultValue: "Model group (optional)" })
      : i18n.t("lens.scopeFields.agentOptional", { defaultValue: "Agent (optional)" });
  return (
    <>
      <label className="grid gap-2 text-sm font-medium">
        {nameLabel}
        <Controller
          control={control}
          name={nameFieldName}
          render={({ field }) => (
            <Combobox
              items={names}
              value={field.value || null}
              inputValue={field.value ?? ""}
              onInputValueChange={field.onChange}
              onValueChange={(name) => field.onChange(name ?? "")}
            >
              <ComboboxInput
                aria-label={nameLabel}
                placeholder={
                  selection.source === "requests"
                    ? i18n.t("lens.scopeFields.allModelGroups", { defaultValue: "All model groups" })
                    : i18n.t("lens.scopeFields.allAgentsAndActivity", { defaultValue: "All agents and activity" })
                }
                showClear={!!selectedName}
                className="w-full h-9"
              />
              <ComboboxContent>
                <ComboboxEmpty>
                  {
                    agentsLoading
                      ? i18n.t("lens.scopeFields.loadingAgents", { defaultValue: "Loading agents…" })
                      : i18n.t("lens.scopeFields.noMatchesHint", { defaultValue: "No matches. You can enter a recorded name." })
                  }
                </ComboboxEmpty>
                <ComboboxList>
                  {(name: string) => (
                    <ComboboxItem key={name} value={name}>
                      {name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )}
        />
      </label>
      {selection.source !== "requests" && agentsError && (
        <p role="alert" className="text-sm text-destructive">
          {i18n.t("' + NS + '.couldNotLoadAgents", { defaultValue: "Could not load agents." })}{" "}
          <button type="button" className="underline" onClick={retryAgents}>
            {i18n.t("common.retry", { defaultValue: "Retry" })}
          </button>
        </p>
      )}
      <details open={advanced} onToggle={(event) => setAdvanced(event.currentTarget.open)} className="group">
        <summary className="cursor-pointer text-sm font-medium">
          {i18n.t("' + NS + '.advancedFilters", { defaultValue: "Advanced filters" })}
          {filters.length ? ` (${filters.length})` : ""}
        </summary>
        <div className="mt-4 space-y-4">
          {selection.source !== "requests" && (
            <label className="grid gap-2 text-sm">
              {i18n.t("' + NS + '.applicationOptional", { defaultValue: "Application (optional)" })}
              <Input
                {...register("selection.service")}
                placeholder={i18n.t("' + NS + '.allApplications", { defaultValue: "All applications" })}
              />
            </label>
          )}
          <label className="grid gap-2 text-sm">
            {i18n.t("' + NS + '.activityType", { defaultValue: "Activity type" })}
            <select
              {...register("selection.source", {
                onChange: () => {
                  setValue("selection.service", "");
                  setValue("selection.agent_name", "");
                  setValue("selection.filters", []);
                },
              })}
              className={selectClass}
            >
              <option value="traces">{i18n.t("lens.scopeFields.agentTraces", { defaultValue: "Agent traces" })}</option>
              <option value="requests">{i18n.t("lens.scopeFields.llmRequests", { defaultValue: "LLM requests" })}</option>
              <option value="both">{i18n.t("lens.scopeFields.tracesAndRequests", { defaultValue: "Traces and LLM requests" })}</option>
            </select>
          </label>
          <p className="text-xs leading-5 text-muted-foreground">
            {i18n.t("' + NS + '.matchHint", {
              defaultValue: "Match any recorded metadata, such as a user ID, environment, or tag. All conditions must match.",
            })}
          </p>
          <MetadataFilters attributes={attributes} keys={keys} />
          <label className="grid gap-2 text-sm">
            {i18n.t("' + NS + '.teamIdOptional", { defaultValue: "Team ID (optional)" })}
            <Input
              {...register("selection.team_id")}
              placeholder={i18n.t("' + NS + '.allAccessibleTeams", { defaultValue: "All accessible teams" })}
            />
          </label>
        </div>
      </details>
    </>
  );
}
