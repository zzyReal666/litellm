"use client";

import { Info } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";

import { DataTableMultiSortHeader, DataTableSortHeader, type DataTableSortField } from "@/components/shared/DataTable";
import { inheritedBudgetGates } from "@/components/shared/InheritedBudgetHint";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DateCell,
  ENTITY_CELL_TITLE_CLASSES,
  IdCell,
  IdentityCell,
  ModelsCell,
  SpendBudgetCell,
  StatusBadge,
  UserPopoverCell,
  type StatusTone,
} from "@/components/shared/table_cells";
import { orgDetailHref, teamDetailHref } from "@/utils/entityLinks";

import { KeyResponse, Team } from "../key_team_helpers/key_list";
import { Organization } from "../networking";

interface KeyStatus {
  tone: StatusTone;
  label: string;
  tooltip?: string;
}

interface SpendBudgetSortField extends DataTableSortField {
  labelKey: string;
}

const SPEND_BUDGET_SORT_FIELDS: SpendBudgetSortField[] = [
  { id: "spend", labelKey: "usage.colSpend", label: "Spend" },
  { id: "max_budget", labelKey: "templates.keyInfoView.budget", label: "Budget" },
];

export const KEY_TABLE_SORT_FIELDS: readonly string[] = [
  "key_alias",
  "token",
  "created_at",
  "updated_at",
  ...SPEND_BUDGET_SORT_FIELDS.map((field) => field.id),
];

const getKeyStatus = (key: KeyResponse, t: TFunction): KeyStatus => {
  if (key.blocked === true) {
    const isScimBlocked = (key.metadata as Record<string, unknown> | null | undefined)?.scim_blocked === true;
    return {
      tone: "error",
      label: t("virtualKeys.virtualKeysTable.blocked", { defaultValue: "Blocked" }),
      tooltip: isScimBlocked
        ? t("virtualKeys.virtualKeysTable.blockedByScimReason", {
            defaultValue: "Blocked by SCIM (external identity provider deactivated or deleted the owning user).",
          })
        : t("virtualKeys.virtualKeysTable.blockedReason", {
            defaultValue: "Blocked. Requests using this key will be rejected with 401.",
          }),
    };
  }
  const expiresAt = key.expires ? Date.parse(key.expires) : Number.NaN;
  if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
    return {
      tone: "warning",
      label: t("usageIndicator.expired", { defaultValue: "Expired" }),
      tooltip: t("virtualKeys.virtualKeysTable.expiredReason", {
        defaultValue: "This key has passed its expiry date.",
      }),
    };
  }
  return {
    tone: "success",
    label: t("common.active", { defaultValue: "Active" }),
    tooltip: t("virtualKeys.virtualKeysTable.activeReason", {
      defaultValue: "This key is not blocked and has not expired.",
    }),
  };
};

const InfoHeader = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <span className="flex items-center gap-1">
    {label}
    <HoverCard>
      <HoverCardTrigger render={<Info className="size-3 text-muted-foreground cursor-help" />} />
      <HoverCardContent className="w-auto">{tooltip}</HoverCardContent>
    </HoverCard>
  </span>
);

interface KeyTableColumnsDeps {
  allTeams: Team[];
  organizations: Organization[];
  onSelectKey: (key: KeyResponse) => void;
  t: TFunction;
}

