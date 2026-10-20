"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useFieldArray, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useInfiniteTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { ModelSelect, MODEL_SENTINEL_OPTIONS } from "@/components/ModelSelect/ModelSelect";
import { toast } from "@/lib/toast";
import { PaginatedSearchSelect } from "@/components/shared/PaginatedSearchSelect";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import type { SearchSelectOption } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { buildBody, settingsToForm, type DefaultInternalUserParams, type InternalUserSettings } from "./mapper";
import {
  defaultUserSettingsSchema,
  EMPTY_TEAM_ROW,
  type DefaultUserSettingsFormValues,
  type DefaultUserSettingsSubmitValues,
} from "./schema";

const NO_RESET = "never";

const BUDGET_DURATION_OPTIONS = [
  { value: NO_RESET, labelKey: "defaultUserSettingsForm.budgetDuration.noReset", label: "No reset" },
  { value: "1h", labelKey: "defaultUserSettingsForm.budgetDuration.hourly", label: "hourly" },
  { value: "24h", labelKey: "defaultUserSettingsForm.budgetDuration.daily", label: "daily" },
  { value: "7d", labelKey: "defaultUserSettingsForm.budgetDuration.weekly", label: "weekly" },
  { value: "30d", labelKey: "defaultUserSettingsForm.budgetDuration.monthly", label: "monthly" },
] as const;

const TEAM_ROLE_OPTIONS = [
  { value: "user", labelKey: "defaultUserSettings.displayValues.userRoleOption", label: "User" },
  { value: "admin", labelKey: "defaultUserSettings.displayValues.adminRoleOption", label: "Admin" },
] as const;

const MODEL_SENTINEL_LABELS: ReadonlyMap<string, string> = new Map(
  MODEL_SENTINEL_OPTIONS.map(({ value, label }) => [value, label]),
);

const TEAMS_PAGE_SIZE = 50;

const SETTINGS_QUERY_KEY = ["internalUserSettings"] as const;

const defaultFetchSettings = async (): Promise<InternalUserSettings> => {
  const { data } = await fetchClient.GET("/get/internal_user_settings");
  if (data === undefined) {
    throw new Error("Failed to load default user settings");
  }
  return data;
};

const defaultUpdateSettings = async (body: DefaultInternalUserParams): Promise<void> => {
  await fetchClient.PATCH("/update/internal_user_settings", { body });
};

interface RoleOption {
  value: string;
  label: string;
  description: string;
}

type SettingsControl = Control<DefaultUserSettingsFormValues, unknown, DefaultUserSettingsSubmitValues>;

const TeamPickerField = ({ control, index }: { control: SettingsControl; index: number }) => {
  const { t } = useTranslation();
  const [search, setSearch] = React.useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteTeams(
    TEAMS_PAGE_SIZE,
    search === "" ? undefined : search,
  );

  const options = React.useMemo<SearchSelectOption[]>(
    () =>
      (data?.pages ?? []).flatMap((page) =>
        page.teams.map((team) => ({
          label: team.team_alias || team.team_id,
          value: team.team_id,
          sublabel: team.team_id,
        })),
      ),
    [data],
  );

  return (
    <FormField
      control={control}
      name={`teams.${index}.team_id`}
      label={t("createUserButton.teamLabel", { defaultValue: "Team" })}
    >
      {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
        <PaginatedSearchSelect
          options={options}
          value={value}
          onValueChange={onChange}
          onSearchChange={setSearch}
          onLoadMore={() => void fetchNextPage()}
          hasNextPage={hasNextPage}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          placeholder={t("defaultUserSettingsForm.teamPicker.searchPlaceholder", { defaultValue: "Search a team" })}
          emptyText={t("commonComponents.teamDropdown.notFound", { defaultValue: "No teams found" })}
          inputId={id}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        />
      )}
    </FormField>
  );
};

