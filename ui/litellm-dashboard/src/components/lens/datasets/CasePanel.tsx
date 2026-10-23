"use client";

import { useId, type ReactNode } from "react";
import { SquareArrowOutUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useOpenSourceTrace } from "../route";
import { MessageList } from "../traces/detail/content/Messages";
import { Section } from "../traces/detail/content/Section";
import { IdChip } from "../traces/ui/IdChip";
import { caseConversation, caseOutput, shortCaseId, type CaseEdit } from "./caseView";
import type { DatasetCase } from "./types";
import i18n from "@/lib/i18n";

export interface CasePanelProps {
  readonly item: DatasetCase;
  readonly datasetName: string;
  readonly editable: boolean;
  readonly onEdit: (edit: CaseEdit) => void;
}

export function CasePanel({ item, datasetName, editable, onEdit }: CasePanelProps) {
  return (
    <Tabs defaultValue="case" className="min-h-0 flex-1 gap-0">
      <header className="flex shrink-0 flex-col gap-1.5 px-4 pt-3 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="min-w-0 truncate text-base font-semibold text-foreground">
            Case #{shortCaseId(item.id)} <span className="font-normal text-muted-foreground">@ {datasetName}</span>
          </h2>
          <IdChip value={item.id} label={i18n.t("lens.casePanel.copyCaseId", { defaultValue: "Copy case ID" })} />
          <label className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {i18n.t("lens.casePanel.included", { defaultValue: "Included" })}
            <Switch
              size="sm"
              checked={item.included}
              disabled={!editable}
              onCheckedChange={(included) => onEdit({ included })}
            />
          </label>
        </div>
      </header>
      <div className="shrink-0 border-b px-4">
        <TabsList variant="line" aria-label={i18n.t("lens.casePanel.caseSectionsAria", { defaultValue: "Case sections" })} className="h-9 gap-4 px-0">
          <TabsTrigger value="case" className="flex-none px-0 text-sm">
            {i18n.t("lens.casePanel.case", { defaultValue: "Case" })}
          </TabsTrigger>
          <TabsTrigger value="source" className="flex-none px-0 text-sm">
            {i18n.t("lens.casePanel.source", { defaultValue: "Source" })}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="case" className="min-h-0 overflow-auto pt-1">
        <CaseBody item={item} editable={editable} onEdit={onEdit} />
      </TabsContent>
      <TabsContent value="source" className="min-h-0 overflow-auto">
        <SourceBody item={item} />
      </TabsContent>
    </Tabs>
  );
}

function CaseBody({ item, editable, onEdit }: Omit<CasePanelProps, "datasetName">) {
  const expectedId = useId();
  const conversation = caseConversation(item);
  const output = caseOutput(item);
  return (
    <>
      <Section title={i18n.t("lens.casePanel.input", { defaultValue: "Input" })} count={conversation.length}>
        {conversation.length ? <MessageList messages={conversation} /> : <Empty>{i18n.t("lens.casePanel.noConversationRecorded", { defaultValue: "No conversation recorded" })}</Empty>}
      </Section>
      <Section title={i18n.t("lens.casePanel.output", { defaultValue: "Output" })}>
        {output.length ? <MessageList messages={output} /> : <Empty>{i18n.t("lens.casePanel.noReplyRecorded", { defaultValue: "No reply recorded" })}</Empty>}
      </Section>
      <section aria-label={i18n.t("lens.casePanel.expected", { defaultValue: "Expected" })} className="flex flex-col gap-2 px-4 pt-2 pb-5">
        <label htmlFor={expectedId} className="text-sm font-semibold text-foreground">
          {i18n.t("lens.casePanel.expected", { defaultValue: "Expected" })}
        </label>
        {editable ? (
          <Textarea
            id={expectedId}
            value={item.expected}
            placeholder={i18n.t("lens.casePanel.expectedPlaceholder", { defaultValue: "What a good reply looks like" })}
            className="min-h-24 bg-background text-sm"
            onChange={(event) => onEdit({ expected: event.target.value })}
          />
        ) : (
          <p id={expectedId} className="text-sm whitespace-pre-wrap text-foreground">
            {item.expected || <span className="text-muted-foreground italic">{i18n.t("lens.casePanel.notSet", { defaultValue: "Not set" })}</span>}
          </p>
        )}
      </section>
    </>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground italic">{children}</p>;
}

const SOURCE_FIELDS = [
  [i18n.t("lens.casePanel.fieldTrace", { defaultValue: "Trace" }), "trace_id"],
  [i18n.t("lens.casePanel.fieldSpan", { defaultValue: "Span" }), "span_id"],
  [i18n.t("lens.casePanel.fieldFinding", { defaultValue: "Finding" }), "finding_id"],
  [i18n.t("lens.casePanel.fieldInvestigation", { defaultValue: "Investigation" }), "lens_id"],
] as const;

function SourceBody({ item }: { item: DatasetCase }) {
  const openSourceTrace = useOpenSourceTrace();
  const { source } = item;
  return (
    <div className="flex flex-col gap-4 p-4">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-2 text-sm">
        {SOURCE_FIELDS.map(([label, key]) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="flex min-w-0 items-center gap-1">
              {source[key] ? (
                <IdChip value={source[key]} label={i18n.t("lens.casePanel.copyFieldId", { field: label, defaultValue: `Copy ${label.toLowerCase()} ID` })} showValue />
              ) : (
                <span className="text-muted-foreground italic">{i18n.t("lens.casePanel.none", { defaultValue: "None" })}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {source.trace_id && (
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() =>
            openSourceTrace({ traceId: source.trace_id, traceRef: source.trace_ref, spanId: source.span_id })
          }
        >
          {i18n.t("lens.casePanel.openSourceTrace", { defaultValue: "Open source trace" })}
          <SquareArrowOutUpRight className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
