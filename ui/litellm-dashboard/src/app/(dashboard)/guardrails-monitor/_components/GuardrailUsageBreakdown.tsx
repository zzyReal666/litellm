import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { CircleDollarSign } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import type { GuardrailUsageDetail } from "@/app/(dashboard)/hooks/guardrails/useGuardrailsUsage";
import { CalcPopover, MathTable } from "@/components/GuardrailsMonitor/CalcPopover";
import { MetricCard } from "@/components/GuardrailsMonitor/MetricCard";
import { UnpricedNote } from "@/components/GuardrailsMonitor/UnpricedNote";
import {
  counterLabel,
  counterMathRow,
  formatCost,
  totalUnits,
  unitsMathRows,
  unpricedSummary,
} from "@/components/GuardrailsMonitor/usageUnits";
import { DataTable } from "@/components/shared/DataTable";
import { IdCell } from "@/components/shared/table_cells/id_cell";
import { MoneyCell } from "@/components/shared/table_cells/money_cell";

interface CounterRow {
  counter: string;
  units: number;
  cost: number | null;
  unpriced: number;
}

interface GroupRow {
  id: string;
  units: number;
  cost: number | null;
  unpriced: number;
}

const counterRows = (detail: GuardrailUsageDetail): CounterRow[] =>
  Object.entries(detail.usage_units).map(([counter, units]) => ({
    counter,
    units,
    cost: detail.cost_by_unit[counter] ?? null,
    unpriced: detail.untracked_usage_units[counter] ?? 0,
  }));

const groupRows = (
  unitsByGroup: GuardrailUsageDetail["usage_units_by_team"],
  costByGroup: GuardrailUsageDetail["cost_by_team"],
  untrackedByGroup: GuardrailUsageDetail["untracked_usage_units_by_team"],
): GroupRow[] =>
  Object.entries(unitsByGroup)
    .map(([id, units]) => ({
      id,
      units: totalUnits(units),
      cost: costByGroup[id] ?? null,
      unpriced: totalUnits(untrackedByGroup[id] ?? {}),
    }))
    .sort((a, b) => b.units - a.units);

