import { Input } from "@/components/ui/input";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import ProviderSpecificFields from "../add_model/provider_specific_fields";
import { requiredRule } from "../common_components/formRules";
import { labelWithHint } from "@/components/shared/form/LabelWithHint";
import {
  MountedFormField,
  MountedFormProvider,
  projectMountedValues,
  useMountRegistry,
  type MountedFormValues,
} from "../common_components/MountedFormField";
import { CredentialItem } from "../networking";
import { Providers } from "../provider_info_helpers";
import { Logo } from "@/components/molecules/logo/Logo";
import { resetCredentialFormOnProviderChange } from "./credential_form_helpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const providerOptions: SearchSelectOption[] = Object.entries(Providers).map(([providerEnum, providerDisplayName]) => ({
  label: providerDisplayName,
  value: providerEnum,
  icon: <Logo provider={providerEnum} label={providerDisplayName} className="w-5 h-5" />,
}));

interface CredentialModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  mode: "add" | "edit";
  existingCredential?: CredentialItem | null;
}

export default function CredentialModal({
  open,
  onCancel,
  onSubmit,
  mode,
  existingCredential = null,
}: CredentialModalProps) {
  const isEdit = mode === "edit";
  const { t } = useTranslation();
  const copy = isEdit
    ? {
        title: t("modelAdd.editCredentialModal.title", { defaultValue: "Edit Credential" }),
        submit: t("modelAdd.editCredentialModal.updateCredential", { defaultValue: "Update Credential" }),
        nameLabel: t("modelAdd.editCredentialModal.credentialNameLabel", { defaultValue: "Credential Name:" }),
        namePlaceholder: t("modelAdd.editCredentialModal.credentialNamePlaceholder", {
          defaultValue: "Enter a friendly name for these credentials",
        }),
        nameRequired: t("modelAdd.editCredentialModal.credentialNameRequired", {
          defaultValue: "Credential name is required",
        }),
        providerLabel: t("modelAdd.editCredentialModal.providerLabel", { defaultValue: "Provider:" }),
        providerTooltip: t("modelAdd.editCredentialModal.providerTooltip", {
          defaultValue: "Helper to auto-populate provider specific fields",
        }),
        needHelp: t("modelAdd.editCredentialModal.needHelp", { defaultValue: "Need Help?" }),
        needHelpTooltip: t("modelAdd.editCredentialModal.needHelpTooltip", { defaultValue: "Get help on our github" }),
      }
    : {
        title: t("modelAdd.addCredentialModal.title", { defaultValue: "Add New Credential" }),
        submit: t("modelAdd.addCredentialModal.addCredential", { defaultValue: "Add Credential" }),
        nameLabel: t("modelAdd.addCredentialModal.credentialNameLabel", { defaultValue: "Credential Name:" }),
        namePlaceholder: t("modelAdd.addCredentialModal.credentialNamePlaceholder", {
          defaultValue: "Enter a friendly name for these credentials",
        }),
        nameRequired: t("modelAdd.addCredentialModal.credentialNameRequired", {
          defaultValue: "Credential name is required",
        }),
        providerLabel: t("modelAdd.addCredentialModal.providerLabel", { defaultValue: "Provider:" }),
        providerTooltip: t("modelAdd.addCredentialModal.providerTooltip", {
          defaultValue: "Helper to auto-populate provider specific fields",
        }),
        needHelp: t("modelAdd.addCredentialModal.needHelp", { defaultValue: "Need Help?" }),
        needHelpTooltip: t("modelAdd.addCredentialModal.needHelpTooltip", { defaultValue: "Get help on our github" }),
      };
  const [selectedProvider, setSelectedProvider] = useState<string | null>(
    (existingCredential?.credential_info.custom_llm_provider as Providers) ?? Providers.OpenAI,
  );

  const initialValues = existingCredential
    ? {
        credential_name: existingCredential.credential_name,
        custom_llm_provider: existingCredential.credential_info.custom_llm_provider,
        ...Object.fromEntries(
          Object.entries(existingCredential.credential_values || {}).map(([key, value]) => [key, value ?? null]),
        ),
      }
    : undefined;

  const form = useForm<MountedFormValues>({ mode: "onChange", defaultValues: initialValues });
  const registry = useMountRegistry();

  const formAdapter = {
    getFieldValue: (field: string) => form.getValues(field),
    resetFields: () => form.reset(),
    setFieldValue: (field: string, value: unknown) => form.setValue(field, value),
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger(registry.mountedNames() as string[]);
    if (!isValid) {
      return;
    }
    const values = projectMountedValues(registry, form.getValues);
    const filteredValues = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    onSubmit(filteredValues);
    form.reset();
  };

  const closeAndReset = () => {
    onCancel();
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeAndReset()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <MountedFormProvider value={{ control: form.control, registry }}>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <MountedFormField
                label={copy.nameLabel}
                name="credential_name"
                required
                rules={{ validate: { required: requiredRule(copy.nameRequired) } }}
                className="mb-4"
              >
                {(control) => (
                  <Input
                    id={control.id}
                    value={typeof control.value === "string" ? control.value : ""}
                    onChange={control.onChange}
                    onBlur={control.onBlur}
                    placeholder={copy.namePlaceholder}
                    disabled={isEdit}
                  />
                )}
              </MountedFormField>

              <MountedFormField
                label={labelWithHint(copy.providerLabel, copy.providerTooltip)}
                name="custom_llm_provider"
                required
                rules={{ validate: { required: requiredRule(t("common.required", { defaultValue: "Required" })) } }}
                className="mb-4"
              >
                {(control) => (
                  <SearchSelect
                    inputId={control.id}
                    placeholder={t("addModel.addModelForm.providerSelectPlaceholder", {
                      defaultValue: "Select a provider",
                    })}
                    options={providerOptions}
                    value={typeof control.value === "string" ? control.value : null}
                    onValueChange={(value) => {
                      control.onChange(value);
                      resetCredentialFormOnProviderChange(formAdapter, value, setSelectedProvider);
                    }}
                  />
                )}
              </MountedFormField>

              <ProviderSpecificFields selectedProvider={selectedProvider} />

              <div className="flex justify-between items-center">
                <SimpleTooltip content={copy.needHelpTooltip}>
                  <a href="https://github.com/BerriAI/litellm/issues" className="text-sm text-primary hover:underline">
                    {copy.needHelp}
                  </a>
                </SimpleTooltip>

                <div>
                  <Button variant="outline" className="mr-2.5" onClick={closeAndReset}>
                    {t("common.cancel", { defaultValue: "Cancel" })}
                  </Button>
                  <Button type="submit">{copy.submit}</Button>
                </div>
              </div>
            </form>
          </MountedFormProvider>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
