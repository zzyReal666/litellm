"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { organizationKeys } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import MCPServerSelector from "@/components/mcp_server_management/MCPServerSelector";
import { toast } from "@/lib/toast";
import type { Organization } from "@/components/networking";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import VectorStoreSelector from "@/components/vector_store_management/VectorStoreSelector";
import { pickDirty } from "@/lib/forms/pickDirty";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { buildOrgPatch, orgToForm, type OrgPatchBody } from "./mapper";
import { orgSettingsSchema } from "./schema";

export const NO_RESET = "never";

export const BUDGET_DURATION_OPTIONS = [
  { value: NO_RESET, labelKey: "organization.orgSettingsForm.noReset", label: "No reset" },
  { value: "24h", labelKey: "organization.organizationView.budgetDurationDaily", label: "daily" },
  { value: "7d", labelKey: "organization.organizationView.budgetDurationWeekly", label: "weekly" },
  { value: "30d", labelKey: "organization.organizationView.budgetDurationMonthly", label: "monthly" },
] as const;

const defaultPatchOrganization = async (organizationId: string, body: OrgPatchBody): Promise<unknown> => {
  const { data } = await fetchClient.PATCH("/v2/organization/{organization_id}", {
    params: { path: { organization_id: organizationId } },
    body,
  });
  return data;
};

interface OrgSettingsFormProps {
  organizationId: string;
  org: Organization;
  accessToken: string;
  onCancel: () => void;
  onSaved: () => void;
  patchOrganization?: (organizationId: string, body: OrgPatchBody) => Promise<unknown>;
}

export const OrgSettingsForm = ({
  organizationId,
  org,
  accessToken,
  onCancel,
  onSaved,
  patchOrganization = defaultPatchOrganization,
}: OrgSettingsFormProps) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const form = useZodForm(orgSettingsSchema, { defaultValues: orgToForm(org) });
  const { isDirty } = form.formState;

  const mutation = useMutation({
    mutationFn: (body: OrgPatchBody) => patchOrganization(organizationId, body),
    onSuccess: () => {
      toast.success(
        t("organization.organizationView.settingsUpdatedSuccess", {
          defaultValue: "Organization settings updated successfully",
        }),
      );
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      onSaved();
    },
    onError: (error: unknown) =>
      toast.fromError(
        error instanceof Error
          ? error.message
          : t("organization.organizationView.settingsUpdateFailed", {
              defaultValue: "Failed to update organization settings",
            }),
      ),
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(buildOrgPatch(pickDirty(values, form.formState.dirtyFields)));
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormField
          control={form.control}
          name="organization_alias"
          label={t("organization.organizationView.formOrgName", { defaultValue: "Organization Name" })}
        >
          {({ ref, ...field }) => <Input {...field} ref={ref} />}
        </FormField>

        <FormField
          control={form.control}
          name="models"
          label={t("organization.organizationView.formModels", { defaultValue: "Models" })}
        >
          {(field) => (
            <ModelSelect
              value={field.value}
              onChange={field.onChange}
              context="organization"
              options={{ includeSpecialOptions: true, showAllProxyModelsOverride: true }}
            />
          )}
        </FormField>

        <FormField
          control={form.control}
          name="max_budget"
          label={t("organization.organizationView.formMaxBudget", { defaultValue: "Max Budget (USD)" })}
        >
          {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step="any" min={0} />}
        </FormField>

        <FormField
          control={form.control}
          name="budget_duration"
          label={t("organization.organizationView.formResetBudget", { defaultValue: "Reset Budget" })}
        >
          {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
            <Select
              items={BUDGET_DURATION_OPTIONS}
              value={value === "" ? NO_RESET : value}
              onValueChange={(selected) => onChange(selected === NO_RESET ? "" : selected)}
            >
              <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}>
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
          name="tpm_limit"
          label={t("organization.organizationView.formTpmLimit", { defaultValue: "Tokens per minute Limit (TPM)" })}
        >
          {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step={1} min={0} />}
        </FormField>

        <FormField
          control={form.control}
          name="rpm_limit"
          label={t("organization.organizationView.formRpmLimit", { defaultValue: "Requests per minute Limit (RPM)" })}
        >
          {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step={1} min={0} />}
        </FormField>

        <FormField
          control={form.control}
          name="vector_stores"
          label={t("organization.organizationView.formVectorStores", { defaultValue: "Vector Stores" })}
        >
          {(field) => (
            <VectorStoreSelector
              value={field.value}
              onChange={field.onChange}
              accessToken={accessToken}
              placeholder={t("organization.organizationView.vectorStoresPlaceholder", {
                defaultValue: "Select vector stores",
              })}
            />
          )}
        </FormField>

        <FormField
          control={form.control}
          name="mcp"
          label={t("organization.organizationView.formMcpServers", { defaultValue: "MCP Servers & Access Groups" })}
        >
          {(field) => (
            <MCPServerSelector
              value={field.value}
              onChange={field.onChange}
              accessToken={accessToken}
              placeholder={t("organization.organizationView.mcpServersPlaceholder", {
                defaultValue: "Select MCP servers and access groups",
              })}
            />
          )}
        </FormField>

        <FormField
          control={form.control}
          name="metadata"
          label={t("organization.organizationView.formMetadata", { defaultValue: "Metadata" })}
        >
          {({ ref, ...field }) => <Textarea {...field} ref={ref} rows={4} />}
        </FormField>
      </FieldGroup>

      <div className="sticky z-chrome bg-card p-4 border-t border-border -bottom-6 -inset-x-6 mt-6">
        <div className="flex justify-end items-center gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button type="submit" disabled={!isDirty || mutation.isPending}>
            {mutation.isPending
              ? t("common.saving", { defaultValue: "Saving..." })
              : t("organization.organizationView.saveChanges", { defaultValue: "Save Changes" })}
          </Button>
        </div>
      </div>
    </form>
  );
};
