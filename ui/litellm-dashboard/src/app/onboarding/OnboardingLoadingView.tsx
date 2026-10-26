import React from "react";
import i18n from "@/lib/i18n";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";

export function OnboardingLoadingView() {
  return (
    <div className="mx-auto w-full max-w-md mt-10 flex justify-center">
      <UiLoadingSpinner role="status" aria-label={i18n.t("onboardingLoadingView.loading-invitation", { defaultValue: "Loading invitation" })} className="size-8 text-muted-foreground" />
    </div>
  );
}
