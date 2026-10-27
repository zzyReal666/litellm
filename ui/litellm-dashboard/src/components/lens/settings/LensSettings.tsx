"use client";

import { type ReactNode } from "react";
import i18n from "@/lib/i18n";
import { Activity, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/shared/StatusDot";
import { WorkerSettings } from "./worker/WorkerSettings";
import { SignalSettings } from "./signals/SignalSettings";
import { SettingsCard, SettingsSection } from "./SettingsSection";
import type { LensList } from "../model/types";

const TRACING_DOCS = "https://docs.litellm.ai/docs/proxy/lens";

function TracingSection({ enabled, onOpenTraces }: { enabled: boolean; onOpenTraces: () => void }) {
  return (
    <SettingsSection heading={i18n.t("lens.settings.tracing", { defaultValue: "Tracing" })} description={i18n.t("lensSettings.where-your-agents-send-runs-so-lens-can-read", { defaultValue: "Where your agents send runs so Lens can read them." })}>
      <SettingsCard className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <Activity aria-hidden="true" className="size-4 text-muted-foreground" />
          <span role="status" className="inline-flex items-center gap-2">
            <StatusDot state={enabled ? "ok" : "off"} />
            {enabled
              ? i18n.t("lens.settings.tracingEnabled", { defaultValue: "Tracing enabled" })
              : i18n.t("lens.settings.tracingDisabled", { defaultValue: "Tracing is not enabled" })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          
          <Button variant="outline" size="sm" onClick={onOpenTraces}>
            {enabled
              ? i18n.t("lens.settings.connectAgent", { defaultValue: "Connect an agent" })
              : i18n.t("lens.settings.enableTracing", { defaultValue: "Enable tracing" })}
          </Button>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}

export function LensSettings({
  list,
  workerReadyAction,
  onOpenTraces,
}: {
  list: LensList;
  /** Replaces the worker install card's Done button once the new worker connects. */
  workerReadyAction?: ReactNode;
  onOpenTraces: () => void;
}) {
  return (
    <div aria-label="Settings" role="region" className="flex w-full flex-col divide-y divide-border">
      <TracingSection enabled={list.tracing_enabled} onOpenTraces={onOpenTraces} />
      <SignalSettings />
      <SettingsSection
        heading={i18n.t("lens.settings.analysisWorker", { defaultValue: "Analysis worker" })}
        description={i18n.t("lensSettings.runs-investigations-on-your-server-and-bills", { defaultValue: "Runs investigations on your server and bills model usage to an analysis key." })}
      >
        <WorkerSettings workers={list.workers} readyAction={workerReadyAction} />
      </SettingsSection>
    </div>
  );
}
