import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Users } from "lucide-react";
import React, { useMemo } from "react";

import { teamSpendByUserCall } from "@/components/networking";
import { DataTable } from "@/components/shared/DataTable";
import { MoneyCell } from "@/components/shared/table_cells";
import { Button } from "@/components/ui/button";

import { Panel } from "../overview/Primitives";

import {
  buildTeamUserSpendCsv,
  downloadCsv,
  sortBySpendDesc,
  teamLabel,
  teamUserSpendCsvFileName,
  teamUserSpendRowId,
  userLabel,
  type TeamUserSpendRow,
} from "./teamUserSpend";

interface TeamUserSpendCardProps {
  accessToken: string | null;
  startTime: Date | null;
  endTime: Date | null;
  teamIds: string[];
}

const QUIET_HEADER = { headerClassName: "font-normal" };

const columns: ColumnDef<TeamUserSpendRow>[] = [
  { header: i18n.t("usagePage.teamUserSpend.colTeam", { defaultValue: "Team" }), accessorFn: teamLabel, id: "team", meta: QUIET_HEADER, cell: ({ row }) => teamLabel(row.original) },
  {
    header: i18n.t("usagePage.teamUserSpend.colUser", { defaultValue: "User" }),
    accessorFn: userLabel,
    id: "user",
    meta: QUIET_HEADER,
    cell: ({ row }) => <span className="font-medium text-foreground">{userLabel(row.original)}</span>,
  },
  {
    header: i18n.t("usagePage.teamUserSpend.colSpend", { defaultValue: "Spend" }),
    accessorKey: "spend",
    meta: { numeric: true, ...QUIET_HEADER },
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    header: i18n.t("usagePage.teamUserSpend.colRequests", { defaultValue: "Requests" }),
    accessorKey: "api_requests",
    meta: { numeric: true, ...QUIET_HEADER },
    cell: ({ row }) => row.original.api_requests.toLocaleString(),
  },
  {
    header: i18n.t("usagePage.teamUserSpend.colSuccessful", { defaultValue: "Successful" }),
    accessorKey: "successful_requests",
    meta: { numeric: true, className: "text-success", ...QUIET_HEADER },
    cell: ({ row }) => row.original.successful_requests.toLocaleString(),
  },
  {
    header: i18n.t("usagePage.teamUserSpend.colFailed", { defaultValue: "Failed" }),
    accessorKey: "failed_requests",
    meta: { numeric: true, className: "text-destructive", ...QUIET_HEADER },
    cell: ({ row }) => row.original.failed_requests.toLocaleString(),
  },
  {
    header: i18n.t("usagePage.teamUserSpend.colTokens", { defaultValue: "Tokens" }),
    accessorKey: "total_tokens",
    meta: { numeric: true, ...QUIET_HEADER },
    cell: ({ row }) => row.original.total_tokens.toLocaleString(),
  },
];

const TeamUserSpendCard: React.FC<TeamUserSpendCardProps> = ({ accessToken, startTime, endTime, teamIds }) => {
  const { t } = useTranslation();
  const hasTeams = teamIds.length > 0;
  const { data, isLoading } = useQuery({
    queryKey: ["teamSpendByUser", startTime?.toISOString(), endTime?.toISOString(), teamIds],
    queryFn: () =>
      accessToken && startTime && endTime ? teamSpendByUserCall(accessToken, startTime, endTime, teamIds) : null,
    enabled: Boolean(accessToken && startTime && endTime) && hasTeams,
  });
  const rows = useMemo(() => sortBySpendDesc(data?.results ?? []), [data]);

  return (
    <Panel
      icon={Users}
      title={t("usagePage.teamUserSpend.title", { defaultValue: "Spend Per User Within Team" })}
      action={
        <Button
          variant="outline"
          size="xs"
          disabled={!data || rows.length === 0}
          onClick={() => data && downloadCsv(buildTeamUserSpendCsv(data), teamUserSpendCsvFileName(data))}
        >
          <Download />
          {t("usagePage.teamUserSpend.downloadCsv", { defaultValue: "Download CSV" })}
        </Button>
      }
    >
      <p className="mb-3 text-xs text-muted-foreground">
        {t("usagePage.teamUserSpend.description", { defaultValue: "Attributed per request from spend logs, so it includes JWT/SSO traffic that does not use a virtual key" })}
      </p>
      <DataTable
        columns={columns}
        data={rows}
        getRowId={teamUserSpendRowId}
        isLoading={isLoading}
        maxBodyHeight={320}
        noDataMessage={teamIds.length === 0 ? t("usagePage.teamUserSpend.selectTeam", { defaultValue: "Select a team to see spend per user" }) : t("usagePage.teamUserSpend.noSpend", { defaultValue: "No user spend in this range" })}
        size="compact"
      />
    </Panel>
  );
};

export default TeamUserSpendCard;
