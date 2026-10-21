"use client";

import i18n from "@/lib/i18n";
import { ColumnDef } from "@tanstack/react-table";

import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { KeyResponse } from "@/components/key_team_helpers/key_list";
import { CellTooltip, DateCell, IdentityCell } from "@/components/shared/table_cells";
import { keyDetailHref } from "@/utils/entityLinks";

function OwnerCell({ record }: { record: KeyResponse }) {
  const email = record.user?.user_email ?? record.user_id ?? null;
  if (!email) return <span className="text-sm">—</span>;
  return (
    <CellTooltip
      content={email}
      trigger={
        <span className="inline-flex max-w-60 truncate">
          <DefaultProxyAdminTag userId={email} />
        </span>
      }
    />
  );
}

export const getProjectKeysTableColumns = (): ColumnDef<KeyResponse>[] => [
  {
    id: "key_alias",
    accessorKey: "key_alias",
    meta: { title: i18n.t("projects.projectKeysTable.colKeyName", { defaultValue: "Key Name" }) },
    header: i18n.t("projects.projectKeysTable.colKeyName", { defaultValue: "Key Name" }),
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={<span title={row.original.key_alias ?? undefined}>{row.original.key_alias || "—"}</span>}
        href={row.original.token ? keyDetailHref(row.original.token) : undefined}
        className="max-w-60"
      />
    ),
  },
  {
    id: "owner",
    meta: { title: i18n.t("projects.projectKeysTable.colOwner", { defaultValue: "Owner" }) },
    header: i18n.t("projects.projectKeysTable.colOwner", { defaultValue: "Owner" }),
    enableSorting: false,
    cell: ({ row }) => <OwnerCell record={row.original} />,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: { title: i18n.t("oldTeams.columns.created", { defaultValue: "Created" }) },
    header: i18n.t("oldTeams.columns.created", { defaultValue: "Created" }),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "last_active",
    accessorKey: "last_active",
    meta: { title: i18n.t("projects.projectKeysTable.colLastActive", { defaultValue: "Last Active" }) },
    header: i18n.t("projects.projectKeysTable.colLastActive", { defaultValue: "Last Active" }),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.last_active} precision="date" fallback={i18n.t("common.never", { defaultValue: "Never" })} />,
  },
];
