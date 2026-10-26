"use client";

import type { ComponentProps, ReactNode } from "react";
import i18n from "@/lib/i18n";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cva.config";
import { SettingsCard } from "../SettingsSection";

export type WorkerInstallProps = ComponentProps<"div"> & {
  connected: boolean;
  /** Rendered once the worker connects, in place of the install steps. */
  children: ReactNode;
};

export function WorkerInstall({ connected, children, className, ...props }: WorkerInstallProps) {
  if (!connected)
    return (
      <SettingsCard {...props} data-slot="worker-install" className={cn("flex flex-col gap-5", className)}>
        <header className="space-y-1">
          <h3 className="text-base font-semibold">{i18n.t("workerInstall.connecting-lens", { defaultValue: "Connecting Lens" })}</h3>
          <p className="text-sm text-muted-foreground">{i18n.t("workerInstall.your-lens-service-connects-automatically", { defaultValue: "Your Lens service connects automatically." })}</p>
        </header>
        <p role="status" className="text-sm text-muted-foreground">
          {i18n.t("workerInstall.connecting-your-lens-service-this-page-updat", { defaultValue: "Connecting your Lens service… This page updates automatically. Check the service logs if it does not connect." })}{" "}</p>
      </SettingsCard>
    );
  return (
    <SettingsCard
      {...props}
      data-slot="worker-install"
      className={cn("flex flex-col items-center gap-5 text-center", className)}
    >
      <header className="flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="text-base font-semibold">{i18n.t("workerInstall.worker-connected", { defaultValue: "Worker connected" })}</h3>
        <p className="text-sm text-muted-foreground">{i18n.t("workerInstall.ready-to-run-investigations", { defaultValue: "Ready to run investigations." })}</p>
      </header>
      {children}
    </SettingsCard>
  );
}
