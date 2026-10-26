import { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cva.config";
import i18n from "@/lib/i18n";
import styles from "./LensIntroduction.module.css";
import { GatewayFlow } from "./GatewayFlow";

const traceSteps = [
  { name: "research_agent", start: 0, duration: 14.2, failed: false },
  { name: "plan", start: 0, duration: 1.7, failed: false },
  { name: "search_docs", start: 1.7, duration: 3.1, failed: false },
  { name: "run_benchmark", start: 4.8, duration: 1.3, failed: true },
  { name: "search_docs", start: 6.1, duration: 3.6, failed: false },
  { name: "answer", start: 9.7, duration: 4.5, failed: false },
];

const sampleAnswer = () =>
  i18n.t("lens.introduction.sampleAnswer", {
    defaultValue: "The column store is 40% faster than the row store for your workload.",
  });

type EvidenceProps = { highlighted: boolean; onHighlight: () => void };

function TraceExample({ highlighted, onHighlight }: EvidenceProps) {
  return (
    <section
      aria-labelledby="lens-sample-trace"
      className={cn(styles.sampleCard, "min-w-0 rounded-xl border bg-card p-4")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <h3 id="lens-sample-trace" className="font-semibold">
          {i18n.t("lens.introduction.tracing", { defaultValue: "Tracing" })}
        </h3>
        <p className="text-xs text-muted-foreground">
          {i18n.t("lens.introduction.sampleTrace", { defaultValue: "Sample trace · 14.2s" })}
        </p>
      </div>
      <ol className="mt-3 space-y-1.5 text-xs leading-5 sm:text-sm" aria-label={i18n.t("lens.introduction.sampleTraceTimelineAria", { defaultValue: "Sample trace timeline" })}>
        {traceSteps.map((item, index) => {
          const linked = item.failed || item.name === "answer";
          const rowClass =
            "grid w-full grid-cols-[minmax(0,1fr)_minmax(48px,1fr)_2.5rem] items-center gap-2 text-left sm:gap-3";
          const content = (
            <>
              <span className={cn("flex min-w-0 items-center gap-1", index > 0 && "pl-2")}>
                {index === 0 ? (
                  <ChevronDown aria-hidden="true" className="size-3 shrink-0" />
                ) : (
                  <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
                )}
                <span className="truncate" title={item.name}>
                  {item.name}
                </span>
                {item.failed && (
                  <span className="sr-only">{i18n.t("lens.introduction.failed", { defaultValue: "Failed" })}</span>
                )}
              </span>
              <span aria-hidden="true" className="relative h-2.5 overflow-hidden rounded-sm bg-muted/70">
                <span
                  className={cn(
                    "absolute inset-y-0 rounded-sm",
                    linked && styles.evidenceBar,
                    item.failed ? "bg-rose-400" : "bg-indigo-600 dark:bg-indigo-400",
                  )}
                  style={{ left: `${(item.start / 14.2) * 100}%`, width: `${(item.duration / 14.2) * 100}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-muted-foreground">{item.duration}s</span>
            </>
          );
          return (
            <li key={`${item.name}-${item.start}`}>
              {linked ? (
                <button
                  type="button"
                  className={cn(rowClass, styles.evidenceLink)}
                  data-evidence-link=""
                  aria-label={i18n.t("lens.introduction.traceStepAria", {
                    defaultValue: "{{name}}, {{seconds}} seconds{{failed}}. Highlight related finding",
                    name: item.name,
                    seconds: item.duration,
                    failed: item.failed
                      ? i18n.t("lens.introduction.failedSuffix", { defaultValue: ", failed" })
                      : "",
                  })}
                  aria-controls="lens-linked-finding"
                  aria-pressed={highlighted}
                  onClick={onHighlight}
                >
                  {content}
                </button>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
        <div id="lens-benchmark-output" className={cn(styles.evidenceOutput, "rounded-lg bg-muted/60 p-2.5")}>
          <p className="text-xs text-muted-foreground">
            run_benchmark {i18n.t("lens.introduction.outputSuffix", { defaultValue: "· output" })}
          </p>
          <p className="mt-1.5 text-sm leading-4.5">
            {i18n.t("lens.introduction.benchmarkErrorOutput", { defaultValue: "Error: benchmark runner unavailable (503)" })}
          </p>
        </div>
        <div id="lens-answer-output" className={cn(styles.evidenceOutput, "rounded-lg bg-muted/60 p-2.5")}>
          <p className="text-xs text-muted-foreground">
            answer {i18n.t("lens.introduction.outputSuffix", { defaultValue: "· output" })}
          </p>
          <p className="mt-1.5 text-sm leading-4.5">“{sampleAnswer()}”</p>
        </div>
      </div>
    </section>
  );
}

function FindingExamples({ highlighted, onHighlight }: EvidenceProps) {
  return (
    <section
      aria-labelledby="lens-sample-findings"
      className={cn(styles.sampleCard, "min-w-0 rounded-xl border bg-card p-4")}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <h3 id="lens-sample-findings" className="font-semibold">
          {i18n.t("lens.introduction.lensFindings", { defaultValue: "Lens findings" })}
        </h3>
        <p className="text-xs text-muted-foreground">
          {i18n.t("lens.introduction.sampleRunsReviewed", { defaultValue: "500 sample runs reviewed" })}
        </p>
      </div>
      <div className="mt-3 divide-y border-t">
        <article id="lens-linked-finding" className={cn(styles.evidenceFinding, "py-3")}>
          <h4 className="text-sm font-semibold">
            <button
              type="button"
              className={cn(styles.evidenceLink, "flex w-full items-start gap-2 text-left")}
              data-evidence-link=""
              aria-controls="lens-benchmark-output lens-answer-output"
              aria-pressed={highlighted}
              onClick={onHighlight}
            >
              <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500" />
              {i18n.t("lens.introduction.findingTitle1", { defaultValue: "Claims numbers it never measured" })}
            </button>
          </h4>
          <div className="ml-4 mt-1.5 space-y-1.5 text-sm leading-4.5">
            <p className="text-muted-foreground">
              {i18n.t("lens.introduction.findingBody1", { defaultValue: "Reports a speedup even though the benchmark failed." })}
            </p>
            <blockquote className="border-l-2 pl-3 italic">
              {i18n.t("lens.introduction.findingQuote1", {
                defaultValue: "“…40% faster than the row store for your workload.”",
              })}
            </blockquote>
            <p>
              <span className="text-muted-foreground">{i18n.t("lens.introduction.nextStep", { defaultValue: "Next step:" })}{" "}</span>
              {i18n.t("lens.introduction.findingNextStep1", { defaultValue: "Report the failed benchmark instead of estimating." })}
            </p>
            <p className="text-xs text-muted-foreground">
              {i18n.t("lens.introduction.findingMeta1", { defaultValue: "38 linked runs · High priority" })}
            </p>
          </div>
        </article>
        <article className="pt-3">
          <h4 className="flex items-start gap-2 text-sm font-semibold">
            <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-500" />
            {i18n.t("lens.introduction.findingTitle2", { defaultValue: "Promises to follow up, then stops" })}
          </h4>
          <div className="ml-4 mt-1.5 space-y-1.5 text-sm leading-4.5 text-muted-foreground">
            <p>
              {i18n.t("lens.introduction.findingBody2", {
                defaultValue: "After an order lookup times out, the agent promises to check and ends the run.",
              })}
            </p>
            <p className="text-xs">
              {i18n.t("lens.introduction.findingMeta2", { defaultValue: "12 linked runs · Medium priority" })}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

export function LensIntroduction({ onStart }: { onStart: () => void }) {
  const [highlighted, setHighlighted] = useState(false);
  const toggleEvidence = () => setHighlighted((current) => !current);
  return (
    <section aria-labelledby="lens-introduction" className="rounded-2xl border bg-card p-4 sm:px-6 sm:py-5 xl:px-7">
      <h2 id="lens-introduction" className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
        {i18n.t("lens.introduction.heroTitle", { defaultValue: "The gateway that helps your agents improve" })}
      </h2>
      <p className="mt-3 max-w-[780px] text-sm leading-6 text-muted-foreground">
        {i18n.t("lens.introduction.heroDescription", {
          defaultValue:
            "Turn recorded agent runs into findings linked to the exact steps, so you know what happened and what to change.",
        })}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button className="rounded-lg px-4" onClick={onStart}>
          {i18n.t("lens.introduction.setUpLens", { defaultValue: "Set up Lens" })}
        </Button>
        
      </div>
      <GatewayFlow />
      <div
        className={cn(styles.examples, "mt-4 grid items-stretch gap-3 @2xl:grid-cols-2")}
        data-evidence-active={highlighted}
      >
        <TraceExample highlighted={highlighted} onHighlight={toggleEvidence} />
        <FindingExamples highlighted={highlighted} onHighlight={toggleEvidence} />
      </div>
    </section>
  );
}
