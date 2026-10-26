"use client";

import { useState } from "react";
import i18n from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";

import { Inspector } from "@/components/shared/Inspector";
import { Button } from "@/components/ui/button";
import { RunView } from "@/components/lens/traces/detail/run/RunView";
import { useLocalRunSelection } from "@/components/lens/traces/routing";

import { lensQueries } from "../data/queries";
import { useLensAccessToken, useLensApi } from "../data/LensServices";
import { evidenceTarget, type EvidenceTarget } from "../model/findings";
import type { EvidenceRef } from "../route";

const SECTION = 8000;

export interface EvidenceViewProps {
  readonly lensId: string;
  readonly evidence: EvidenceRef;
  /** Shown as a back link above the evidence when it is stacked over something else. */
  readonly backLabel?: string;
  readonly onBack?: () => void;
}

/** The original trace step or logged request a piece of evidence points at, filling the panel. */
export function EvidenceView({ lensId, evidence, backLabel, onBack }: EvidenceViewProps) {
  const target = evidenceTarget(evidence.id);
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="evidence-view">
      {onBack && backLabel && (
        <div className="flex h-9 shrink-0 items-center border-b px-3">
          <Inspector.BackLink label={backLabel} onClick={onBack} />
        </div>
      )}
      <EvidenceBody
        key={`${evidence.id}:${evidence.span}`}
        lensId={lensId}
        target={target}
        evidence={evidence}
        onBack={onBack}
      />
    </div>
  );
}

function EvidenceBody({
  lensId,
  target,
  evidence,
  onBack = () => {},
}: {
  lensId: string;
  target: EvidenceTarget | null;
  evidence: EvidenceRef;
  onBack?: () => void;
}) {
  if (target?.source === "traces")
    return (
      <TraceEvidence
        traceId={target.id}
        traceRef={target.traceRef}
        initialSpanId={evidence.span || null}
        onBack={onBack}
      />
    );
  if (target?.source === "requests") return <RequestEvidence lensId={lensId} evidenceId={evidence.id} />;
  return <p className="p-4 text-sm text-muted-foreground">{i18n.t("evidence.this-evidence-is-no-longer-available", { defaultValue: "This evidence is no longer available." })}</p>;
}

export function TraceEvidence({
  traceId,
  traceRef,
  initialSpanId,
  onBack,
}: {
  traceId: string;
  traceRef?: string;
  initialSpanId: string | null;
  onBack: () => void;
}) {
  const selection = useLocalRunSelection(initialSpanId);
  const accessToken = useLensAccessToken();
  return (
    <RunView
      traceId={traceId}
      traceRef={traceRef}
      selection={selection}
      accessToken={accessToken}
      onBack={onBack}
      embedded
    />
  );
}

function RequestEvidence({ lensId, evidenceId }: { lensId: string; evidenceId: string }) {
  const api = useLensApi();
  const [offset, setOffset] = useState(0);
  const request = { lensId, evidenceId, requestOffset: offset, source: "requests" };
  const evidence = useQuery(lensQueries.evidence(api, request));
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <header className="border-b px-4 py-4">
        <h2 className="text-sm font-semibold">{i18n.t("evidence.request-evidence", { defaultValue: "Request evidence" })}</h2>
        <p className="text-xs text-muted-foreground">{i18n.t("evidence.original-logged-input-and-output", { defaultValue: "Original logged input and output" })}</p>
      </header>
      <div className="space-y-3 p-4">
        {evidence.isLoading && <p role="status">{i18n.t("evidence.loading-request", { defaultValue: "Loading request…" })}</p>}
        {evidence.error && <p role="alert">{evidence.error.message}</p>}
        {evidence.data?.parts.map((p) => (
          <pre className="text-xs break-words whitespace-pre-wrap" key={p.span_id}>
            {p.content}
          </pre>
        ))}
        {evidence.data?.parts.length === 0 && <p>{i18n.t("evidence.request-was-not-found-or-is-past-retention", { defaultValue: "Request was not found or is past retention" })}</p>}
        <div className="flex flex-wrap gap-2">
          {offset > 0 && (
            <Button variant="outline" onClick={() => setOffset(Math.max(0, offset - SECTION))}>
              {i18n.t("evidence.previous-section", { defaultValue: "Previous section" })}{" "}</Button>
          )}
          {evidence.data?.parts.some((p) => p.truncated) && (
            <Button variant="outline" onClick={() => setOffset(offset === 0 ? 1 : offset + SECTION)}>
              {i18n.t("evidence.next-section", { defaultValue: "Next section" })}{" "}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
