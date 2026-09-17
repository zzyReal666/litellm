import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { CredentialItem } from "../networking";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReuseCredentialsModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onAddCredential: (values: Record<string, unknown>) => void;
  existingCredential: CredentialItem | null;
  setIsCredentialModalOpen: (isVisible: boolean) => void;
}

const createReuseCredentialsSchema = (t: TFunction) =>
  z.object({
    credential_name: z
      .string()
      .min(1, t("modelAdd.reuseCredentials.credentialNameRequired", { defaultValue: "Credential name is required" })),
  });

type ReuseCredentialsFormValues = z.infer<ReturnType<typeof createReuseCredentialsSchema>>;

const storedValuesOf = (existingCredential: CredentialItem | null): Record<string, unknown> => {
  const values: unknown = existingCredential?.credential_values;
  return typeof values === "object" && values !== null ? (values as Record<string, unknown>) : {};
};

const ReuseCredentialsModal: React.FC<ReuseCredentialsModalProps> = ({
  isVisible,
  onCancel,
  onAddCredential,
  existingCredential,
  setIsCredentialModalOpen,
}) => {
  const { t } = useTranslation();
  const fieldIdPrefix = React.useId();
  const storedValues = storedValuesOf(existingCredential);
  const schema = React.useMemo(() => createReuseCredentialsSchema(t), [t]);
  const form = useZodForm(schema, {
    defaultValues: { credential_name: existingCredential?.credential_name ?? "" },
  });

  const handleSubmit = (values: ReuseCredentialsFormValues) => {
    onAddCredential({ ...storedValues, ...values });
    form.reset();
    setIsCredentialModalOpen(false);
  };

  const handleCancel = () => {
    onCancel();
    form.reset();
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("modelAdd.reuseCredentials.title", { defaultValue: "Reuse Credentials" })}</DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
            <FieldGroup>
              <FormField
                control={form.control}
                name="credential_name"
                label={t("modelAdd.reuseCredentials.credentialNameLabel", { defaultValue: "Credential Name:" })}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("modelAdd.reuseCredentials.credentialNamePlaceholder", {
                      defaultValue: "Enter a friendly name for these credentials",
                    })}
                  />
                )}
              </FormField>

              {Object.entries(storedValues).map(([key, value]) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`${fieldIdPrefix}-${key}`}>{key}</FieldLabel>
                  <Input
                    id={`${fieldIdPrefix}-${key}`}
                    value={String(value)}
                    placeholder={t("modelAdd.reuseCredentials.enterFieldPlaceholder", {
                      field: key,
                      defaultValue: "Enter {{field}}",
                    })}
                    disabled
                    readOnly
                  />
                </Field>
              ))}

              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <a
                        href="https://github.com/BerriAI/litellm/issues"
                        className="text-sm text-primary underline-offset-4 hover:underline"
                      >
                        {t("modelAdd.reuseCredentials.needHelp", { defaultValue: "Need Help?" })}
                      </a>
                    }
                  />
                  <TooltipContent>
                    {t("modelAdd.reuseCredentials.needHelpTooltip", { defaultValue: "Get help on our github" })}
                  </TooltipContent>
                </Tooltip>

                <div className="flex gap-2.5">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {t("common.cancel", { defaultValue: "Cancel" })}
                  </Button>
                  <Button type="submit">
                    {t("modelAdd.reuseCredentials.reuseCredentials", { defaultValue: "Reuse Credentials" })}
                  </Button>
                </div>
              </div>
            </FieldGroup>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

export default ReuseCredentialsModal;
