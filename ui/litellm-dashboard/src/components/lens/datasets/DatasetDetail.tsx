"use client";

import { useState } from "react";
import { ChevronRight, Database, Download, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/shared/StateMessage";
import i18n from "@/lib/i18n";
import { useDatasetRoute } from "../route";
import { IdChip } from "../traces/ui/IdChip";
import { isRevisionConflict, useDataset, useExportDataset, useSaveRevision } from "./api";
import { CasePanel } from "./CasePanel";
import { CaseTable } from "./CaseTable";
import { changedCount, withEdits, type CaseEdit, type CaseEdits } from "./caseView";
import type { Dataset } from "./types";

export interface DatasetDetailProps {
  readonly datasetId: string;
  readonly readOnly: boolean;
  readonly onBack: () => void;
}

export function DatasetDetail({ datasetId, readOnly, onBack }: DatasetDetailProps) {
  const { revision, setRevision } = useDatasetRoute();
  const latest = useDataset(datasetId);
  const viewed = useDataset(datasetId, revision);
  if (latest.isPending || viewed.isPending)
    return (
      <StateMessage
        role="status"
        icon={<Loader2 className="size-5 animate-spin motion-reduce:animate-none" />}
        title={i18n.t("lens.datasetDetail.loadingDataset", { defaultValue: "Loading dataset…" })}
        description={i18n.t("lens.datasetDetail.fetchingCases", { defaultValue: "Fetching its cases." })}
      />
    );
  const error = latest.error ?? viewed.error;
  if (error || !latest.data || !viewed.data)
    return (
      <StateMessage
        role="alert"
        tone="destructive"
        icon={<TriangleAlert className="size-5" />}
        title={i18n.t("lens.datasetDetail.couldNotLoadDataset", { defaultValue: "Couldn't load this dataset" })}
        description={error?.message ?? i18n.t("lens.datasetDetail.proxyReturnedNone", { defaultValue: "The proxy returned no dataset." })}
      >
        <Button size="sm" variant="outline" onClick={onBack}>
          {i18n.t("lens.datasetDetail.allDatasets", { defaultValue: "All datasets" })}
        </Button>
      </StateMessage>
    );
  return (
    <DatasetRevision
      key={viewed.data.revision}
      dataset={viewed.data}
      latestRevision={latest.data.revision}
      readOnly={readOnly}
      onBack={onBack}
      onPickRevision={(next) => setRevision(next === latest.data.revision ? null : next)}
      onShowLatest={() => setRevision(null)}
      onReload={() => {
        setRevision(null);
        void latest.refetch();
      }}
    />
  );
}

interface DatasetRevisionProps {
  readonly dataset: Dataset;
  readonly latestRevision: number;
  readonly readOnly: boolean;
  readonly onBack: () => void;
  readonly onPickRevision: (revision: number) => void;
  readonly onShowLatest: () => void;
  readonly onReload: () => void;
}

function DatasetRevision(props: DatasetRevisionProps) {
  const { dataset, latestRevision, readOnly, onBack, onPickRevision, onShowLatest, onReload } = props;
  const { caseId, setCaseId } = useDatasetRoute();
  const [edits, setEdits] = useState<CaseEdits>({});
  const save = useSaveRevision();
  const exportDataset = useExportDataset();
  const isLatest = dataset.revision === latestRevision;
  const editable = isLatest && !readOnly;
  const cases = withEdits(dataset.cases, edits);
  const changed = changedCount(dataset.cases, edits);
  const edit = (id: string, next: CaseEdit) =>
    setEdits((current) => ({ ...current, [id]: { ...current[id], ...next } }));
  const saveRevision = () =>
    save.mutate(
      { datasetId: dataset.id, body: { base_revision: dataset.revision, cases } },
      { onSuccess: onShowLatest },
    );
  const reload = () => {
    save.reset();
    setEdits({});
    onReload();
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-col gap-1 border-b bg-background px-3 pt-2.5 pb-2 sm:px-4">
        <nav aria-label={i18n.t("lens.datasetDetail.breadcrumbAria", { defaultValue: "Breadcrumb" })} className="flex items-center gap-1 text-xs text-muted-foreground">
          <button type="button" onClick={onBack} className="rounded hover:text-foreground hover:underline">
            {i18n.t("lens.datasetsView.datasetsAria", { defaultValue: "Datasets" })}
          </button>
          <ChevronRight aria-hidden="true" className="size-3" />
          <span className="truncate">{dataset.name}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Database aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <h2 className="min-w-0 truncate text-base font-semibold">{dataset.name}</h2>
            <IdChip value={dataset.id} label={i18n.t("lens.datasetDetail.copyDatasetId", { defaultValue: "Copy dataset ID" })} />
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              {dataset.agent_name || i18n.t("lens.datasetsView.anyAgent", { defaultValue: "Any agent" })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RevisionPicker revision={dataset.revision} latest={latestRevision} onPick={onPickRevision} />
            <Button
              size="sm"
              variant="outline"
              disabled={exportDataset.isPending}
              onClick={() => exportDataset.mutate({ id: dataset.id, name: dataset.name, revision: dataset.revision })}
            >
              <Download className="size-3.5" />
              {i18n.t("lens.datasetDetail.exportJsonl", { defaultValue: "Export JSONL" })}
            </Button>
            {editable && (
              <Button size="sm" disabled={changed === 0 || save.isPending} onClick={saveRevision}>
                {save.isPending && <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />}
                {i18n.t("lens.datasetDetail.saveAsRevision", { revision: dataset.revision + 1, defaultValue: `Save as revision ${dataset.revision + 1}` })}
              </Button>
            )}
          </div>
        </div>
      </header>
      <SaveProblem error={save.error ?? exportDataset.error} onReload={reload} />
      {!isLatest && (
        <p role="status" className="border-b px-4 py-2 text-xs text-muted-foreground">
          {i18n.t("lens.datasetDetail.revisionReadOnly", { revision: dataset.revision, defaultValue: `Revision ${dataset.revision} is read-only. Switch to the latest revision to make changes.` })}
        </p>
      )}
      {cases.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {i18n.t("lens.datasetDetail.noCases", { defaultValue: "This revision has no cases. Add some from a trace or a finding." })}
        </p>
      ) : (
        <CaseTable
          cases={cases}
          editable={editable}
          selectedId={caseId}
          onSelect={setCaseId}
          onToggle={(id, included) => edit(id, { included })}
        >
          {(item) => (
            <CasePanel
              key={item.id}
              item={item}
              datasetName={dataset.name}
              editable={editable}
              onEdit={(next) => edit(item.id, next)}
            />
          )}
        </CaseTable>
      )}
    </div>
  );
}

function SaveProblem({ error, onReload }: { error: Error | null; onReload: () => void }) {
  if (!error) return null;
  const conflict = isRevisionConflict(error);
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
    >
      <span className="min-w-0">
        {conflict
          ? i18n.t("lens.datasetDetail.revisionConflict", { defaultValue: "Someone saved a newer revision while you were editing. Reload to see it, then make your changes again." })
          : error.message}
      </span>
      {conflict && (
        <Button variant="ghost" size="sm" onClick={onReload}>
          {i18n.t("lens.datasetDetail.reload", { defaultValue: "Reload" })}
        </Button>
      )}
    </div>
  );
}

function RevisionPicker({
  revision,
  latest,
  onPick,
}: {
  revision: number;
  latest: number;
  onPick: (revision: number) => void;
}) {
  const revisions = Array.from({ length: latest + 1 }, (_, offset) => latest - offset);
  return (
    <select
      aria-label={i18n.t("lens.datasetDetail.revisionAria", { defaultValue: "Revision" })}
      className="h-8 rounded-md border-0 bg-transparent pr-7 pl-2 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
      value={revision}
      onChange={(event) => onPick(Number(event.target.value))}
    >
      {revisions.map((value) => (
        <option key={value} value={value}>
          {i18n.t("lens.datasetDetail.revisionLabel", { value, defaultValue: `Revision ${value}` })}
          {value === latest ? i18n.t("lens.datasetDetail.latestSuffix", { defaultValue: " (latest)" }) : ""}
        </option>
      ))}
    </select>
  );
}
