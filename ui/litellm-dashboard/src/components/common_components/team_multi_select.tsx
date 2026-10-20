import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PaginatedMultiSelect } from "@/components/shared/PaginatedMultiSelect";
import type { SearchSelectOption } from "@/components/shared/SearchSelect";
import { useInfiniteTeams } from "@/app/(dashboard)/hooks/teams/useTeams";

interface TeamMultiSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
  organizationId?: string | null;
  pageSize?: number;
  placeholder?: string;
}

const TeamMultiSelect: React.FC<TeamMultiSelectProps> = ({
  value = [],
  onChange,
  disabled,
  organizationId,
  pageSize = 20,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteTeams(
    pageSize,
    search || undefined,
    organizationId,
  );

  const options = useMemo<SearchSelectOption[]>(
    () =>
      Array.from(
        new Map(
          (data?.pages ?? [])
            .flatMap((page) => page.teams)
            .map(
              (team) =>
                [
                  team.team_id,
                  { label: team.team_alias || team.team_id, value: team.team_id, sublabel: team.team_id },
                ] as const,
            ),
        ).values(),
      ),
    [data],
  );

  return (
    <PaginatedMultiSelect
      options={options}
      value={value}
      onValueChange={(next: string[]) => onChange?.(next)}
      onSearchChange={setSearch}
      onLoadMore={fetchNextPage}
      hasNextPage={hasNextPage}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      placeholder={
        placeholder ?? t("commonComponents.teamMultiSelect.placeholder", { defaultValue: "Search teams by alias..." })
      }
      emptyText={t("commonComponents.teamDropdown.notFound", { defaultValue: "No teams found" })}
      loadingText={t("shared.paginatedMultiSelect.loading", { defaultValue: "Loading…" })}
      clearAllLabel={t("commonComponents.teamMultiSelect.clearAll", { defaultValue: "Clear all teams" })}
      disabled={disabled}
    />
  );
};

export default TeamMultiSelect;
