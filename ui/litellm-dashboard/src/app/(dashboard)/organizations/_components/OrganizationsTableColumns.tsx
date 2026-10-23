"use client";

import i18n from "@/lib/i18n";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell, ModelsCell, MoneyCell } from "@/components/shared/table_cells";
import { Organization } from "@/components/networking";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

interface OrganizationBudget {
  max_budget?: number | null;
  tpm_limit?: number | null;
  rpm_limit?: number | null;
}

const getOrganizationBudget = (organization: Organization): OrganizationBudget =>
  (organization.litellm_budget_table ?? {}) as OrganizationBudget;

function OrganizationLimitsCell({ organization }: { organization: Organization }) {
  const { tpm_limit, rpm_limit } = getOrganizationBudget(organization);
  return (
    <div className="flex flex-col text-xs text-muted-foreground">
      <span>TPM: {tpm_limit ?? i18n.t("organizations.unlimited", { defaultValue: "Unlimited" })}</span>
      <span>RPM: {rpm_limit ?? i18n.t("organizations.unlimited", { defaultValue: "Unlimited" })}</span>
    </div>
  );
}

interface OrganizationRowActionsProps {
  organization: Organization;
  onEditClick: (organizationId: string) => void;
  onDeleteClick: (organizationId: string) => void;
}

function OrganizationRowActions({ organization, onEditClick, onDeleteClick }: OrganizationRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={i18n.t("organizations.openOrganizationActions", { defaultValue: "Open organization actions" })}
        data-testid={`organization-actions-${organization.organization_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="organization-action-edit"
          onClick={() => onEditClick(organization.organization_id)}
        >
          <Pencil />
          {i18n.t("common.edit", { defaultValue: "Edit" })}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          data-testid="organization-action-delete"
          onClick={() => onDeleteClick(organization.organization_id)}
        >
          <Trash2 />
          {i18n.t("common.delete", { defaultValue: "Delete" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface OrganizationsTableColumnsDeps {
  userRole: string;
  onOrganizationClick: (organizationId: string) => void;
  onEditClick: (organizationId: string) => void;
  onDeleteClick: (organizationId: string) => void;
}

export const getOrganizationsTableColumns = ({
  userRole,
  onOrganizationClick,
  onEditClick,
  onDeleteClick,
}: OrganizationsTableColumnsDeps): ColumnDef<Organization>[] => [
  {
    id: "organization_id",
    accessorKey: "organization_id",
    meta: { title: i18n.t("organizations.colOrgId", { defaultValue: "Organization ID" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("organizations.colOrgId", { defaultValue: "Organization ID" })} />,
    size: 220,
    enableSorting: true,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.organization_id}
        titleClassName="font-mono text-xs font-normal"
        className="max-w-56"
        onClick={() => onOrganizationClick(row.original.organization_id)}
      />
    ),
  },
  {
    id: "organization_alias",
    accessorKey: "organization_alias",
    meta: { title: i18n.t("organizations.colOrgName", { defaultValue: "Organization Name" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("organizations.colOrgName", { defaultValue: "Organization Name" })} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => {
      const alias = row.original.organization_alias;
      return (
        <span className="block max-w-56 truncate text-sm font-medium" title={alias ?? undefined}>
          {alias || "-"}
        </span>
      );
    },
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    sortingFn: "datetime",
    meta: { title: i18n.t("oldTeams.columns.created", { defaultValue: "Created" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("oldTeams.columns.created", { defaultValue: "Created" })} />,
    size: 130,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: i18n.t("organization.organizationView.spendColumnTitle", { defaultValue: "Spend (CNY)" }), numeric: true },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("organization.organizationView.spendColumnTitle", { defaultValue: "Spend (CNY)" })} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "max_budget",
    meta: { title: i18n.t("organizations.colBudget", { defaultValue: "Budget (CNY)" }), numeric: true },
    header: i18n.t("organizations.colBudget", { defaultValue: "Budget (CNY)" }),
    size: 120,
    enableSorting: false,
    cell: ({ row }) => (
      <MoneyCell value={getOrganizationBudget(row.original).max_budget} decimals={2} emptyText={i18n.t("organizations.unlimited", { defaultValue: "Unlimited" })} showZero />
    ),
  },
  {
    id: "models",
    meta: { title: i18n.t("organizations.colModels", { defaultValue: "Models" }), skeleton: "chips" },
    header: i18n.t("organizations.colModels", { defaultValue: "Models" }),
    size: 260,
    enableSorting: false,
    cell: ({ row }) => <ModelsCell models={row.original.models} />,
  },
  {
    id: "limits",
    meta: { title: i18n.t("organizations.colTpmRpmLimits", { defaultValue: "TPM / RPM Limits" }) },
    header: i18n.t("organizations.colTpmRpmLimits", { defaultValue: "TPM / RPM Limits" }),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <OrganizationLimitsCell organization={row.original} />,
  },
  {
    id: "members",
    meta: { title: i18n.t("organizations.colMembers", { defaultValue: "Members" }), numeric: true },
    header: i18n.t("organizations.colMembers", { defaultValue: "Members" }),
    size: 100,
    enableSorting: false,
    cell: ({ row }) => <span className="text-sm">{i18n.t("organizations.memberCount", { count: row.original.members?.length ?? 0 })}</span>,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{i18n.t("common.actions", { defaultValue: "Actions" })}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) =>
      userRole === "Admin" ? (
        <div className="flex justify-end">
          <OrganizationRowActions organization={row.original} onEditClick={onEditClick} onDeleteClick={onDeleteClick} />
        </div>
      ) : null,
  },
];
