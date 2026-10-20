import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { Download } from "lucide-react";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { teamSpendByUserCall } from "@/components/networking";
import { DataTable } from "@/components/shared/DataTable";
import { MoneyCell } from "@/components/shared/table_cells";
import { Button } from "@/components/ui/button";
import { Card as ShadcnCard, CardContent } from "@/components/ui/card";

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

const getColumns = (t: TFunction): ColumnDef<TeamUserSpendRow>[] => [
  {
    header: t("usagePage.teamUserSpend.colTeam", { defaultValue: "Team" }),
    accessorFn: teamLabel,
    id: "team",
    cell: ({ row }) => teamLabel(row.original),
  },
  {
    header: t("usagePage.teamUserSpend.colUser", { defaultValue: "User" }),
    accessorFn: userLabel,
    id: "user",
    cell: ({ row }) => userLabel(row.original),
  },
  {
    header: t("usagePage.teamUserSpend.colSpend", { defaultValue: "Spend" }),
    accessorKey: "spend",
    meta: { numeric: true },
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    header: t("usagePage.teamUserSpend.colRequests", { defaultValue: "Requests" }),
    accessorKey: "api_requests",
    meta: { numeric: true },
    cell: ({ row }) => row.original.api_requests.toLocaleString(),
  },
  {
    header: t("usagePage.teamUserSpend.colSuccessful", { defaultValue: "Successful" }),
    accessorKey: "successful_requests",
    meta: { numeric: true, className: "text-success" },
    cell: ({ row }) => row.original.successful_requests.toLocaleString(),
  },
  {
    header: t("usagePage.teamUserSpend.colFailed", { defaultValue: "Failed" }),
    accessorKey: "failed_requests",
    meta: { numeric: true, className: "text-destructive" },
    cell: ({ row }) => row.original.failed_requests.toLocaleString(),
  },
  {
    header: t("usagePage.teamUserSpend.colTokens", { defaultValue: "Tokens" }),
    accessorKey: "total_tokens",
    meta: { numeric: true },
    cell: ({ row }) => row.original.total_tokens.toLocaleString(),
  },
];

const TeamUserSpendCard: React.FC<TeamUserSpendCardProps> = ({ accessToken, startTime, endTime, teamIds }) => {
  const { t } = useTranslation();
  const columns = getColumns(t);
  const hasTeams = teamIds.length > 0;
  const { data, isLoading } = useQuery({
    queryKey: ["teamSpendByUser", startTime?.toISOString(), endTime?.toISOString(), teamIds],
    queryFn: () =>
      accessToken && startTime && endTime ? teamSpendByUserCall(accessToken, startTime, endTime, teamIds) : null,
    enabled: Boolean(accessToken && startTime && endTime) && hasTeams,
  });
  const rows = useMemo(() => sortBySpendDesc(data?.results ?? []), [data]);

  return (
    <ShadcnCard>
      <CardContent className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {t("usagePage.teamUserSpend.title", { defaultValue: "Spend Per User Within Team" })}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("usagePage.teamUserSpend.description", {
                defaultValue:
                  "Attributed per request from spend logs, so it includes JWT/SSO traffic that does not use a virtual key",
              })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || rows.length === 0}
            onClick={() => data && downloadCsv(buildTeamUserSpendCsv(data), teamUserSpendCsvFileName(data))}
          >
            <Download />
            {t("usagePage.teamUserSpend.downloadCsv", { defaultValue: "Download CSV" })}
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={teamUserSpendRowId}
          isLoading={isLoading}
          maxBodyHeight={320}
          noDataMessage={
            teamIds.length === 0
              ? t("usagePage.teamUserSpend.selectTeam", { defaultValue: "Select a team to see spend per user" })
              : t("usagePage.teamUserSpend.noSpend", { defaultValue: "No user spend in this range" })
          }
          size="compact"
        />
      </CardContent>
    </ShadcnCard>
  );
};

export default TeamUserSpendCard;
