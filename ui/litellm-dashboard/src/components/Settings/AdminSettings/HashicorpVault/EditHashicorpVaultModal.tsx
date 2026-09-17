"use client";

import { useHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig";
import { useUpdateHashicorpVaultConfig } from "@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { toast } from "@/lib/toast";
import type { TFunction } from "i18next";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Separator } from "@/components/ui/separator";
import { useZodForm } from "@/lib/forms/useZodForm";
import { SENSITIVE_FIELDS, FIELD_LABELS } from "./constants";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FieldCopy {
  key: string;
  defaultValue: string;
}

interface VaultFieldGroup {
  title: FieldCopy;
  subtitle?: FieldCopy;
  fields: string[];
}

const FIELD_GROUPS: VaultFieldGroup[] = [
  {
    title: { key: "settingsPages.editHashicorpVaultModal.groupConnection", defaultValue: "Connection" },
    fields: ["vault_addr", "vault_namespace", "vault_mount_name", "vault_path_prefix"],
  },
  {
    title: { key: "settingsPages.editHashicorpVaultModal.groupTokenAuth", defaultValue: "Token Authentication" },
    subtitle: {
      key: "settingsPages.editHashicorpVaultModal.groupTokenAuthSubtitle",
      defaultValue: "Use a Vault token to authenticate. Only one auth method is required.",
    },
    fields: ["vault_token"],
  },
  {
    title: { key: "settingsPages.editHashicorpVaultModal.groupAppRoleAuth", defaultValue: "AppRole Authentication" },
    subtitle: {
      key: "settingsPages.editHashicorpVaultModal.groupAppRoleAuthSubtitle",
      defaultValue: "Use AppRole credentials to authenticate. Only one auth method is required.",
    },
    fields: ["approle_role_id", "approle_secret_id", "approle_mount_path"],
  },
  {
    title: { key: "settingsPages.editHashicorpVaultModal.groupTls", defaultValue: "TLS" },
    subtitle: {
      key: "settingsPages.editHashicorpVaultModal.groupTlsSubtitle",
      defaultValue: "Optional client certificate for mTLS.",
    },
    fields: ["client_cert", "client_key", "vault_cert_role"],
  },
];

type VaultFormValues = Record<string, string>;

const buildSchema = (fields: readonly string[], t: TFunction): z.ZodType<VaultFormValues, VaultFormValues> =>
  z.object(
    Object.fromEntries(
      fields.map((name) => [
        name,
        name === "vault_addr"
          ? z.string().refine((value) => value.length === 0 || /^https?:\/\/.+/.test(value), {
              message: t("settingsPages.editHashicorpVaultModal.urlPatternMessage", {
                defaultValue: "Must start with http:// or https://",
              }),
            })
          : z.string(),
      ]),
    ),
  ) as unknown as z.ZodType<VaultFormValues, VaultFormValues>;

interface EditHashicorpVaultModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditHashicorpVaultModal: React.FC<EditHashicorpVaultModalProps> = ({ isVisible, onCancel, onSuccess }) => {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const { data } = useHashicorpVaultConfig();
  const { mutate, isPending } = useUpdateHashicorpVaultConfig(accessToken);

  const properties: Record<string, { description?: string }> = useMemo(
    () => data?.field_schema?.properties ?? {},
    [data],
  );
  const rawValues: Record<string, unknown> = useMemo(() => data?.values ?? {}, [data]);

  const visibleFields = useMemo(
    () => FIELD_GROUPS.flatMap((group) => group.fields).filter((name) => properties[name] !== undefined),
    [properties],
  );

  const seededValues = useMemo(
    () =>
      Object.fromEntries(
        visibleFields.map((name) => [name, SENSITIVE_FIELDS.has(name) ? "" : ((rawValues[name] ?? "") as string)]),
      ),
    [visibleFields, rawValues],
  );

  const schema = useMemo(() => buildSchema(visibleFields, t), [visibleFields, t]);
  const form = useZodForm(schema, { values: seededValues });

  const handleSubmit = (formValues: VaultFormValues) => {
    const config: Record<string, string> = Object.fromEntries(
      Object.entries(formValues).flatMap(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") return [[key, value]];
        if (!SENSITIVE_FIELDS.has(key)) return [[key, ""]];
        return [];
      }),
    );

    mutate(config, {
      onSuccess: () => {
        toast.success(
          t("settingsPages.editHashicorpVaultModal.saveSuccess", {
            defaultValue: "Hashicorp Vault configuration updated successfully",
          }),
        );
        onSuccess();
      },
      onError: (err) => {
        toast.fromError(err);
      },
    });
  };

  const handleCancel = () => {
    form.reset(seededValues);
    onCancel();
  };

  const renderField = (fieldName: string) => {
    const fieldSchema = properties[fieldName];
    if (!fieldSchema) return null;

    const isSensitive = SENSITIVE_FIELDS.has(fieldName);
    const existingValue = rawValues[fieldName];
    const hasExistingValue = isSensitive && existingValue != null && existingValue !== "";
    const placeholder = hasExistingValue
      ? t("settingsPages.editHashicorpVaultModal.leaveBlankToKeep", {
          defaultValue: "Leave blank to keep existing ({{existing}})",
          existing: String(existingValue),
        })
      : fieldSchema?.description;

    return (
      <FormField key={fieldName} control={form.control} name={fieldName} label={FIELD_LABELS[fieldName] ?? fieldName}>
        {({ ref, ...field }) =>
          isSensitive ? (
            <PasswordInput ref={ref} placeholder={placeholder} {...field} />
          ) : (
            <Input ref={ref} placeholder={fieldSchema?.description} {...field} />
          )
        }
      </FormField>
    );
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {t("settingsPages.editHashicorpVaultModal.title", { defaultValue: "Edit Hashicorp Vault Configuration" })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          {FIELD_GROUPS.map((group, index) => (
            <div key={group.title.key}>
              {index > 0 && <Separator className="my-6" />}
              <h5 className="mb-1 text-base font-semibold text-foreground">
                {t(group.title.key, { defaultValue: group.title.defaultValue })}
              </h5>
              {group.subtitle && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {t(group.subtitle.key, { defaultValue: group.subtitle.defaultValue })}
                </p>
              )}
              <FieldGroup>{group.fields.map(renderField)}</FieldGroup>
            </div>
          ))}
        </form>
        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="button" disabled={isPending} onClick={() => void form.handleSubmit(handleSubmit)()}>
              {isPending && <UiLoadingSpinner className="size-4 mr-1" />}
              {isPending
                ? t("common.saving", { defaultValue: "Saving..." })
                : t("common.save", { defaultValue: "Save" })}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditHashicorpVaultModal;
