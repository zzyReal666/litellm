"use client";
import { PaginationState } from "@tanstack/react-table";
import i18n from "@/lib/i18n";
import { Info } from "lucide-react";
import { PageContent } from "@/components/shared/Page";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/components/shared/DataTable";
import { useDeletedTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { DeletedTeamsTable } from "./DeletedTeamsTable/DeletedTeamsTable";

export default function DeletedTeamsPage() {
  const { premiumUser } = useAuthorized();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE_OPTIONS[0],
  });
  const { data: teamsData, isLoading } = useDeletedTeams(pagination.pageIndex + 1, pagination.pageSize);

  return (
    <PageContent>
      {!premiumUser && (
        <Alert className="shrink-0">
          <Info />
          <AlertTitle>{i18n.t("deletedTeamsPage.coming-soon-to-enterprise", { defaultValue: "Coming soon to Enterprise" })}</AlertTitle>
          <AlertDescription>
            {i18n.t("deletedTeamsPage.deleted-team-auditing-is-graduating-from-bet", { defaultValue: "Deleted team auditing is graduating from beta into our Enterprise audit & compliance suite." })}</AlertDescription>
        </Alert>
      )}
      <DeletedTeamsTable
        teams={teamsData?.teams ?? []}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        rowCount={teamsData?.total ?? 0}
      />
    </PageContent>
  );
}