const TeamsField = ({ control }: { control: SettingsControl }) => {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: "teams" });

  return (
    <div className="flex w-full flex-col gap-3">
      <div>
        <p className="text-sm font-medium">
          {t("defaultUserSettingsForm.teamsField.title", { defaultValue: "Default Teams" })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("defaultUserSettingsForm.teamsField.description", {
            defaultValue: "New users are added to these teams. Only teams that already exist can be selected.",
          })}
        </p>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {t("defaultUserSettings.teamEntry.teamLabel", { number: index + 1, defaultValue: "Team {{number}}" })}
            </p>
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
              {t("defaultUserSettings.teamEntry.removeButton", { defaultValue: "Remove" })}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <TeamPickerField control={control} index={index} />

            <FormField
              control={control}
              name={`teams.${index}.max_budget_in_team`}
              label={t("defaultUserSettingsForm.teamEntry.maxBudgetInTeamLabel", {
                defaultValue: "Max Budget in Team (USD)",
              })}
            >
              {({ ref, ...budgetField }) => (
                <Input
                  {...budgetField}
                  ref={ref}
                  type="number"
                  step="any"
                  min={0}
                  placeholder={t("defaultUserSettings.teamEntry.maxBudgetPlaceholder", { defaultValue: "Optional" })}
                />
              )}
            </FormField>

            <FormField
              control={control}
              name={`teams.${index}.user_role`}
              label={t("teamPage.myUserTab.teamRoleLabel", { defaultValue: "Team Role" })}
            >
              {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                <Select
                  items={TEAM_ROLE_OPTIONS}
                  value={value}
                  onValueChange={(selected) => onChange(selected ?? "user")}
                >
                  <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={ariaInvalid}
                    aria-describedby={ariaDescribedBy}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey, { defaultValue: option.label })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={() => append(EMPTY_TEAM_ROW)}>
        {t("defaultUserSettings.teamEntry.addTeamButton", { defaultValue: "Add Team" })}
      </Button>
    </div>
  );
};

const ViewRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-sm font-medium">{label}</p>
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

interface SettingsViewProps {
  values: DefaultUserSettingsFormValues;
  roleOptions: readonly RoleOption[];
}

const SettingsView = ({ values, roleOptions }: SettingsViewProps) => {
  const { t } = useTranslation();
  const roleLabel = roleOptions.find((option) => option.value === values.user_role)?.label ?? values.user_role;
  const durationValue = values.budget_duration === "" ? NO_RESET : values.budget_duration;
  const durationOption = BUDGET_DURATION_OPTIONS.find((option) => option.value === durationValue);
  const durationLabel =
    durationOption === undefined
      ? values.budget_duration
      : t(durationOption.labelKey, { defaultValue: durationOption.label });
  const notSet = t("defaultUserSettings.displayValues.notSet", { defaultValue: "Not set" });

  return (
    <div className="flex flex-col gap-4">
      <ViewRow label={t("ssoModals.defaultRoleLabel", { defaultValue: "Default Role" })}>
        {roleLabel === "" ? notSet : roleLabel}
      </ViewRow>
      <ViewRow label={t("oldTeams.form.maxBudget", { defaultValue: "Max Budget (USD)" })}>
        {values.max_budget === "" ? notSet : values.max_budget}
      </ViewRow>
      <ViewRow label={t("oldTeams.form.resetBudget", { defaultValue: "Reset Budget" })}>{durationLabel}</ViewRow>
      <ViewRow label={t("defaultUserSettingsForm.modelsField.label", { defaultValue: "Default Models" })}>
        {values.models.length === 0
          ? notSet
          : values.models.map((model) => MODEL_SENTINEL_LABELS.get(model) ?? model).join(", ")}
      </ViewRow>
      <div>
        <p className="text-sm font-medium">
          {t("defaultUserSettingsForm.teamsField.title", { defaultValue: "Default Teams" })}
        </p>
        {values.teams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("guardrails.guardrailGardenDetail.externalDepsNone", { defaultValue: "None" })}
          </p>
        ) : (
          values.teams.map((team) => (
            <p key={team.team_id} className="text-sm text-muted-foreground">
              {team.team_id}
              {team.max_budget_in_team !== "" && (
                <> · {t("defaultUserSettingsForm.displayValues.teamMaxBudget", { budget: team.max_budget_in_team })}</>
              )}
              <> · {team.user_role}</>
            </p>
          ))
        )}
      </div>
    </div>
  );
};

interface SettingsFormProps {
  initialValues: DefaultUserSettingsFormValues;
  roleOptions: readonly RoleOption[];
  updateSettings: (body: DefaultInternalUserParams) => Promise<void>;
  onCancel: () => void;
  onSaved: () => void;
}

