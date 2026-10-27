"use client";

import i18n from "@/lib/i18n";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Settings } from "lucide-react";
import { StatusDot } from "@/components/shared/StatusDot";
import { cn } from "@/lib/cva.config";
import type { InvestigationActivity } from "./model/status";
import { useWorkerConnected } from "./hooks/useWorkerConnected";
import type { LensList } from "./model/types";
import { LENS_TABS } from "./route";

const activityLabel = (activity: InvestigationActivity) =>
  activity === "running"
    ? i18n.t("lens.modeSwitch.investigationRunning", { defaultValue: "An investigation is running" })
    : i18n.t("lens.modeSwitch.investigationQueued", { defaultValue: "An investigation is queued" });

export function LensModeSwitch({
  activity,
  workers,
}: {
  activity: InvestigationActivity;
  workers: LensList["workers"] | null;
}) {
  const connected = useWorkerConnected(workers);
  const settingsTitle = connected
    ? i18n.t("lens.modeSwitch.workerConnected", { defaultValue: "Worker connected" })
    : i18n.t("lens.modeSwitch.connectWorker", { defaultValue: "Connect worker" });
  const labels = Object.fromEntries(
    Object.entries(LENS_TABS).map(([view, label]) => [view, i18n.t(`lens.tabs.${view}`, { defaultValue: label })]),
  );
  const tabs = Object.entries(labels).filter(([view]) => view !== "settings" || workers);
  return (
    <TabsPrimitive.List
      aria-label="Lens"
      className="relative inline-flex h-8 max-w-full items-center gap-0.5 rounded-lg bg-muted/60 p-0.5"
    >
      <TabsPrimitive.Indicator className="absolute top-0.5 bottom-0.5 left-(--active-tab-left) w-(--active-tab-width) rounded-md bg-card shadow-sm transition-[left,width] duration-200 motion-reduce:transition-none" />
      {tabs.map(([view, label]) => (
        <TabsPrimitive.Tab
          key={view}
          value={view}
          title={view === "settings" ? settingsTitle : undefined}
          aria-description={view === "investigations" && activity !== "idle" ? activityLabel(activity) : undefined}
          className={cn(
            "relative z-raised inline-flex h-full items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-active:text-foreground sm:text-sm",
            view === "settings" ? "px-2" : "px-2.5 sm:px-3",
          )}
        >
          {view === "settings" ? (
            <span className="relative inline-flex">
              <Settings aria-hidden="true" className="size-3.5" />
              {!connected && <StatusDot state="error" className="absolute -top-0.5 -right-0.5 size-1.5" />}
              <span className="sr-only">{label}</span>
            </span>
          ) : (
            label
          )}
          {view === "investigations" && activity !== "idle" && (
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                activity === "running" ? "bg-info motion-safe:animate-pulse" : "bg-muted-foreground/60",
              )}
            />
          )}
        </TabsPrimitive.Tab>
      ))}
    </TabsPrimitive.List>
  );
}
