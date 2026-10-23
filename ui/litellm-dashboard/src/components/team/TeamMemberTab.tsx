import i18n from "@/lib/i18n";
import { Trans } from "react-i18next";
import { useResetTeamMemberBudget } from "@/app/(dashboard)/hooks/teams/useResetTeamMemberBudget";
import { useResetTeamMemberSpend } from "@/app/(dashboard)/hooks/teams/useResetTeamMemberSpend";
import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleTooltip } from "@/components/ui/tooltip";
import MemberTable from "@/components/common_components/MemberTable";
import { Member } from "@/components/networking";
import { parseErrorMessage } from "@/components/shared/errorUtils";
import { DateCell, MoneyCell } from "@/components/shared/table_cells";
import { toast } from "@/lib/toast";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { isProxyAdminRole, isUserTeamAdminForSingleTeam } from "@/utils/roles";
import { CircleHelp } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { TeamData, TeamMemberBudgetSource, TeamMembership } from "./TeamInfo";

const BUDGET_SOURCE_LABELS: Record<Exclude<TeamMemberBudgetSource, "none">, string> = {
  team_default: i18n.t("teamPage.teamMemberTab.teamDefault", { defaultValue: "Team default" }),
  custom: i18n.t("teamPage.teamMemberTab.custom", { defaultValue: "Custom" }),
};

const formatBudget = (value: number | null): string =>
  value === null ? i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" }) : `¥${formatNumberWithCommas(value, 2)}`;

export const seedMemberBudgetFields = (
  record: Member,
  budget: TeamMembership["litellm_budget_table"] | undefined,
): Member => ({
  ...record,
  max_budget_in_team: budget?.max_budget ?? null,
  tpm_limit: budget?.tpm_limit ?? null,
  rpm_limit: budget?.rpm_limit ?? null,
  budget_duration: budget?.budget_duration || null,
  allowed_models: budget?.allowed_models || [],
  temp_budget_increase: budget?.temp_budget_increase ?? null,
  temp_budget_expiry: budget?.temp_budget_expiry ?? null,
});

interface TeamMemberTabProps {
  teamData: TeamData;
  canEditTeam: boolean;
  handleMemberDelete: (member: Member) => void;
  setSelectedEditMember: (member: Member) => void;
  setIsEditMemberModalVisible: (visible: boolean) => void;
  setIsAddMemberModalVisible: (visible: boolean) => void;
  onMemberSpendReset: () => void;
  onMemberBudgetReset: () => void;
}

