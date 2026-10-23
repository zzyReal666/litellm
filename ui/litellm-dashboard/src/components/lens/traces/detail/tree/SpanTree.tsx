"use client";

import { ChartGantt, ListTree, MoreHorizontal, PanelRightOpen, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cva.config";
import i18n from "@/lib/i18n";

import type { TreeRow } from "../../tree";
import type { TraceSummary } from "../../types";
import { treeGuides } from "../../utils";
import { BAR_TRACK, tickLabel, timeTicks } from "./timeline";
import { GroupRow, LoadMoreRow, type RowContext, SpanRow, type TreeLayout } from "./TreeRows";

interface SpanTreeProps {
  rows: TreeRow[];
  summary: TraceSummary;
  selectedId: string;
  layout: TreeLayout;
  onLayoutChange: (layout: TreeLayout) => void;
  hideFramework: boolean;
  onSelect: (id: string) => void;
  onToggleHideFramework: (checked: boolean) => void;
  onToggleSpan: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onLoadMore: (groupId: string) => void;
  onOpenDetails?: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  errorsOnly: boolean;
  onErrorsOnlyChange: (enabled: boolean) => void;
  filtering: boolean;
  onClearFilters: () => void;
  onCollapseAll: () => void;
}

const LAYOUTS: readonly { id: TreeLayout; label: string; icon: typeof ListTree }[] = [
  { id: "tree", label: i18n.t("lens.spanTree.layoutTree", { defaultValue: "Tree" }), icon: ListTree },
  { id: "waterfall", label: i18n.t("lens.spanTree.layoutWaterfall", { defaultValue: "Waterfall" }), icon: ChartGantt },
];

function LayoutSwitch({ layout, onChange }: { layout: TreeLayout; onChange: (layout: TreeLayout) => void }) {
  return (
    <div role="radiogroup" aria-label={i18n.t("lens.spanTree.stepLayoutAria", { defaultValue: "Step layout" })} className="flex items-center rounded-md bg-muted p-0.5">
      {LAYOUTS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={layout === id}
          aria-label={label}
          title={label}
          onClick={() => onChange(id)}
          className={cn(
            "grid h-6 w-7 place-items-center rounded-sm transition-colors duration-150 motion-reduce:transition-none",
            layout === id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs transition-colors duration-150 motion-reduce:transition-none",
        pressed ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function TimeAxis({ totalMs }: { totalMs: number }) {
  return (
    <div aria-hidden="true" className="sticky top-0 z-raised flex h-6 items-end border-b bg-background pr-7 pl-2">
      <span className="flex-1" />
      <span className={cn("relative h-full shrink-0 border-l border-border/60", BAR_TRACK)}>
        {timeTicks(totalMs, 4).map((tick) => (
          <span
            key={tick}
            className="absolute bottom-1 -translate-x-1/2 text-xs text-muted-foreground tabular-nums first:translate-x-0"
            style={{ left: `${totalMs > 0 ? (tick / totalMs) * 100 : 0}%` }}
          >
            {tickLabel(tick)}
          </span>
        ))}
      </span>
    </div>
  );
}

export function SpanTree({
  rows,
  summary,
  selectedId,
  layout,
  onLayoutChange,
  hideFramework,
  onSelect,
  onToggleHideFramework,
  onToggleSpan,
  onToggleGroup,
  onLoadMore,
  onOpenDetails,
  query,
  onQueryChange,
  errorsOnly,
  onErrorsOnlyChange,
  filtering,
  onClearFilters,
  onCollapseAll,
}: SpanTreeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const guides = useMemo(() => treeGuides(rows.map((row) => row.depth)), [rows]);
  const traceStartMs = Date.parse(summary.start_time);

  useEffect(() => {
    scrollRef.current
      ?.querySelector(`[data-row-id="${CSS.escape(selectedId)}"]`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [selectedId]);

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col border-r border-border bg-background"
      aria-label={i18n.t("lens.spanTree.runSpansAria", { defaultValue: "Run spans" })}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {i18n.t("lens.spanTree.steps", { defaultValue: "Steps" })}{" "}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground tabular-nums">
              {filtering
                ? i18n.t("lens.spanTree.filteredOf", { filtered: rows.length.toLocaleString(), total: summary.span_count.toLocaleString() })
                : summary.span_count.toLocaleString()}
            </span>
          </span>
          <div className="ml-auto flex items-center gap-1">
            <LayoutSwitch layout={layout} onChange={onLayoutChange} />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={i18n.t("lens.spanTree.stepDisplayOptions", { defaultValue: "Step display options" })} />}>
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuCheckboxItem checked={hideFramework} onCheckedChange={onToggleHideFramework}>
                  {i18n.t("lens.spanTree.hideFrameworkSpans", { defaultValue: "Hide framework spans" })}
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCollapseAll}>{i18n.t("lens.spanTree.collapseBranches", { defaultValue: "Collapse branches" })}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {onOpenDetails && (
              <Button variant="ghost" size="icon-xs" onClick={onOpenDetails} aria-label={i18n.t("lens.spanTree.showDetails", { defaultValue: "Show details" })}>
                <PanelRightOpen className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={i18n.t("lens.spanTree.searchSteps", { defaultValue: "Search steps" })}
              placeholder={i18n.t("lens.spanTree.filterSteps", { defaultValue: "Filter steps" })}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="h-7 pr-7 pl-7 text-xs shadow-none md:text-xs"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={i18n.t("lens.spanTree.clearStepSearch", { defaultValue: "Clear step search" })}
                className="absolute top-1/2 right-0.5 -translate-y-1/2"
                onClick={() => onQueryChange("")}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
          <FilterChip pressed={!errorsOnly} onClick={() => onErrorsOnlyChange(false)}>
            {i18n.t("common.all", { defaultValue: "All" })}
          </FilterChip>
          <FilterChip pressed={errorsOnly} onClick={() => onErrorsOnlyChange(true)}>
            {i18n.t("lens.spanTree.errors", { defaultValue: "Errors" })}
            <span
              className={cn("tabular-nums", summary.error_count > 0 ? "text-destructive" : "text-muted-foreground")}
            >
              {summary.error_count}
            </span>
          </FilterChip>
          {filtering && (
            <span role="status" className="sr-only">
              {i18n.t("lens.spanTree.foundCount", { count: rows.length, defaultValue: `${rows.length} found` })}
            </span>
          )}
        </div>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto pb-2">
        {layout === "waterfall" && rows.length > 0 && <TimeAxis totalMs={summary.duration_ms} />}
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            <p>{i18n.t("lens.spanTree.noMatchingSteps", { defaultValue: "No matching steps" })}</p>
            <Button variant="link" size="sm" onClick={onClearFilters}>
              {i18n.t("lens.spanTree.clearFilters", { defaultValue: "Clear filters" })}
            </Button>
          </div>
        )}
        <div role="tree" aria-label={i18n.t("lens.spanTree.spansInTimeOrder", { defaultValue: "Spans in time order" })} className="pt-1">
          {rows.map((row, i) => {
            if (row.kind === "load-more")
              return <LoadMoreRow key={row.id} row={row} guide={guides[i]} onLoadMore={onLoadMore} />;
            const ctx: RowContext = {
              guide: guides[i],
              selected: selectedId === row.id,
              layout,
              traceStartMs,
              totalMs: summary.duration_ms,
              filtering,
              onSelect,
              onToggleSpan,
              onToggleGroup,
            };
            return row.kind === "group" ? (
              <GroupRow key={row.id} row={row} ctx={ctx} />
            ) : (
              <SpanRow key={row.id} row={row} ctx={ctx} />
            );
          })}
        </div>
      </div>
    </section>
  );
}