const UnpricedUnitsCell = ({ unpriced }: { unpriced: number }) =>
  unpriced > 0 ? (
    <span className="text-warning">{unpriced.toLocaleString()}</span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

const unpricedColumn = <TRow extends { unpriced: number }>(t: TFunction): ColumnDef<TRow> => ({
  header: t("guardrailsMonitor.guardrailUsageBreakdown.unpricedUnitsColumn", { defaultValue: "Unpriced Units" }),
  accessorKey: "unpriced",
  meta: { numeric: true },
  cell: ({ row }) => <UnpricedUnitsCell unpriced={row.original.unpriced} />,
});

const counterColumns = (t: TFunction): ColumnDef<CounterRow>[] => [
  {
    header: t("guardrailsMonitor.guardrailUsageBreakdown.counterColumn", { defaultValue: "Counter" }),
    accessorKey: "counter",
    cell: ({ row }) => counterLabel(row.original.counter),
  },
  {
    header: t("guardrailsMonitor.guardrailUsageBreakdown.unitsColumn", { defaultValue: "Units" }),
    accessorKey: "units",
    meta: { numeric: true },
    cell: ({ row }) => row.original.units.toLocaleString(),
  },
  {
    header: t("guardrails.guardrailGardenDetail.propertyCost", { defaultValue: "Cost" }),
    accessorKey: "cost",
    meta: { numeric: true },
    cell: ({ row }) => <MoneyCell value={row.original.cost} emptyText="—" showZero />,
  },
  unpricedColumn<CounterRow>(t),
];

const groupColumns = (t: TFunction, label: string, emptyLabel: string): ColumnDef<GroupRow>[] => [
  {
    header: label,
    accessorKey: "id",
    cell: ({ row }) =>
      row.original.id ? (
        <IdCell value={row.original.id} variant="plain" copyable />
      ) : (
        <span className="text-muted-foreground">{emptyLabel}</span>
      ),
  },
  {
    header: t("guardrailsMonitor.guardrailUsageBreakdown.unitsColumn", { defaultValue: "Units" }),
    accessorKey: "units",
    meta: { numeric: true },
    cell: ({ row }) => row.original.units.toLocaleString(),
  },
  {
    header: t("guardrails.guardrailGardenDetail.propertyCost", { defaultValue: "Cost" }),
    accessorKey: "cost",
    meta: { numeric: true },
    cell: ({ row }) => <MoneyCell value={row.original.cost} emptyText="—" showZero />,
  },
  unpricedColumn<GroupRow>(t),
];

const CostMath = ({ counters, detail }: { counters: CounterRow[]; detail: GuardrailUsageDetail }) => {
  const { t } = useTranslation();
  return (
    <CalcPopover
      title={t("guardrailsMonitor.guardrailUsageBreakdown.howThisCostIsCalculated", {
        defaultValue: "How this cost is calculated",
      })}
      formula={t("guardrailsMonitor.guardrailUsageBreakdown.costFormula", {
        defaultValue: "priced units × price per unit = cost, per counter",
      })}
    >
      <MathTable rows={counters.map(counterMathRow)} total={formatCost(detail.cost)} />
      <p className="text-xs text-muted-foreground">
        {t("guardrailsMonitor.guardrailUsageBreakdown.perUnitPriceNote", {
          defaultValue: "Per-unit prices come from the cost map LiteLLM ships with.",
        })}
      </p>
      <UnpricedNote unpriced={detail.untracked_usage_units} provider={detail.provider} />
    </CalcPopover>
  );
};

const UnitsMath = ({ units }: { units: GuardrailUsageDetail["usage_units"] }) => {
  const { t } = useTranslation();
  return (
    <CalcPopover
      title={t("guardrailsMonitor.guardrailUsageBreakdown.howUnitsAddUp", { defaultValue: "How usage units add up" })}
      formula={t("guardrailsMonitor.guardrailUsageBreakdown.unitsFormula", {
        defaultValue: "counter + counter + … = usage units",
      })}
    >
      <MathTable rows={unitsMathRows(units)} total={totalUnits(units).toLocaleString()} />
      <p className="text-xs text-muted-foreground">
        {t("guardrailsMonitor.guardrailUsageBreakdown.unitsNote", {
          defaultValue:
            "Units are the billable counters the provider reported for this guardrail, added up over every call.",
        })}
      </p>
    </CalcPopover>
  );
};

const TableHeading = ({ title }: { title: string }) => (
  <h6 className="text-sm font-semibold text-foreground">{title}</h6>
);

export function GuardrailUsageBreakdown({ detail }: { detail: GuardrailUsageDetail }) {
  const { t } = useTranslation();
  const counters = counterRows(detail);
  const unpriced = unpricedSummary(detail.untracked_usage_units);

  return (
    <section
      className="space-y-4"
      aria-label={t("guardrailsMonitor.guardrailUsageBreakdown.sectionLabel", { defaultValue: "Usage and cost" })}
    >
      <div>
        <h5 className="mb-0 text-base font-semibold text-foreground">
          {t("guardrailsMonitor.guardrailUsageBreakdown.title", { defaultValue: "Usage & Cost" })}
        </h5>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("guardrailsMonitor.guardrailUsageBreakdown.subtitle", {
            defaultValue: "Billable units the provider reported for this guardrail and what LiteLLM priced them at",
          })}
        </p>
      </div>

      {counters.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("guardrailsMonitor.guardrailUsageBreakdown.noBillableUnits", {
            defaultValue: "No billable usage units were recorded in this period.",
          })}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard
              label={t("guardrails.guardrailGardenDetail.propertyCost", { defaultValue: "Cost" })}
              value={formatCost(detail.cost)}
              valueColor={detail.cost != null ? "text-foreground" : "text-muted-foreground"}
              icon={<CircleDollarSign className="size-4" />}
              subtitle={unpriced ?? undefined}
              hint={<CostMath counters={counters} detail={detail} />}
            />
            <MetricCard
              label={t("guardrailsMonitor.guardrailUsageBreakdown.usageUnitsLabel", { defaultValue: "Usage Units" })}
              value={totalUnits(detail.usage_units).toLocaleString()}
              subtitle={t("guardrailsMonitor.guardrailUsageBreakdown.counterCount", {
                count: counters.length,
                defaultValue: "{{count}} counters",
              })}
              hint={<UnitsMath units={detail.usage_units} />}
            />
          </div>

          <DataTable
            columns={counterColumns(t)}
            data={counters}
            getRowId={(row) => row.counter}
            size="compact"
            toolbar={() => (
              <TableHeading
                title={t("guardrailsMonitor.guardrailUsageBreakdown.byCounter", { defaultValue: "By counter" })}
              />
            )}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <DataTable
              columns={groupColumns(
                t,
                t("createUserButton.teamLabel", { defaultValue: "Team" }),
                t("guardrailsMonitor.guardrailUsageBreakdown.noTeam", { defaultValue: "No team" }),
              )}
              data={groupRows(detail.usage_units_by_team, detail.cost_by_team, detail.untracked_usage_units_by_team)}
              getRowId={(row) => row.id || "no-team"}
              size="compact"
              toolbar={() => (
                <TableHeading
                  title={t("guardrailsMonitor.guardrailUsageBreakdown.byTeam", { defaultValue: "By team" })}
                />
              )}
            />
            <DataTable
              columns={groupColumns(
                t,
                t("toolDetail.scopeKey", { defaultValue: "Key" }),
                t("guardrailsMonitor.guardrailUsageBreakdown.noKey", { defaultValue: "No key" }),
              )}
              data={groupRows(detail.usage_units_by_key, detail.cost_by_key, detail.untracked_usage_units_by_key)}
              getRowId={(row) => row.id || "no-key"}
              size="compact"
              toolbar={() => (
                <TableHeading
                  title={t("guardrailsMonitor.guardrailUsageBreakdown.byKey", { defaultValue: "By key" })}
                />
              )}
            />
          </div>
        </>
      )}
    </section>
  );
}