export default function TeamMemberTab({
  teamData,
  canEditTeam,
  handleMemberDelete,
  setSelectedEditMember,
  setIsEditMemberModalVisible,
  setIsAddMemberModalVisible,
  onMemberSpendReset,
  onMemberBudgetReset,
}: TeamMemberTabProps) {
  const [memberToResetSpend, setMemberToResetSpend] = useState<Member | null>(null);
  const [memberToResetBudget, setMemberToResetBudget] = useState<Member | null>(null);
  const { mutate: resetMemberSpend, isPending: isResettingSpend } = useResetTeamMemberSpend();
  const { mutate: resetMemberBudget, isPending: isResettingBudget } = useResetTeamMemberBudget();
  const teamDefaultBudget = teamData.team_info.team_member_budget_table?.max_budget ?? null;

  const formatNumber = (value: number | null): string => {
    if (value === null || value === undefined) return "0";

    if (typeof value === "number") {
      // Convert scientific notation to normal decimal
      const normalNumber = Number(value);

      // If it's a whole number, return it without decimals
      if (normalNumber === Math.floor(normalNumber)) {
        return normalNumber.toString();
      }

      // For decimal numbers, use toFixed and remove trailing zeros
      return formatNumberWithCommas(normalNumber, 8).replace(/\.?0+$/, "");
    }

    return "0";
  };

  const getUserCurrentCycleSpend = (userId: string | null): number => {
    if (!userId) return 0;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.spend ?? 0;
  };

  const getUserTotalSpend = (userId: string | null): number => {
    if (!userId) return 0;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.total_spend ?? 0;
  };

  const getUserBudgetSource = (userId: string | null): TeamMemberBudgetSource => {
    if (!userId) return "none";
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.budget_source ?? "none";
  };

  const getUserBudget = (userId: string | null): number | null => {
    if (!userId) return null;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.litellm_budget_table?.max_budget ?? teamDefaultBudget;
  };

  // Helper function to get rate limits for a user
  const getUserRateLimits = (userId: string | null): string => {
    if (!userId) return i18n.t("teamPage.teamMemberTab.noLimits", { defaultValue: "No Limits" });
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    const rpmLimit = membership?.litellm_budget_table?.rpm_limit;
    const tpmLimit = membership?.litellm_budget_table?.tpm_limit;

    const rpmText = rpmLimit != null ? `${formatNumber(rpmLimit)} RPM` : null;
    const tpmText = tpmLimit != null ? `${formatNumber(tpmLimit)} TPM` : null;

    const limits = [rpmText, tpmText].filter(Boolean);
    return limits.length > 0 ? limits.join(" / ") : i18n.t("teamPage.teamMemberTab.noLimits", { defaultValue: "No Limits" });
  };

  const { data: uiSettingsData } = useUISettings();
  const { userId, userRole } = useAuthorized();
  const disableTeamAdminDeleteTeamUser = Boolean(uiSettingsData?.values?.disable_team_admin_delete_team_user);
  const isUserTeamAdmin = isUserTeamAdminForSingleTeam(teamData.team_info.members_with_roles, userId || "");
  const isProxyAdmin = isProxyAdminRole(userRole || "");

  const getUserAllowedModels = (userId: string | null): string[] | null => {
    if (!userId) return null;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    const models = membership?.litellm_budget_table?.allowed_models;
    return models && models.length > 0 ? models : null;
  };

  const getUserBudgetReset = (userId: string | null): string | null => {
    if (!userId) return null;
    const membership = teamData.team_memberships.find((tm) => tm.user_id === userId);
    return membership?.litellm_budget_table?.budget_reset_at ?? null;
  };

  const extraColumns: NonNullable<ComponentProps<typeof MemberTable>["extraColumns"]> = [
    {
      title: (
        <span className="flex items-center gap-1">
          {i18n.t("teamPage.teamMemberTab.modelScopeTitle", { defaultValue: "Model Scope" })}
          <SimpleTooltip content={i18n.t("teamPage.teamMemberTab.modelScopeTooltip", { defaultValue: "Models this member can access. Empty means they inherit all team models." })}>
            <CircleHelp className="size-4" aria-label={i18n.t("teamPage.teamMemberTab.labelInfoAria", { label: i18n.t("teamPage.teamMemberTab.modelScopeTitle", { defaultValue: "Model Scope" }) })} />
          </SimpleTooltip>
        </span>
      ),
      key: "model_scope",
      render: (record: Member) => {
        const models = getUserAllowedModels(record.user_id);
        if (!models) {
          return <span className="text-muted-foreground">{i18n.t("teamPage.teamMemberTab.allTeamModels", { defaultValue: "(all team models)" })}</span>;
        }
        const displayed = models.slice(0, 2);
        const remaining = models.length - displayed.length;
        return (
          <div className="flex flex-wrap gap-1">
            {displayed.map((m) => (
              <code key={m} className="rounded bg-muted px-1 py-0.5 text-xs">
                {m}
              </code>
            ))}
            {remaining > 0 && (
              <SimpleTooltip content={models.slice(2).join(", ")}>
                <span className="text-muted-foreground">{i18n.t("teamPage.teamMemberTab.moreModels", { count: remaining, defaultValue: `+${remaining} more` })}</span>
              </SimpleTooltip>
            )}
          </div>
        );
      },
    },
    {
      title: (
        <span className="flex items-center gap-1">
          {i18n.t("teamPage.teamMemberTab.currentCycleSpendTitle", { defaultValue: "Current Cycle Spend (CNY)" })}
          <SimpleTooltip content={i18n.t("teamPage.teamMemberTab.currentCycleSpendTooltip", { defaultValue: "Spend for the current budget cycle. Resets to ¥0 when the member's budget window rolls over. This is the value checked against the member's budget." })}>
            <CircleHelp className="size-4" aria-label={i18n.t("teamPage.teamMemberTab.labelInfoAria", { label: i18n.t("teamPage.teamMemberTab.currentCycleSpendTitle", { defaultValue: "Current Cycle Spend (CNY)" }) })} />
          </SimpleTooltip>
        </span>
      ),
      key: "spend",
      numeric: true,
      sortValue: (record: Member) => getUserCurrentCycleSpend(record.user_id),
      render: (record: Member) => <MoneyCell value={getUserCurrentCycleSpend(record.user_id)} decimals={2} />,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          {i18n.t("teamPage.teamMemberTab.totalSpendTitle", { defaultValue: "Total Spend (CNY)" })}
          <SimpleTooltip content={i18n.t("teamPage.teamMemberTab.totalSpendTooltip", { defaultValue: "Cumulative spend by this member within this team, across all budget cycles. Tracking began 2026-04-21; spend from before that date is not included." })}>
            <CircleHelp className="size-4" aria-label={i18n.t("teamPage.teamMemberTab.labelInfoAria", { label: i18n.t("teamPage.teamMemberTab.totalSpendTitle", { defaultValue: "Total Spend (CNY)" }) })} />
          </SimpleTooltip>
        </span>
      ),
      key: "total_spend",
      numeric: true,
      sortValue: (record: Member) => getUserTotalSpend(record.user_id),
      render: (record: Member) => <MoneyCell value={getUserTotalSpend(record.user_id)} decimals={2} />,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          {i18n.t("teamPage.teamMemberTab.memberBudgetTitle", { defaultValue: "Team Member Budget (CNY)" })}
          <SimpleTooltip content={i18n.t("teamPage.teamMemberTab.memberBudgetTooltip", { defaultValue: "Team default follows the team's member budget, so changing it in team settings updates this member too. Custom is set on this member only and ignores later team changes." })}>
            <CircleHelp className="size-4" aria-label={i18n.t("teamPage.teamMemberTab.labelInfoAria", { label: i18n.t("teamPage.teamMemberTab.memberBudgetTitle", { defaultValue: "Team Member Budget (CNY)" }) })} />
          </SimpleTooltip>
        </span>
      ),
      key: "budget",
      numeric: true,
      sortValue: (record: Member) => getUserBudget(record.user_id),
      render: (record: Member) => {
        const source = getUserBudgetSource(record.user_id);
        return (
          <span className="flex items-center justify-end gap-2">
            <MoneyCell value={getUserBudget(record.user_id)} decimals={2} emptyText={i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" })} showZero />
            {source !== "none" && (
              <Badge variant={source === "custom" ? "outline" : "secondary"} data-testid="member-budget-source">
                {BUDGET_SOURCE_LABELS[source]}
              </Badge>
            )}
            {source === "custom" && canEditTeam && (
              <Button
                variant="link"
                size="xs"
                className="h-auto p-0"
                data-testid="reset-member-budget"
                onClick={() => setMemberToResetBudget(record)}
              >
                {i18n.t("teamPage.teamMemberTab.useTeamDefault", { defaultValue: "Use team default" })}
              </Button>
            )}
          </span>
        );
      },
    },
    {
      title: i18n.t("teamPage.teamMemberTab.budgetResetTitle", { defaultValue: "Budget Reset" }),
      key: "budget_reset",
      sortValue: (record: Member) => getUserBudgetReset(record.user_id),
      render: (record: Member) => <DateCell value={getUserBudgetReset(record.user_id)} precision="date" />,
    },
    {
      title: (
        <span className="flex items-center gap-1">
          {i18n.t("teamPage.teamMemberTab.rateLimitsTitle", { defaultValue: "Team Member Rate Limits" })}
          <SimpleTooltip content={i18n.t("teamPage.teamMemberTab.rateLimitsTooltip", { defaultValue: "Rate limits for this member's usage within this team." })}>
            <CircleHelp className="size-4" aria-label={i18n.t("teamPage.teamMemberTab.labelInfoAria", { label: i18n.t("teamPage.teamMemberTab.rateLimitsTitle", { defaultValue: "Team Member Rate Limits" }) })} />
          </SimpleTooltip>
        </span>
      ),
      key: "rate_limits",
      render: (record: Member) => <span>{getUserRateLimits(record.user_id)}</span>,
    },
  ];

  const handleResetSpend = () => {
    if (!memberToResetSpend?.user_id) return;
    resetMemberSpend(
      { teamId: teamData.team_id, userId: memberToResetSpend.user_id },
      {
        onSuccess: () => {
          toast.success(i18n.t("teamPage.teamMemberTab.spendResetToast", { defaultValue: "Team member spend reset to ¥0" }));
          setMemberToResetSpend(null);
          onMemberSpendReset();
        },
        onError: (error) => toast.fromError(parseErrorMessage(error)),
      },
    );
  };

  const handleResetBudget = () => {
    if (!memberToResetBudget?.user_id) return;
    resetMemberBudget(
      { teamId: teamData.team_id, userId: memberToResetBudget.user_id },
      {
        onSuccess: () => {
          toast.success(i18n.t("teamPage.teamMemberTab.budgetResetToast", { defaultValue: "Team member budget reset to the team default" }));
          setMemberToResetBudget(null);
          onMemberBudgetReset();
        },
        onError: (error) => toast.fromError(parseErrorMessage(error)),
      },
    );
  };

  const resetSpendDisabledReason = (member: Member): string | null => {
    if (!isProxyAdmin && member.user_id === userId) return i18n.t("teamPage.teamMemberTab.askProxyAdminReset", { defaultValue: "Ask a proxy admin to reset your own spend" });
    if (getUserCurrentCycleSpend(member.user_id) <= 0) return i18n.t("teamPage.teamMemberTab.noSpendToReset", { defaultValue: "No current cycle spend to reset" });
    return null;
  };

  return (
    <>
      <MemberTable
        key={teamData.team_id}
        members={teamData.team_info.members_with_roles}
        canEdit={canEditTeam}
        onEdit={(record) => {
          const membership = teamData.team_memberships.find((tm) => tm.user_id === record.user_id);
          setSelectedEditMember(seedMemberBudgetFields(record, membership?.litellm_budget_table));
          setIsEditMemberModalVisible(true);
        }}
        onDelete={handleMemberDelete}
        onAddMember={() => setIsAddMemberModalVisible(true)}
        roleColumnTitle={i18n.t("teamPage.teamMemberTab.roleColumnTitle", { defaultValue: "Team Role" })}
        roleTooltip={i18n.t("teamPage.teamMemberTab.roleTooltip", { defaultValue: "This role applies only to this team and is independent from the user's proxy-level role." })}
        extraColumns={extraColumns}
        showDeleteForMember={() =>
          isProxyAdmin || (canEditTeam && !isUserTeamAdmin) || (isUserTeamAdmin && !disableTeamAdminDeleteTeamUser)
        }
        onResetSpend={setMemberToResetSpend}
        resetSpendDisabledReason={resetSpendDisabledReason}
      />
      <Dialog open={memberToResetSpend !== null} onOpenChange={(open) => !open && setMemberToResetSpend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t("teamPage.teamMemberTab.resetSpendTitle", { defaultValue: "Reset Team Member Spend" })}</DialogTitle>
          </DialogHeader>
          <p>
            <Trans
              i18nKey="teamPage.teamMemberTab.resetSpendBody"
              defaults="Reset current cycle spend for <strong>{{user}}</strong> in this team to <strong>¥0</strong>?"
              values={{ user: memberToResetSpend?.user_email || memberToResetSpend?.user_id }}
              components={{ strong: <strong /> }}
            />
          </p>
          <p className="text-sm text-muted-foreground">
            <Trans
              i18nKey="teamPage.teamMemberTab.resetSpendDetail"
              defaults="Current cycle spend: <strong>¥{{spend}}</strong>. This is the value checked against the member's budget. Total spend and logs are preserved."
              values={{ spend: formatNumberWithCommas(getUserCurrentCycleSpend(memberToResetSpend?.user_id ?? null), 4) }}
              components={{ strong: <strong /> }}
            />
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToResetSpend(null)}>
              {i18n.t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button variant="destructive" onClick={handleResetSpend} disabled={isResettingSpend}>
              {i18n.t("common.reset", { defaultValue: "Reset" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={memberToResetBudget !== null} onOpenChange={(open) => !open && setMemberToResetBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t("teamPage.teamMemberTab.resetBudgetTitle", { defaultValue: "Reset Team Member Budget" })}</DialogTitle>
          </DialogHeader>
          <p>
            <Trans
              i18nKey="teamPage.teamMemberTab.resetBudgetBody"
              defaults="Remove the custom budget for <strong>{{user}}</strong> and put them back on the team default of <strong>{{budget}}</strong>?"
              values={{ user: memberToResetBudget?.user_email || memberToResetBudget?.user_id, budget: formatBudget(teamDefaultBudget) }}
              components={{ strong: <strong /> }}
            />
          </p>
          <p className="text-sm text-muted-foreground">
            <Trans
              i18nKey="teamPage.teamMemberTab.resetBudgetDetail"
              defaults="Custom budget: <strong>{{budget}}</strong>. Their spend is kept. Future changes to the team's member budget will apply to them again."
              values={{ budget: formatBudget(getUserBudget(memberToResetBudget?.user_id ?? null)) }}
              components={{ strong: <strong /> }}
            />
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToResetBudget(null)}>
              {i18n.t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button onClick={handleResetBudget} disabled={isResettingBudget}>
              {i18n.t("teamPage.teamMemberTab.useTeamDefault", { defaultValue: "Use team default" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