export const getKeyTableColumns = ({
  allTeams,
  organizations,
  onSelectKey,
  t,
}: KeyTableColumnsDeps): ColumnDef<KeyResponse>[] => [
  {
    id: "key_alias",
    accessorKey: "key_alias",
    meta: {
      title: t("toolDetail.scopeKey", { defaultValue: "Key" }),
      renderSkeleton: () => (
        <div className="flex flex-col gap-1 py-1">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ),
    },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("toolDetail.scopeKey", { defaultValue: "Key" })}
        variant="header-cycle"
      />
    ),
    size: 260,
    enableSorting: true,
    cell: ({ row }) => {
      const status = getKeyStatus(row.original, t);
      return (
        <IdentityCell
          title={row.original.key_alias || "-"}
          subtitle={row.original.key_name}
          badge={
            <StatusBadge
              tone={status.tone}
              label={status.label}
              tooltip={status.tooltip}
              dataTestId={`key-status-${row.original.token_id}`}
            />
          }
          onClick={() => onSelectKey(row.original)}
        />
      );
    },
  },
  {
    id: "token",
    accessorKey: "token",
    meta: { title: t("virtualKeys.virtualKeysTable.keyId", { defaultValue: "Key ID" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("virtualKeys.virtualKeysTable.keyId", { defaultValue: "Key ID" })}
        variant="header-cycle"
      />
    ),
    size: 120,
    enableSorting: true,
    cell: (info) => <IdCell value={info.getValue() as string | null} onClick={() => onSelectKey(info.row.original)} />,
  },
  {
    id: "team_alias",
    accessorKey: "team_id",
    meta: { title: t("virtualKeys.virtualKeysTable.team", { defaultValue: "Team" }) },
    header: t("virtualKeys.virtualKeysTable.team", { defaultValue: "Team" }),
    size: 120,
    enableSorting: false,
    cell: (info) => {
      const teamId = info.getValue() as string | null;
      if (!teamId) return "-";
      const team = allTeams.find((t) => t.team_id === teamId);
      return (
        <IdentityCell
          title={team?.team_alias || teamId}
          titleClassName={ENTITY_CELL_TITLE_CLASSES}
          href={teamDetailHref(teamId)}
        />
      );
    },
  },
  {
    id: "organization_alias",
    accessorKey: "org_id",
    meta: { title: t("virtualKeys.virtualKeysTable.organization", { defaultValue: "Organization" }) },
    header: t("virtualKeys.virtualKeysTable.organization", { defaultValue: "Organization" }),
    size: 140,
    enableSorting: false,
    cell: (info) => {
      const orgId = info.getValue() as string | null;
      if (!orgId) return "-";
      const org = organizations.find((o) => o.organization_id === orgId);
      return (
        <IdentityCell
          title={org?.organization_alias || orgId}
          titleClassName={ENTITY_CELL_TITLE_CLASSES}
          href={orgDetailHref(orgId)}
        />
      );
    },
  },
  {
    id: "user",
    accessorKey: "user",
    meta: { title: t("virtualKeys.virtualKeysTable.user", { defaultValue: "User" }) },
    header: () => (
      <InfoHeader
        label={t("virtualKeys.virtualKeysTable.user", { defaultValue: "User" })}
        tooltip={t("virtualKeys.virtualKeysTable.userPopoverHint", {
          defaultValue: "Displays the first available value: User Alias, User Email, or User ID.",
        })}
      />
    ),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const key = row.original;
      return (
        <UserPopoverCell
          userAlias={key.user?.user_alias ?? null}
          userEmail={key.user?.user_email ?? key.user_email ?? null}
          userId={key.user_id ?? null}
          width={160}
        />
      );
    },
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    meta: { title: t("common.createdAt", { defaultValue: "Created At" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("common.createdAt", { defaultValue: "Created At" })}
        variant="header-cycle"
      />
    ),
    size: 120,
    enableSorting: true,
    cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" />,
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    meta: { title: t("virtualKeys.virtualKeysTable.createdBy", { defaultValue: "Created By" }) },
    header: t("virtualKeys.virtualKeysTable.createdBy", { defaultValue: "Created By" }),
    size: 160,
    enableSorting: false,
    cell: (info) => {
      const userId = info.getValue() as string | null;
      if (!userId) return "-";
      const createdByUser = info.row.original.created_by_user;
      return (
        <UserPopoverCell
          userAlias={createdByUser?.user_alias ?? null}
          userEmail={createdByUser?.user_email ?? null}
          userId={userId}
          width={160}
        />
      );
    },
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    meta: { title: t("common.updatedAt", { defaultValue: "Updated At" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("common.updatedAt", { defaultValue: "Updated At" })}
        variant="header-cycle"
      />
    ),
    size: 120,
    enableSorting: true,
    cell: (info) => (
      <DateCell
        value={info.getValue() as string | null}
        precision="date"
        fallback={t("common.never", { defaultValue: "Never" })}
      />
    ),
  },
  {
    id: "last_active",
    accessorKey: "last_active",
    meta: { title: t("virtualKeys.virtualKeysTable.lastActive", { defaultValue: "Last Active" }) },
    header: () => (
      <InfoHeader
        label={t("virtualKeys.virtualKeysTable.lastActive", { defaultValue: "Last Active" })}
        tooltip={t("virtualKeys.virtualKeysTable.lastActiveHint", {
          defaultValue: "This is a new field and is not backfilled. Only new key usage will update this value.",
        })}
      />
    ),
    size: 130,
    enableSorting: false,
    cell: (info) => (
      <DateCell
        value={info.getValue() as string | null}
        precision="date"
        fallback={t("common.unknown", { defaultValue: "Unknown" })}
      />
    ),
  },
  {
    id: "expires",
    accessorKey: "expires",
    meta: { title: t("virtualKeys.virtualKeysTable.expires", { defaultValue: "Expires" }) },
    header: t("virtualKeys.virtualKeysTable.expires", { defaultValue: "Expires" }),
    size: 120,
    enableSorting: false,
    cell: (info) => (
      <DateCell
        value={info.getValue() as string | null}
        precision="date"
        fallback={t("common.never", { defaultValue: "Never" })}
      />
    ),
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: t("oldTeams.columns.spendBudget", { defaultValue: "Spend / Budget" }), skeleton: "meter" },
    header: ({ table }) => (
      <DataTableMultiSortHeader
        table={table}
        fields={SPEND_BUDGET_SORT_FIELDS.map((field) => ({
          id: field.id,
          label: t(field.labelKey, { defaultValue: field.label }),
        }))}
      />
    ),
    size: 180,
    enableSorting: true,
    cell: ({ row }) => {
      const team = allTeams.find((t) => t.team_id === row.original.team_id);
      const orgId = row.original.organization_id || row.original.org_id || team?.organization_id;
      const organization = organizations.find((o) => o.organization_id === orgId);
      return (
        <SpendBudgetCell
          spend={row.original.spend}
          maxBudget={row.original.max_budget}
          inheritedGates={row.original.max_budget == null ? inheritedBudgetGates(team, organization) : []}
        />
      );
    },
  },
  {
    id: "budget_reset_at",
    accessorKey: "budget_reset_at",
    meta: { title: t("virtualKeys.virtualKeysTable.budgetReset", { defaultValue: "Budget Reset" }) },
    header: t("virtualKeys.virtualKeysTable.budgetReset", { defaultValue: "Budget Reset" }),
    size: 130,
    enableSorting: false,
    cell: (info) => (
      <DateCell value={info.getValue() as string | null} fallback={t("common.never", { defaultValue: "Never" })} />
    ),
  },
  {
    id: "models",
    accessorKey: "models",
    meta: { title: t("virtualKeys.virtualKeysTable.models", { defaultValue: "Models" }), skeleton: "chips" },
    header: t("virtualKeys.virtualKeysTable.models", { defaultValue: "Models" }),
    size: 220,
    enableSorting: false,
    cell: (info) => (
      <ModelsCell
        models={info.getValue() as string[] | null | undefined}
        allowedRoutes={info.row.original.allowed_routes}
        keyType={info.row.original.key_type}
      />
    ),
  },
  {
    id: "rate_limits",
    meta: { title: t("virtualKeys.virtualKeysTable.rateLimits", { defaultValue: "Rate Limits" }) },
    header: t("virtualKeys.virtualKeysTable.rateLimits", { defaultValue: "Rate Limits" }),
    size: 140,
    enableSorting: false,
    cell: ({ row }) => {
      const key = row.original;
      const unlimited = t("virtualKeys.virtualKeysTable.unlimited", { defaultValue: "Unlimited" });
      return (
        <div className="text-xs">
          <div>
            {t("virtualKeys.virtualKeysTable.tpmLimit", {
              value: key.tpm_limit !== null ? key.tpm_limit : unlimited,
              defaultValue: "TPM: {{value}}",
            })}
          </div>
          <div>
            {t("virtualKeys.virtualKeysTable.rpmLimit", {
              value: key.rpm_limit !== null ? key.rpm_limit : unlimited,
              defaultValue: "RPM: {{value}}",
            })}
          </div>
        </div>
      );
    },
  },
];

export const KEY_TABLE_HIDDEN_COLUMNS: Record<string, boolean> = {
  token: false,
  organization_alias: false,
  created_by: false,
  updated_at: false,
  expires: false,
  rate_limits: false,
};
