"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  DatabaseZap,
  Link,
  ListTree,
  MessagesSquare,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useTimeout } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";
import i18n from "@/lib/i18n";

import { AddToDatasetDialog, useCanAddToDataset } from "../../../datasets/AddToDatasetDialog";
import type { TraceHandoff } from "../../api";
import { runCost } from "../../list/AgentTracesTable";
import { traceRefOf, traceShareUrl } from "../../routing";
import { IdChip } from "../../ui/IdChip";
import { RunSourceLink, RunUser } from "../../ui/RunSource";
import { SpanIcon } from "../../ui/SpanIcon";
import { FrameworkLogo, traceFramework } from "../../ui/TraceFramework";
import type { SignalFlag, Trace } from "../../types";
import { SignalPills } from "../../ui/SignalPills";
import { fmtMs, fmtTok, traceAgentNames, traceDisplayName } from "../../utils";

type Summary = Trace["summary"];

function statusLabel(failed: boolean, errors: number): string {
  if (errors === 0) return failed ? i18n.t("lens.runHeader.errorsRecorded", { defaultValue: "Errors recorded" }) : i18n.t("lens.runHeader.recorded", { defaultValue: "Recorded" });
  const stepErrors = i18n.t("lens.runHeader.stepErrors", { count: errors.toLocaleString(), noun: errors === 1 ? i18n.t("lens.runHeader.stepError", { defaultValue: "error" }) : i18n.t("lens.runHeader.stepErrorsNoun", { defaultValue: "errors" }), defaultValue: `${errors.toLocaleString()} step ${errors === 1 ? "error" : "errors"}` });
  return failed ? stepErrors : i18n.t("lens.runHeader.recordedWith", { detail: stepErrors, defaultValue: `Recorded · ${stepErrors}` });
}

/** One pill for how the run went, so a failure is stated once instead of as a pill, a stat and a red icon. */
function StatusPill({ summary }: { summary: Summary }) {
  const failed = summary.status === "error";
  const label = statusLabel(failed, summary.error_count);
  return (
    <span
      title={i18n.t("lens.runHeader.statusTooltip", { defaultValue: "Status of received spans. More spans may still arrive." })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium",
        failed ? "bg-destructive/10 text-destructive" : "bg-trace-ok text-trace-ok-glyph",
      )}
    >
      <span className={cn("size-1.5 rounded-full", failed ? "bg-destructive" : "bg-trace-ok-glyph")} />
      {label}
    </span>
  );
}

/** Duration, steps, tokens and cost as one quiet line; cost is left out when nothing was priced. */
function Totals({ summary }: { summary: Summary }) {
  const cost = runCost(summary);
  const parts = [
    fmtMs(summary.duration_ms),
    `${summary.span_count.toLocaleString()} ${i18n.t("lens.runHeader.steps", { defaultValue: "steps" })}`,
    `${fmtTok(summary.input_tokens + summary.output_tokens)} ${i18n.t("lens.runHeader.tokens", { defaultValue: "tokens" })}`,
    cost && [cost.label, cost.partial?.long].filter(Boolean).join(" · "),
  ].filter(Boolean);
  return <span className="text-foreground tabular-nums">{parts.join(" · ")}</span>;
}

function RunIcon({ summary }: { summary: Summary }) {
  const framework = traceFramework(summary);
  if (!framework) return <SpanIcon type="agent" size="lg" />;
  return (
    <span
      className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-border px-1.5 text-xs text-muted-foreground"
      data-testid="run-framework"
      title={framework.label}
    >
      <FrameworkLogo framework={framework} />
      {traceAgentNames(summary).join(", ") || framework.label}
    </span>
  );
}

