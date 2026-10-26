import React from "react";
import i18n from "@/lib/i18n";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { buttonVariants } from "@/components/ui/button";
import { getLoginUrl } from "@/utils/returnUrlUtils";

export function OnboardingErrorView() {
  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Alert variant="error">
        <CircleAlert />
        <AlertTitle>{i18n.t("onboardingErrorView.failed-to-load-invitation", { defaultValue: "Failed to load invitation" })}</AlertTitle>
        <AlertDescription>{i18n.t("onboardingErrorView.the-invitation-link-may-be-invalid-or-expire", { defaultValue: "The invitation link may be invalid or expired." })}</AlertDescription>
      </Alert>
      <div className="mt-4">
        <a href={getLoginUrl()} className={buttonVariants({ variant: "outline" })}>
          {i18n.t("onboardingErrorView.back-to-login", { defaultValue: "Back to Login" })}</a>
      </div>
    </div>
  );
}
