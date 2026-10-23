"use client";

import i18n from "@/lib/i18n";
import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, IdentityCell, ModelsCell, MoneyCell } from "@/components/shared/table_cells";
import { DeletedTeam } from "@/app/(dashboard)/hooks/teams/useTeams";
import { orgDetailHref, userDetailHref } from "@/utils/entityLinks";

function EntityCell({ value, href }: { value: string | null | undefined; href: string | undefined }) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60" title={value}>
      <IdentityCell title={value} titleClassName="font-normal" href={href} />
    </span>
  );
}

export const getDeletedTeamsTableColumns = (): ColumnDef<DeletedTeam>[] => [
  {
    id: "team_alias",
    accessorKey: "team_alias",
    meta: { title: i18n.t("deletedTeams.deletedTeamsTable.colTeamName", { defaultValue: "Team Name" }) },
    header: i18n.t("deletedTeams.deletedTeamsTable.colTeamName", { defaultValue: "Team Name" }),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original.team_alias;
      if (!value) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="block max-w-60 truncate font-medium" title={value}>
          {value}
        </span>
      );
    },
  },
  {
    id: "team_id",
    accessorKey: "team_id",
    meta: { title: i18n.t("deletedTeams.deletedTeamsTable.colTeamId", { defaultValue: "Team ID" }) },
    header: i18n.t("deletedTeams.deletedTeamsTable.colTeamId", { defaultValue: "Team ID" }),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.team_id} variant="plain" />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: { title: i18n.t("deletedTeams.deletedTeamsTable.colCreated", { defaultValue: "Created" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("deletedTeams.deletedTeamsTable.colCreated", { defaultValue: "Created" })} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: i18n.t("organization.organizationView.spendColumnTitle", { defaultValue: "Spend (CNY)" }), numeric: true },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("organization.organizationView.spendColumnTitle", { defaultValue: "Spend (CNY)" })} />,
    size: 100,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "max_budget",
    accessorKey: "max_budget",
    meta: { title: i18n.t("deletedTeams.deletedTeamsTable.colBudget", { defaultValue: "Budget (CNY)" }), numeric: true },
    header: i18n.t("deletedTeams.deletedTeamsTable.colBudget", { defaultValue: "Budget (CNY)" }),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.max_budget} decimals={0} emptyText={i18n.t("deletedTeams.deletedTeamsTable.unlimited", { defaultValue: "Unlimited" })} showZero />,
  },
  {
    id: "models",
    accessorKey: "models",
    meta: { title: i18n.t("deletedTeams.deletedTeamsTable.colModels", { defaultValue: "Models" }), skeleton: "chips" },
    header: i18n.t("deletedTeams.deletedTeamsTable.colModels", { defaultValue: "Models" }),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <ModelsCell models={row.original.models} />,
  },
  {
    id: "organization_id",
    accessorKey: "organization_id",
    meta: { title: i18n.t("deletedTeams.deletedTeamsTable.colOrganization", { defaultValue: "Organization" }) },
    header: i18n.t("deletedTeams.deletedTeamsTable.colOrganization", { defaultValue: "Organization" }),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const orgId = row.original.organization_id;
      return <EntityCell value={orgId} href={orgId ? orgDetailHref(orgId) : undefined} />;
    },
  },
  {
    id: "deleted_at",
    accessorKey: "deleted_at",
    meta: { title: i18n.t("deletedTeams.deletedTeamsTable.colDeletedAt", { defaultValue: "Deleted At" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("deletedTeams.deletedTeamsTable.colDeletedAt", { defaultValue: "Deleted At" })} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.deleted_at} precision="date" />,
  },
  {
    id: "deleted_by",
    accessorKey: "deleted_by",
    meta: { title: i18n.t("deletedTeams.deletedTeamsTable.colDeletedBy", { defaultValue: "Deleted By" }) },
    header: i18n.t("deletedTeams.deletedTeamsTable.colDeletedBy", { defaultValue: "Deleted By" }),
    size: 120,
    enableSorting: false,
    cell: ({ row }) => {
      const deletedBy = row.original.deleted_by;
      return <EntityCell value={deletedBy} href={deletedBy ? userDetailHref(deletedBy) : undefined} />;
    },
  },
];
