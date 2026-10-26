"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import i18n from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cva.config";
import type { LensReadiness } from "../hooks/useLensReadiness";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingSteps } from "./OnboardingSteps";

export type OnboardingSetupProps = Omit<ComponentProps<"section">, "children"> & {
  state: LensReadiness;
  action?: ReactNode;
  includeTracing?: boolean;
};

export function OnboardingSetup({ state, action, includeTracing = true, className, ...props }: OnboardingSetupProps) {
  const { readOnly, canInvestigate } = useOnboarding();
  const titleId = useId();
  return (
    <section
      data-slot="onboarding-setup"
      aria-labelledby={titleId}
      className={cn("min-w-0 scroll-mt-4 outline-none", className)}
      {...props}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
            {i18n.t("onboardingSetup.get-lens-running", { defaultValue: "Get Lens running" })}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {i18n.t("onboardingSetup.each-step-checks-your-connection-so-you-ll-s", { defaultValue: "Each step checks your connection, so you’ll see when it’s working." })}</p>
        </div>
        {action}
      </div>
      <OnboardingSteps state={state} includeTracing={includeTracing} />
      {state.error && (
        <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-destructive">
          <p>{i18n.t("onboardingSetup.could-not-check-setup", { defaultValue: "Could not check setup." })}{" "}{state.error}</p>
          <Button variant="outline" size="sm" onClick={state.refresh} disabled={state.checking}>
            Retry
          </Button>
        </div>
      )}
      {(readOnly || !canInvestigate) && (
        <p className="mt-4 text-sm text-muted-foreground">
          {i18n.t("onboardingSetup.a-gateway-administrator-can-connect-a-worker", { defaultValue: "A gateway administrator can connect a worker and run investigations." })}</p>
      )}
    </section>
  );
}
