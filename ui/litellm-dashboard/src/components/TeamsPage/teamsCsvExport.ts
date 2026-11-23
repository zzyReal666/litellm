import Papa from "papaparse";

import { TeamListCallOptions, TeamsResponse, teamListCall } from "@/app/(dashboard)/hooks/teams/useTeams";

import { Team } from "../key_team_helpers/key_list";
import { organizationListCall } from "../networking";
import { effectiveTeamModels } from "./teamTableColumns";

export interface TeamMemberBudget {
  budget_id: string;
  max_budget?: number | null;
  budget_duration?: string | null;
  tpm_limit?: number | null;
  rpm_limit?: number | null;
}

export const TEAMS_EXPORT_PAGE_SIZE = 100;

type FetchTeamsPage = (page: number, pageSize: number) => Promise<TeamsResponse>;

export const fetchAllTeams = async (fetchPage: FetchTeamsPage): Promise<Team[]> => {
  const firstPage = await fetchPage(1, TEAMS_EXPORT_PAGE_SIZE);
  const totalPages = firstPage.total_pages ?? 1;
  if (totalPages <= 1) return firstPage.teams;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2, TEAMS_EXPORT_PAGE_SIZE)),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.teams);
};

const teamMemberBudgetId = (team: Team): string | null => {
  const id = team.metadata?.team_member_budget_id;
  return typeof id === "string" && id.length > 0 ? id : null;
};

export const collectTeamMemberBudgetIds = (teams: Team[]): string[] =>
  Array.from(new Set(teams.map(teamMemberBudgetId).filter((id): id is string => id !== null)));

const cell = (value: string | number | boolean | null | undefined): string | number | boolean => value ?? "";

export const buildTeamsCsvRows = (
  teams: Team[],
  _budgets: TeamMemberBudget[] = [],
  organizationAliases: Record<string, string> = {},
): Record<string, string | number | boolean>[] =>
  teams.map((team) => ({
    Team: cell(team.team_alias || team.team_id),
    "Team ID": cell(team.team_id),
    Organization: cell(
      team.organization_id ? organizationAliases[team.organization_id] || team.organization_id : "",
    ),
    Models: effectiveTeamModels(team).join(", "),
    Members: cell(team.members_count ?? team.members_with_roles?.length),
    Keys: cell(team.keys_count ?? team.keys?.length),
    "Spend (CNY)": cell(team.spend),
    "Max Budget (CNY)": cell(team.max_budget),
    "Budget Duration": cell(team.budget_duration),
    "TPM Limit": cell(team.tpm_limit),
    "RPM Limit": cell(team.rpm_limit),
    "Created At": cell(team.created_at),
  }));

export const buildTeamsCsv = (
  teams: Team[],
  budgets: TeamMemberBudget[] = [],
  organizationAliases: Record<string, string> = {},
): string => Papa.unparse(buildTeamsCsvRows(teams, budgets, organizationAliases), { escapeFormulae: true });

const downloadCsv = (csv: string, fileName: string): void => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const fetchOrganizationAliases = async (accessToken: string): Promise<Record<string, string>> => {
  try {
    const organizations: Array<{ organization_id?: string | null; organization_alias?: string | null }> =
      await organizationListCall(accessToken, null, null);
    return Object.fromEntries(
      organizations
        .filter((org) => org.organization_id)
        .map((org) => [org.organization_id as string, org.organization_alias || (org.organization_id as string)]),
    );
  } catch {
    return {};
  }
};

export const exportTeamsToCsv = async (accessToken: string, options: TeamListCallOptions): Promise<number> => {
  const [teams, organizationAliases] = await Promise.all([
    fetchAllTeams((page, pageSize) => teamListCall(accessToken, page, pageSize, options)),
    fetchOrganizationAliases(accessToken),
  ]);
  downloadCsv(
    buildTeamsCsv(teams, [], organizationAliases),
    `teams_export_${new Date().toISOString().split("T")[0]}.csv`,
  );
  return teams.length;
};
