"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { organizationKeys } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import MCPServerSelector from "@/components/mcp_server_management/MCPServerSelector";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import VectorStoreSelector from "@/components/vector_store_management/VectorStoreSelector";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { BUDGET_DURATION_OPTIONS, NO_RESET } from "../org-settings/OrgSettingsForm";
import { orgSettingsSchema } from "../org-settings/schema";
import { buildOrgCreateBody, emptyOrgFormValues, type OrgCreateBody } from "./mapper";

const defaultCreateOrganization = async (body: OrgCreateBody): Promise<unknown> => {
  const { data } = await fetchClient.POST("/organization/new", { body });
  return data;
};

interface OrgCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  createOrganization?: (body: OrgCreateBody) => Promise<unknown>;
}

export const OrgCreateDialog = ({
  open,
  onOpenChange,
  accessToken,
  createOrganization = defaultCreateOrganization,
}: OrgCreateDialogProps) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const form = useZodForm(orgSettingsSchema, { defaultValues: emptyOrgFormValues });

  const closeAndReset = () => {
    form.reset(emptyOrgFormValues);
    onOpenChange(false);
  };

  const mutation = useMutation({
    mutationFn: (body: OrgCreateBody) => createOrganization(body),
    onSuccess: () => {
      toast.success(t("organizations.createSuccess", { defaultValue: "Organization created successfully" }));
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      closeAndReset();
    },
    onError: (error: unknown) =>
      toast.fromError(
        error instanceof Error
          ? error.message
          : t("organization.orgCreateDialog.createFailed", { defaultValue: "Failed to create organization" }),
      ),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && mutation.isPending) return;
    if (!nextOpen) {
      form.reset(emptyOrgFormValues);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit((values) => {
    if (mutation.isPending) return;
    mutation.mutate(buildOrgCreateBody(values));
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("organizations.createModalTitle", { defaultValue: "Create Organization" })}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <FormField
              control={form.control}
              name="organization_alias"
              label={t("organizations.formOrgName", { defaultValue: "Organization Name" })}
            >
              {({ ref, ...field }) => <Input {...field} ref={ref} />}
            </FormField>

            <FormField
              control={form.control}
              name="models"
              label={t("organizations.formModels", { defaultValue: "Models" })}
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
              label={t("organizations.formMaxBudget", { defaultValue: "Max Budget (USD)" })}
            >
              {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step="any" min={0} />}
            </FormField>

            <FormField
              control={form.control}
              name="budget_duration"
              label={t("organizations.formResetBudget", { defaultValue: "Reset Budget" })}
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
              label={t("organizations.formTpmLimit", { defaultValue: "Tokens per minute Limit (TPM)" })}
            >
              {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step={1} min={0} />}
            </FormField>

            <FormField
              control={form.control}
              name="rpm_limit"
              label={t("organizations.formRpmLimit", { defaultValue: "Requests per minute Limit (RPM)" })}
            >
              {({ ref, ...field }) => <Input {...field} ref={ref} type="number" step={1} min={0} />}
            </FormField>

            <FormField
              control={form.control}
              name="vector_stores"
              label={t("organizations.formAllowedVectorStores", { defaultValue: "Allowed Vector Stores" })}
              description={t("organizations.formAllowedVectorStoresHelp", {
                defaultValue:
                  "Select vector stores this organization can access. Leave empty for access to all vector stores",
              })}
            >
              {(field) => (
                <VectorStoreSelector
                  value={field.value}
                  onChange={field.onChange}
                  accessToken={accessToken}
                  placeholder={t("organizations.formAllowedVectorStoresPlaceholder", {
                    defaultValue: "Select vector stores (optional)",
                  })}
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="mcp"
              label={t("organizations.formAllowedMcpServers", { defaultValue: "Allowed MCP Servers" })}
              description={t("organization.orgCreateDialog.mcpServersHelp", {
                defaultValue:
                  "Select MCP servers, access groups, and toolsets this organization can access. Leave empty for access to all",
              })}
            >
              {(field) => (
                <MCPServerSelector
                  value={field.value}
                  onChange={field.onChange}
                  accessToken={accessToken}
                  placeholder={t("organizations.formAllowedMcpServersPlaceholder", {
                    defaultValue: "Select MCP servers and access groups (optional)",
                  })}
                />
              )}
            </FormField>

            <FormField
              control={form.control}
              name="metadata"
              label={t("organizations.formMetadata", { defaultValue: "Metadata" })}
            >
              {({ ref, ...field }) => <Textarea {...field} ref={ref} rows={4} />}
            </FormField>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? t("organization.orgCreateDialog.creating", { defaultValue: "Creating..." })
                : t("organizations.createModalTitle", { defaultValue: "Create Organization" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