/** "Copy for agent" up front; the link and dataset actions sit behind its chevron. */
function RunActions({ summary, handoff }: { summary: Summary; handoff: TraceHandoff }) {
  const canAddToDataset = useCanAddToDataset();
  const [copied, setCopied] = useState(false);
  const [addingToDataset, setAddingToDataset] = useState(false);
  useTimeout(() => setCopied(false), copied ? 1600 : null);
  return (
    <>
      <ButtonGroup>
        <Button
          variant="outline"
          size="xs"
          className="h-7 gap-1.5 text-xs shadow-none"
          onClick={async () => setCopied(await copyToClipboard(handoff.text, handoff.copied))}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? i18n.t("common.copied", { defaultValue: "Copied" }) : i18n.t("lens.runHeader.copyForAgent", { defaultValue: "Copy for agent" })}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon-xs" className="h-7 w-7 shadow-none" aria-label={i18n.t("lens.runHeader.moreRunActions", { defaultValue: "More run actions" })} />
            }
          >
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() =>
                void copyToClipboard(traceShareUrl(traceRefOf(summary), window.location), i18n.t("lens.runHeader.traceLinkCopied", { defaultValue: "Trace link copied" }))
              }
            >
              <Link />
              {i18n.t("lens.runHeader.copyLink", { defaultValue: "Copy link" })}
            </DropdownMenuItem>
            {canAddToDataset && (
              <DropdownMenuItem onClick={() => setAddingToDataset(true)}>
                <DatabaseZap />
                {i18n.t("lens.runHeader.addRunToDataset", { defaultValue: "Add run to dataset" })}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
      {addingToDataset && (
        <AddToDatasetDialog
          sources={[{ kind: "trace", trace_id: summary.trace_id, trace_ref: summary.trace_ref ?? "", span_id: "" }]}
          agentName={traceAgentNames(summary)[0]}
          onClose={() => setAddingToDataset(false)}
        />
      )}
    </>
  );
}

interface RunHeaderProps {
  trace: Trace;
  handoff: TraceHandoff;
  onBack: () => void;
  embedded: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  live: boolean;
  canLive: boolean;
  onLiveChange: () => void;
  signals?: readonly SignalFlag[];
}

/** Row one says which agent ran, for whom and from where; row two says how it went. */
export function RunHeader({
  trace,
  handoff,
  onBack,
  embedded,
  refreshing,
  onRefresh,
  live,
  canLive,
  onLiveChange,
  signals = [],
}: RunHeaderProps) {
  const { summary } = trace;
  return (
    <header className="flex shrink-0 flex-col gap-2 border-b bg-background px-4 pt-3 pb-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {!embedded && (
          <Button variant="ghost" size="icon-xs" onClick={onBack} aria-label={i18n.t("lens.runHeader.backToRuns", { defaultValue: "Back to runs" })}>
            <ArrowLeft className="size-4" />
          </Button>
        )}
        <RunIcon summary={summary} />
        <h1 className="min-w-0 shrink truncate text-base font-semibold">{traceDisplayName(summary)}</h1>
        {summary.source?.user && <RunUser user={summary.source.user} />}
        {summary.source && <RunSourceLink source={summary.source} />}
        <IdChip value={summary.trace_id} label={i18n.t("lens.runHeader.copyTraceId", { defaultValue: "Copy trace ID" })} />
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="xs"
            aria-pressed={live}
            disabled={!canLive}
            onClick={onLiveChange}
            aria-label={i18n.t("lens.runHeader.liveUpdates", { defaultValue: "Live updates" })}
            title={live ? i18n.t("lens.runHeader.liveOnTooltip", { defaultValue: "Live: refreshes every 30s. Click to pause." }) : i18n.t("lens.runHeader.liveOffTooltip", { defaultValue: "Paused. Click to follow live." })}
            className="text-muted-foreground"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                live ? "bg-trace-ok-glyph motion-safe:animate-pulse" : "bg-muted-foreground/50",
              )}
            />
            {i18n.t("lens.runHeader.live", { defaultValue: "Live" })}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={refreshing}
            onClick={onRefresh}
            aria-label={i18n.t("lens.runHeader.refreshRun", { defaultValue: "Refresh run" })}
            title={i18n.t("common.refresh", { defaultValue: "Refresh" })}
            className="mr-1 text-muted-foreground"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          </Button>
          <RunActions summary={summary} handoff={handoff} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <StatusPill summary={summary} />
        {signals.length > 0 && <SignalPills flags={signals} showScore className="flex-wrap" />}
        <Totals summary={summary} />
        <TabsList aria-label={i18n.t("lens.runHeader.traceView", { defaultValue: "Trace view" })} className="ml-auto group-data-horizontal/tabs:h-7">
          <TabsTrigger value="steps" className="gap-1.5 px-2.5 text-xs">
            <ListTree className="size-3.5" />
            {i18n.t("lens.spanTree.steps", { defaultValue: "Steps" })}
          </TabsTrigger>
          <TabsTrigger value="thread" className="gap-1.5 px-2.5 text-xs">
            <MessagesSquare className="size-3.5" />
            {i18n.t("lens.runHeader.thread", { defaultValue: "Thread" })}
          </TabsTrigger>
        </TabsList>
      </div>
    </header>
  );
}