const SettingsForm = ({ initialValues, roleOptions, updateSettings, onCancel, onSaved }: SettingsFormProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const form = useZodForm(defaultUserSettingsSchema, { defaultValues: initialValues });
  const { isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: (values: DefaultUserSettingsSubmitValues) => updateSettings(buildBody(values)),
    onSuccess: (_result, values) => {
      toast.success(
        t("defaultUserSettingsForm.notifications.updated", {
          defaultValue: "Default user settings updated successfully",
        }),
      );
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      form.reset(values);
      onSaved();
    },
    onError: (error: unknown) =>
      toast.fromError(
        error instanceof Error
          ? error.message
          : t("defaultUserSettingsForm.notifications.updateFailedGeneric", {
              defaultValue: "Failed to update default user settings",
            }),
      ),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormField
          control={form.control}
          name="user_role"
          label={t("ssoModals.defaultRoleLabel", { defaultValue: "Default Role" })}
          description={t("defaultUserSettingsForm.roleField.description", {
            defaultValue: "Role assigned to new users",
          })}
        >
          {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
            <Select
              items={roleOptions}
              value={value === "" ? null : value}
              onValueChange={(selected) => onChange(selected ?? "")}
            >
              <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
                <SelectValue placeholder={t("defaultUserSettings.displayValues.notSet", { defaultValue: "Not set" })} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span>{option.label}</span>
                    {option.description !== "" && (
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField
          control={form.control}
          name="max_budget"
          label={t("oldTeams.form.maxBudget", { defaultValue: "Max Budget (USD)" })}
          description={t("defaultUserSettingsForm.budgetField.description", {
            defaultValue: "Default maximum budget for new users",
          })}
        >
          {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step="any" min={0} />}
        </FormField>

        <FormField
          control={form.control}
          name="budget_duration"
          label={t("oldTeams.form.resetBudget", { defaultValue: "Reset Budget" })}
          description={t("defaultUserSettingsForm.budgetDurationField.description", {
            defaultValue: "How often the default budget resets",
          })}
        >
          {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
            <Select
              items={BUDGET_DURATION_OPTIONS}
              value={value === "" ? NO_RESET : value}
              onValueChange={(selected) => onChange(selected === null || selected === NO_RESET ? "" : selected)}
            >
              <SelectTrigger id={id} className="w-full" aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey, { defaultValue: option.label })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField
          control={form.control}
          name="models"
          label={t("defaultUserSettingsForm.modelsField.label", { defaultValue: "Default Models" })}
          description={t("defaultUserSettingsForm.modelsField.description", {
            defaultValue: "Models new users can access",
          })}
        >
          {(field) => (
            <ModelSelect
              value={field.value}
              onChange={field.onChange}
              context="global"
              options={{ includeSpecialOptions: true }}
            />
          )}
        </FormField>

        <TeamsField control={form.control} />
      </FieldGroup>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset(initialValues);
            onCancel();
          }}
          disabled={mutation.isPending}
        >
          {t("common.cancel", { defaultValue: "Cancel" })}
        </Button>
        <Button type="submit" disabled={!isDirty || mutation.isPending}>
          {mutation.isPending
            ? t("common.saving", { defaultValue: "Saving..." })
            : t("defaultUserSettings.saveChanges", { defaultValue: "Save Changes" })}
        </Button>
      </div>
    </form>
  );
};

const SettingsCard = ({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("defaultUserSettings.title", { defaultValue: "Default User Settings" })}</CardTitle>
        <CardDescription>
          {t("defaultUserSettingsForm.cardDescription", {
            defaultValue: "Applied to every new internal user created through SSO or the user management APIs.",
          })}
        </CardDescription>
        {action !== undefined && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export interface DefaultUserSettingsFormProps {
  possibleUIRoles?: Record<string, Record<string, string>> | null;
  fetchSettings?: () => Promise<InternalUserSettings>;
  updateSettings?: (body: DefaultInternalUserParams) => Promise<void>;
}

export const DefaultUserSettingsForm = ({
  possibleUIRoles,
  fetchSettings = defaultFetchSettings,
  updateSettings = defaultUpdateSettings,
}: DefaultUserSettingsFormProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = React.useState(false);
  const { data, isPending, isError } = useQuery({ queryKey: SETTINGS_QUERY_KEY, queryFn: fetchSettings });

  const roleOptions = React.useMemo<RoleOption[]>(
    () =>
      Object.entries(possibleUIRoles ?? {})
        .filter(([role]) => role.includes("internal_user"))
        .map(([role, meta]) => ({ value: role, label: meta.ui_label || role, description: meta.description ?? "" })),
    [possibleUIRoles],
  );

  const initialValues = React.useMemo(() => (data === undefined ? undefined : settingsToForm(data.values)), [data]);

  if (isPending) {
    return (
      <SettingsCard>
        <Skeleton className="h-64 w-full" />
      </SettingsCard>
    );
  }

  if (isError || initialValues === undefined) {
    return (
      <SettingsCard>
        <p role="alert">
          {t("defaultUserSettingsForm.loadError", { defaultValue: "Could not load the default user settings." })}
        </p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      action={
        isEditing ? undefined : (
          <Button type="button" onClick={() => setIsEditing(true)}>
            {t("defaultUserSettings.editSettings", { defaultValue: "Edit Settings" })}
          </Button>
        )
      }
    >
      {isEditing ? (
        <SettingsForm
          initialValues={initialValues}
          roleOptions={roleOptions}
          updateSettings={updateSettings}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      ) : (
        <SettingsView values={initialValues} roleOptions={roleOptions} />
      )}
    </SettingsCard>
  );
};
