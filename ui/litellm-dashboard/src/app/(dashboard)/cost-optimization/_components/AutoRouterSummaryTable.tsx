import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { groupKey, groupLabel, pctLabel, type AutoRouterBenchmarkGroup } from "./autoRouterBenchmarks";
import { usd } from "./costOptimizationUtils";
import i18n from "@/lib/i18n";

interface AutoRouterSummaryTableProps {
  groups: readonly AutoRouterBenchmarkGroup[];
  selectedGroup: AutoRouterBenchmarkGroup | null;
}

export default function AutoRouterSummaryTable({ groups, selectedGroup }: AutoRouterSummaryTableProps) {
  const visibleGroups = selectedGroup ? [selectedGroup] : groups;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{i18n.t("costOptimization.autoRouterSummaryTable.title", { defaultValue: "Router usage and savings" })}</CardTitle>
        <CardDescription>
          {i18n.t("costOptimization.autoRouterSummaryTable.description", { defaultValue: "Selected UTC days. Cost includes LLM calls and classification. Tokens count routed LLM input and output." })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label={i18n.t("costOptimization.autoRouterSummaryTable.title", { defaultValue: "Router usage and savings" })}>
          <TableHeader>
            <TableRow>
              <TableHead>{i18n.t("costOptimization.autoRouterSummaryTable.colAutoRouter", { defaultValue: "Auto-router" })}</TableHead>
              <TableHead className="text-right whitespace-normal">{i18n.t("costOptimization.autoRouterSummaryTable.colTokensThroughRouter", { defaultValue: "Tokens through router" })}</TableHead>
              <TableHead className="text-right whitespace-normal">{i18n.t("costOptimization.autoRouterSummaryTable.colCostViaRouter", { defaultValue: "Cost via router" })}</TableHead>
              <TableHead className="text-right whitespace-normal">{i18n.t("costOptimization.autoRouterSummaryTable.colCostPerMTokens", { defaultValue: "Cost per 1M tokens" })}</TableHead>
              <TableHead className="text-right whitespace-normal">{i18n.t("costOptimization.autoRouterSummaryTable.colSavedVsPremium", { defaultValue: "Saved vs. premium model" })}</TableHead>
              <TableHead className="text-right">{i18n.t("costOptimization.autoRouterSummaryTable.colPctSaved", { defaultValue: "% saved" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {i18n.t("costOptimization.autoRouterSummaryTable.noAutoRouters", { defaultValue: "No auto-routers in this range" })}
                </TableCell>
              </TableRow>
            ) : (
              visibleGroups.map((group) => (
                <TableRow key={groupKey(group)}>
                  <TableCell className="font-medium">{groupLabel(group, groups)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.total_tokens == null ? i18n.t("costOptimization.autoRouterSummaryTable.unavailable", { defaultValue: "Unavailable" }) : group.total_tokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{usd(group.spend)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.total_tokens != null && group.total_tokens > 0
                      ? usd((group.spend * 1_000_000) / group.total_tokens)
                      : i18n.t("costOptimization.autoRouterSummaryTable.unavailable", { defaultValue: "Unavailable" })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.saved_spend == null ? i18n.t("costOptimization.autoRouterSummaryTable.unavailable", { defaultValue: "Unavailable" }) : usd(group.saved_spend)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.saved_pct == null ? i18n.t("costOptimization.autoRouterSummaryTable.unavailable", { defaultValue: "Unavailable" }) : pctLabel(group.saved_pct)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          {i18n.t("costOptimization.autoRouterSummaryTable.savingsFootnote", { defaultValue: "Savings are estimated against each router's premium baseline. Token totals and unit costs are unavailable for usage recorded before token tracking; unit cost also requires nonzero tokens." })}
        </p>
      </CardContent>
    </Card>
  );
}
