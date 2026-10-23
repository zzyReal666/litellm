"use client";

import i18n from "@/lib/i18n";
import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, IdentityCell, MoneyCell } from "@/components/shared/table_cells";
import { DeletedKeyResponse } from "@/app/(dashboard)/hooks/keys/useKeys";
import { userDetailHref } from "@/utils/entityLinks";

function TruncatedTextCell({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60 truncate" title={value}>
      {value}
    </span>
  );
}

function UserLinkCell({ userId }: { userId: string | null | undefined }) {
  if (!userId) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-60" title={userId}>
      <IdentityCell title={userId} titleClassName="font-normal" href={userDetailHref(userId)} />
    </span>
  );
}

export const getDeletedKeysTableColumns = (): ColumnDef<DeletedKeyResponse>[] => [
  {
    id: "token",
    accessorKey: "token",
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colKeyId", { defaultValue: "Key ID" }) },
    header: i18n.t("deletedKeys.deletedKeysTable.colKeyId", { defaultValue: "Key ID" }),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.token} variant="plain" />,
  },
  {
    id: "key_alias",
    accessorKey: "key_alias",
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colKeyAlias", { defaultValue: "Key Alias" }) },
    header: i18n.t("deletedKeys.deletedKeysTable.colKeyAlias", { defaultValue: "Key Alias" }),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const value = row.original.key_alias;
      if (!value) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <span className="block max-w-60 truncate font-mono text-xs" title={value}>
          {value}
        </span>
      );
    },
  },
  {
    id: "team_alias",
    accessorKey: "team_alias",
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colTeamAlias", { defaultValue: "Team Alias" }) },
    header: i18n.t("deletedKeys.deletedKeysTable.colTeamAlias", { defaultValue: "Team Alias" }),
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.team_alias} />,
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
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colBudget", { defaultValue: "Budget (CNY)" }), numeric: true },
    header: i18n.t("deletedKeys.deletedKeysTable.colBudget", { defaultValue: "Budget (CNY)" }),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <MoneyCell value={row.original.max_budget} decimals={0} emptyText={i18n.t("deletedKeys.deletedKeysTable.unlimited", { defaultValue: "Unlimited" })} showZero />,
  },
  {
    id: "user_email",
    accessorKey: "user_email",
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colUserEmail", { defaultValue: "User Email" }) },
    header: i18n.t("deletedKeys.deletedKeysTable.colUserEmail", { defaultValue: "User Email" }),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <TruncatedTextCell value={row.original.user_email} />,
  },
  {
    id: "user_id",
    accessorKey: "user_id",
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colUserId", { defaultValue: "User ID" }) },
    header: i18n.t("deletedKeys.deletedKeysTable.colUserId", { defaultValue: "User ID" }),
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <UserLinkCell userId={row.original.user_id} />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: { title: i18n.t("common.createdAt", { defaultValue: "Created At" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("common.createdAt", { defaultValue: "Created At" })} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colCreatedBy", { defaultValue: "Created By" }) },
    header: i18n.t("deletedKeys.deletedKeysTable.colCreatedBy", { defaultValue: "Created By" }),
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <UserLinkCell userId={row.original.created_by} />,
  },
  {
    id: "deleted_at",
    accessorKey: "deleted_at",
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colDeletedAt", { defaultValue: "Deleted At" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("deletedKeys.deletedKeysTable.colDeletedAt", { defaultValue: "Deleted At" })} />,
    size: 120,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.deleted_at} precision="date" />,
  },
  {
    id: "deleted_by",
    accessorKey: "deleted_by",
    meta: { title: i18n.t("deletedKeys.deletedKeysTable.colDeletedBy", { defaultValue: "Deleted By" }) },
    header: i18n.t("deletedKeys.deletedKeysTable.colDeletedBy", { defaultValue: "Deleted By" }),
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <UserLinkCell userId={row.original.deleted_by} />,
  },
];
