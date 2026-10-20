import { useEffect, useMemo } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import { useCloudZeroUpdateSettings } from "@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { toast } from "@/lib/toast";

import { CloudZeroApiKeyInput, labelWithHint } from "./CloudZeroFormControls";
import { buildCloudZeroPayload, EMPTY_CLOUDZERO_FORM_VALUES, type CloudZeroFormValues } from "./cloudZeroPayload";
import { CloudZeroSettings } from "./types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CloudZeroUpdateModalProps {
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
  settings: CloudZeroSettings;
}

const updateSchema = (t: TFunction) =>
  z.object({
    api_key: z.string(),
    connection_id: z.string().min(
      1,
      t("cloudZero.cloudZeroUpdateModal.connectionIdRequired", {
        defaultValue: "Please enter your CloudZero connection ID",
      }),
    ),
    timezone: z.string(),
  });

export default function CloudZeroUpdateModal({ open, onOk, onCancel, settings }: CloudZeroUpdateModalProps) {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const schema = useMemo(() => updateSchema(t), [t]);
  const form = useZodForm(schema, { defaultValues: EMPTY_CLOUDZERO_FORM_VALUES });
  const updateMutation = useCloudZeroUpdateSettings(accessToken || "");

  useEffect(() => {
    if (open && settings) {
      form.reset({
        connection_id: settings.connection_id ?? "",
        timezone: settings.timezone || "UTC",
        api_key: "",
      });
    } else if (open) {
      form.reset(EMPTY_CLOUDZERO_FORM_VALUES);
    }
  }, [open, settings, form]);

  const handleSubmit = (values: CloudZeroFormValues) => {
    updateMutation.mutate(buildCloudZeroPayload(values), {
      onSuccess: () => {
        toast.success(
          t("cloudZero.cloudZeroUpdateModal.updateSuccess", {
            defaultValue: "CloudZero integration updated successfully",
          }),
        );
        form.reset(EMPTY_CLOUDZERO_FORM_VALUES);
        onOk();
      },
      onError: (error: Error) => {
        toast.error(
          error.message ||
            t("cloudZero.cloudZeroUpdateModal.updateFailed", {
              defaultValue: "Failed to update CloudZero integration",
            }),
        );
      },
    });
  };

  const handleCancel = () => {
    form.reset(EMPTY_CLOUDZERO_FORM_VALUES);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("cloudZero.cloudZeroUpdateModal.title", { defaultValue: "Edit CloudZero Integration" })}
          </DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={(event) => event.preventDefault()} noValidate>
            <FieldGroup>
              <FormField
                control={form.control}
                name="api_key"
                label={labelWithHint(
                  t("cloudZero.cloudZeroUpdateModal.apiKeyLabel", { defaultValue: "CloudZero API Key" }),
                  t("cloudZero.cloudZeroUpdateModal.apiKeyTooltip", {
                    defaultValue: "Leave empty to keep the existing API key",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <CloudZeroApiKeyInput
                    {...field}
                    ref={ref}
                    placeholder={t("cloudZero.cloudZeroUpdateModal.apiKeyPlaceholder", {
                      defaultValue: "Leave empty to keep existing",
                    })}
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="connection_id"
                label={t("cloudzeroExportModal.connectionIdLabel", { defaultValue: "Connection ID" })}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("cloudZero.cloudZeroUpdateModal.connectionIdPlaceholder", {
                      defaultValue: "Enter your CloudZero connection ID",
                    })}
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="timezone"
                label={labelWithHint(
                  t("cloudZero.cloudZeroUpdateModal.timezoneLabel", { defaultValue: "Timezone" }),
                  t("cloudZero.cloudZeroUpdateModal.timezoneTooltip", {
                    defaultValue: "Timezone for date handling (defaults to UTC if not provided)",
                  }),
                )}
              >
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="UTC" />}
              </FormField>
            </FieldGroup>
          </form>
        </TooltipProvider>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            onClick={() => void form.handleSubmit(handleSubmit)()}
            disabled={updateMutation.isPending}
            aria-busy={updateMutation.isPending}
          >
            {updateMutation.isPending
              ? t("cloudZero.cloudZeroUpdateModal.updating", { defaultValue: "Updating..." })
              : t("common.update", { defaultValue: "Update" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
