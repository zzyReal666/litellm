"use client";

import {
  getCoreRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type TableOptions,
} from "@tanstack/react-table";
import { ChevronRight, Database, Loader2, TriangleAlert } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";
import { Inspector } from "@/components/shared/Inspector";
import { InspectorTable } from "@/components/shared/InspectorTable";
import { Button } from "@/components/ui/button";
import { formatActivityTimestamp } from "@/utils/activityTimestamp";
import { FINDING_PANEL_WIDTH_KEY } from "../storage";
import { StateMessage } from "@/components/shared/StateMessage";
import i18n from "@/lib/i18n";
import { useDatasetRoute } from "../route";
import { useDatasets } from "./api";
import { DatasetDetail } from "./DatasetDetail";
import type { DatasetSummary } from "./types";

export interface DatasetsViewProps {
  readonly readOnly?: boolean;
}

export function DatasetsView({ readOnly = false }: DatasetsViewProps) {
  const { datasetId, openDataset } = useDatasetRoute();
  return (
    <section aria-label={i18n.t("lens.datasetsView.datasetsAria", { defaultValue: "Datasets" })} className="flex w-full min-w-0 flex-1 flex-col">
      {datasetId ? (
        <DatasetDetail key={datasetId} datasetId={datasetId} readOnly={readOnly} onBack={() => openDataset(null)} />
      ) : (
        <DatasetList onOpen={openDataset} />
      )}
    </section>
  );
}

function DatasetList({ onOpen }: { onOpen: (id: string) => void }) {
  const datasets = useDatasets();
  if (datasets.isPending)
    return (
      <StateMessage
        role="status"
        icon={<Loader2 className="size-5 animate-spin motion-reduce:animate-none" />}
        title={i18n.t("lens.datasetsView.loadingDatasets", { defaultValue: "Loading datasets…" })}
        description={i18n.t("lens.datasetsView.loadingDatasetsDesc", { defaultValue: "Fetching the datasets you can see." })}
      />
    );
  if (datasets.isError)
    return (
      <StateMessage
        role="alert"
        tone="destructive"
        icon={<TriangleAlert className="size-5" />}
        title={i18n.t("lens.datasetsView.couldNotLoadDatasets", { defaultValue: "Couldn't load datasets" })}
        description={datasets.error.message}
      >
        <Button size="sm" onClick={() => void datasets.refetch()}>
          {i18n.t("lens.datasetsView.tryAgain", { defaultValue: "Try again" })}
        </Button>
      </StateMessage>
    );
  if (datasets.data.length === 0)
    return (
      <StateMessage
        role="status"
        icon={<Database className="size-5" />}
        title={i18n.t("lens.datasetsView.noDatasetsYet", { defaultValue: "No datasets yet" })}
        description={i18n.t("lens.datasetsView.noDatasetsDesc", { defaultValue: "Open a trace or a finding and choose Add to dataset to save real conversations for an agent." })}
      />
    );
  return <DatasetTable datasets={datasets.data} onOpen={onOpen} />;
}

type Cell = CellContext<DatasetSummary, unknown>;

const DATASET_HEIGHT = 36;

function NameCell({ row: { original: dataset } }: Cell) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">{dataset.name}</span>
      <span className="truncate text-xs text-muted-foreground md:hidden">{dataset.agent_name || i18n.t("lens.datasetsView.anyAgent", { defaultValue: "Any agent" })}</span>
    </span>
  );
}

function AgentCell({ row: { original: dataset } }: Cell) {
  return <span className="block truncate text-muted-foreground">{dataset.agent_name || i18n.t("lens.datasetsView.anyAgent", { defaultValue: "Any agent" })}</span>;
}

function RevisionCell({ row: { original: dataset } }: Cell) {
  return <span className="tabular-nums text-muted-foreground">{dataset.revision}</span>;
}

function CasesCell({ row: { original: dataset } }: Cell) {
  return (
    <span className="inline-flex min-w-5 justify-center rounded-full bg-muted px-1.5 font-mono text-xs tabular-nums text-foreground">
      {dataset.case_count}
    </span>
  );
}

function UpdatedCell({ row: { original: dataset } }: Cell) {
  return <span className="whitespace-nowrap text-muted-foreground">{formatActivityTimestamp(dataset.updated_at)}</span>;
}

function OpenCell() {
  return <ChevronRight aria-hidden="true" className="mr-2 ml-auto size-3.5 text-muted-foreground/60" />;
}

const COLUMNS: ColumnDef<DatasetSummary>[] = [
  { id: "name", header: i18n.t("lens.datasetsView.colDataset", { defaultValue: "Dataset" }), cell: NameCell },
  { id: "agent", size: 160, header: i18n.t("lens.datasetsView.colAgent", { defaultValue: "Agent" }), cell: AgentCell },
  { id: "revision", size: 80, header: i18n.t("lens.datasetsView.colRevision", { defaultValue: "Revision" }), cell: RevisionCell, meta: { numeric: true } },
  { id: "cases", size: 64, header: i18n.t("lens.datasetsView.colCases", { defaultValue: "Cases" }), cell: CasesCell, meta: { numeric: true } },
  { id: "updated", size: 200, header: i18n.t("lens.datasetsView.colUpdated", { defaultValue: "Updated" }), cell: UpdatedCell },
  { id: "open", size: 40, header: i18n.t("lens.datasetsView.colOpen", { defaultValue: "Open" }), cell: OpenCell, meta: { headerClassName: "sr-only", className: "pl-0" } },
];

function DatasetTable({ datasets, onOpen }: { datasets: readonly DatasetSummary[]; onOpen: (id: string) => void }) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const tableOptions: TableOptions<DatasetSummary> = {
    data: [...datasets],
    columns: COLUMNS,
    defaultColumn: { size: undefined },
    state: { columnVisibility: { agent: desktop, updated: desktop } },
    getRowId: (dataset) => dataset.id,
    autoResetAll: false,
    getCoreRowModel: getCoreRowModel(),
  };
  const table = useReactTable(tableOptions);
  const cases = datasets.reduce((total, dataset) => total + dataset.case_count, 0);
  return (
    <Inspector.Root
      items={datasets}
      itemKey={(dataset) => dataset.id}
      selected={null}
      onSelectedChange={(dataset) => dataset && onOpen(dataset.id)}
      noun="dataset"
      storageKey={FINDING_PANEL_WIDTH_KEY}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
        <InspectorTable.Root table={table}>
          <InspectorTable.Grid aria-label={i18n.t("lens.datasetsView.datasetsAria", { defaultValue: "Datasets" })} className="text-xs md:min-w-[720px]">
            <InspectorTable.Header />
            <InspectorTable.Body<DatasetSummary> rowHeight={() => (desktop ? DATASET_HEIGHT : 48)}>
              {(row) => (
                <InspectorTable.Row
                  row={row}
                  item={row.original}
                  tabIndex={0}
                  aria-label={row.original.name}
                  className="group h-12 md:h-9"
                />
              )}
            </InspectorTable.Body>
          </InspectorTable.Grid>
        </InspectorTable.Root>
        <footer className="flex h-8 shrink-0 items-center border-t bg-muted/30 px-3 text-xs text-muted-foreground">
          {i18n.t("lens.datasetsView.dataset", { count: datasets.length })} · {i18n.t("lens.datasetsView.case", { count: cases })}
        </footer>
      </div>
    </Inspector.Root>
  );
}
