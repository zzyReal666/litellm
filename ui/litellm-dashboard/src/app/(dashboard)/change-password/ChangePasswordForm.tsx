"use client";

import React, { useState } from "react";
import { CircleAlert } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Alert, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { changePasswordCall, getProxyBaseUrl } from "@/components/networking";
import { extractProxyErrorMessage } from "@/lib/http/client";
import { useZodForm } from "@/lib/forms/useZodForm";
import { toast } from "@/lib/toast";
import { revokeSessionAndClearClientState } from "@/app/(dashboard)/hooks/useLogout";
import { getLoginUrl } from "@/utils/returnUrlUtils";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, i18n.t("changePassword.currentPasswordRequired", { defaultValue: "Current password is required" })),
    newPassword: z.string().min(1, i18n.t("changePassword.newPasswordRequired", { defaultValue: "New password is required" })),
    confirmNewPassword: z.string().min(1, i18n.t("changePassword.confirmPasswordRequired", { defaultValue: "Confirm your new password" })),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: i18n.t("changePassword.passwordsDoNotMatch", { defaultValue: "New passwords do not match" }),
    path: ["confirmNewPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { accessToken, passwordResetRequired } = useAuthorized();
  const { t } = useTranslation();
  const form = useZodForm(changePasswordSchema, {
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: ChangePasswordValues) => {
    if (!accessToken) return;
    setSubmitError(null);
    setIsPending(true);
    try {
      await changePasswordCall(accessToken, values.currentPassword, values.newPassword);
      if (passwordResetRequired) {
        // The session key was minted restricted; only a fresh login lifts it.
        // Revoke it server-side too (best-effort) so it doesn't sit valid
        // until the expiry reaper gets to it.
        toast.success(t("changePassword.passwordUpdatedRelogin", { defaultValue: "Password updated. Please log in with your new password." }));
        await revokeSessionAndClearClientState(accessToken);
        window.location.replace(getLoginUrl(getProxyBaseUrl()));
        return;
      }
      toast.success(t("changePassword.passwordUpdated", { defaultValue: "Password updated" }));
      form.reset();
    } catch (error) {
      setSubmitError(extractProxyErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md">
      <Card>
        <CardContent>
          <h3 className="text-2xl font-semibold text-foreground">{t("changePassword.title", { defaultValue: "Change Password" })}</h3>
          <p className="text-sm text-muted-foreground">
            {t("changePassword.subtitle", {
              defaultValue:
                "Enter your current password and choose a new one. The new password must meet this proxy's password policy.",
            })}
          </p>

          {passwordResetRequired && (
            <Alert variant="warning" className="mt-4">
              <CircleAlert />
              <AlertTitle>
                {t("changePassword.resetRequired", {
                  defaultValue:
                    "Your password must be changed before you can use the dashboard: it was either found in a known data breach or set by an administrator as a temporary password. After updating it, you will be signed out to log in again.",
                })}
              </AlertTitle>
            </Alert>
          )}

          <form className="mb-2 mt-8" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <FormField control={form.control} name="currentPassword" label={t("changePassword.currentPassword", { defaultValue: "Current Password" })}>
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} autoComplete="current-password" />}
              </FormField>

              <FormField control={form.control} name="newPassword" label={t("changePassword.newPassword", { defaultValue: "New Password" })}>
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} autoComplete="new-password" />}
              </FormField>

              <FormField control={form.control} name="confirmNewPassword" label={t("changePassword.confirmNewPassword", { defaultValue: "Confirm New Password" })}>
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} autoComplete="new-password" />}
              </FormField>
            </FieldGroup>

            {submitError && (
              <Alert variant="error" className="mt-6">
                <CircleAlert />
                <AlertTitle>{submitError}</AlertTitle>
              </Alert>
            )}

            <div className="mt-8">
              <Button type="submit" disabled={isPending}>
                {isPending && <UiLoadingSpinner className="size-4" role="img" aria-label={t("common.loading", { defaultValue: "Loading..." })} />}
                {t("changePassword.title", { defaultValue: "Change Password" })}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChangePasswordForm;
