import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { organizationKeys, useOrganization } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useQueryClient } from "@tanstack/react-query";
import { useVisitedTabs } from "@/hooks/useVisitedTabs";
import { MoneyCell } from "@/components/shared/table_cells";
import CopyButton from "@/components/shared/CopyButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { teamDetailHref } from "@/utils/entityLinks";
import { createTeamAliasMap } from "@/utils/teamUtils";
import { BadgeLink } from "@/components/shared/BadgeLink";
import { ArrowLeft } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import MemberTable, { type MemberTableColumn } from "../common_components/MemberTable";
import UserSearchModal from "../common_components/user_search_modal";
import { toast } from "@/lib/toast";
import {
  Member,
  organizationMemberAddCall,
  organizationMemberDeleteCall,
  organizationMemberUpdateCall,
} from "../networking";
import ObjectPermissionsView from "../object_permissions_view";
import MemberModal from "../team/EditMembership";
import { OrgSettingsForm } from "./org-settings/OrgSettingsForm";

interface OrganizationInfoProps {
  organizationId: string;
  onClose: () => void;
  accessToken: string | null;
  is_org_admin: boolean;
  is_proxy_admin: boolean;
  userModels: string[];
  editOrg: boolean;
}

const OrganizationInfoView: React.FC<OrganizationInfoProps> = ({
  organizationId,
  onClose,
  accessToken,
  is_org_admin,
  is_proxy_admin,
  userModels,
  editOrg,
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: orgData, isLoading: loading } = useOrganization(organizationId);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [selectedEditMember, setSelectedEditMember] = useState<Member | null>(null);
  const canEditOrg = is_org_admin || is_proxy_admin;
  const { data: teams } = useTeams();
  const { onTabChange, hasVisited } = useVisitedTabs(editOrg ? "settings" : "overview");

  const teamAliasMap = useMemo(() => createTeamAliasMap(teams), [teams]);

  const handleMemberAdd = async (values: any) => {
    try {
      if (accessToken == null) {
        return;
      }

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };
      await organizationMemberAddCall(accessToken, organizationId, member);

      toast.success(
        t("organization.organizationView.memberAddedSuccess", {
          defaultValue: "Organization member added successfully",
        }),
      );
      setIsAddMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError(
        t("organization.organizationView.memberAddFailed", { defaultValue: "Failed to add organization member" }),
      );
      console.error("Error adding organization member:", error);
    }
  };

  const handleMemberUpdate = async (values: any) => {
    try {
      if (!accessToken) return;

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };

      await organizationMemberUpdateCall(accessToken, organizationId, member);
      toast.success(
        t("organization.organizationView.memberUpdatedSuccess", {
          defaultValue: "Organization member updated successfully",
        }),
      );
      setIsEditMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError(
        t("organization.organizationView.memberUpdateFailed", { defaultValue: "Failed to update organization member" }),
      );
      console.error("Error updating organization member:", error);
    }
  };

  const handleMemberDelete = async (values: any) => {
    try {
      if (!accessToken) return;

      await organizationMemberDeleteCall(accessToken, organizationId, values.user_id);
      toast.success(
        t("organization.organizationView.memberDeletedSuccess", {
          defaultValue: "Organization member deleted successfully",
        }),
      );
      setIsEditMemberModalVisible(false);
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    } catch (error) {
      toast.fromError(
        t("organization.organizationView.memberDeleteFailed", { defaultValue: "Failed to delete organization member" }),
      );
      console.error("Error deleting organization member:", error);
    }
  };

  if (loading) {
    return <div className="p-4">{t("common.loading", { defaultValue: "Loading..." })}</div>;
  }

  if (!orgData) {
    return (
      <div className="p-4">
        {t("organization.organizationView.notFound", { defaultValue: "Organization not found" })}
      </div>
    );
  }

  const orgMemberById = new Map((orgData.members || []).map((m) => [m.user_id, m]));
  const orgMemberFor = (record: Member) => (record.user_id != null ? orgMemberById.get(record.user_id) : undefined);

  const orgExtraColumns: MemberTableColumn[] = [
    {
      title: t("organization.organizationView.spendColumnTitle", { defaultValue: "Spend (USD)" }),
      key: "spend",
      sortValue: (record: Member) => orgMemberFor(record)?.spend ?? null,
      render: (record: Member) => <MoneyCell value={orgMemberFor(record)?.spend} decimals={4} />,
    },
    {
      title: t("common.createdAt", { defaultValue: "Created At" }),
      key: "created_at",
      sortValue: (record: Member) => orgMemberFor(record)?.created_at ?? null,
      render: (record: Member) => {
        const createdAt = orgMemberFor(record)?.created_at;
        return <span>{createdAt ? new Date(createdAt).toLocaleString() : "-"}</span>;
      },
    },
  ];

  return (
    <div className="h-screen w-full bg-background p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onClose} className="mb-4">
            <ArrowLeft className="size-4" />
            {t("organization.organizationView.backToOrganizations", { defaultValue: "Back to Organizations" })}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{orgData.organization_alias}</h1>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm text-muted-foreground">{orgData.organization_id}</span>
            <CopyButton
              value={orgData.organization_id}
              label={t("organization.organizationView.copyOrgId", { defaultValue: "Copy organization ID" })}
              iconClassName="size-3"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue={editOrg ? "settings" : "overview"} onValueChange={onTabChange} className="mb-4">
        <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b p-0">
          <TabsTrigger value="overview" className="flex-none rounded-none px-4 py-2">
            {t("organization.organizationView.tabOverview", { defaultValue: "Overview" })}
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-none rounded-none px-4 py-2">
            {t("organization.organizationView.tabMembers", { defaultValue: "Members" })}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-none rounded-none px-4 py-2">
            {t("common.settings", { defaultValue: "Settings" })}
          </TabsTrigger>
        </TabsList>

        <TabsContent keepMounted={hasVisited("overview")} value="overview" className="pt-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("organization.organizationView.orgDetails", { defaultValue: "Organization Details" })}
                </p>
                <div className="mt-2 text-sm text-foreground">
                  <p>
                    {t("organization.organizationView.createdLabel", {
                      date: new Date(orgData.created_at).toLocaleDateString(),
                      defaultValue: "Created: {{date}}",
                    })}
                  </p>
                  <p>
                    {t("organization.organizationView.updatedLabel", {
                      date: new Date(orgData.updated_at).toLocaleDateString(),
                      defaultValue: "Updated: {{date}}",
                    })}
                  </p>
                  <p>
                    {t("organization.organizationView.createdByLabel", {
                      name: orgData.created_by,
                      defaultValue: "Created By: {{name}}",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("organization.organizationView.budgetStatus", { defaultValue: "Budget Status" })}
                </p>
                <div className="mt-2 text-sm text-foreground">
                  <p className="text-xl font-semibold">${formatNumberWithCommas(orgData.spend, 4)}</p>
                  <p>
                    {t("organization.organizationView.budgetOf", { defaultValue: "of" })}{" "}
                    {orgData.litellm_budget_table.max_budget === null
                      ? t("organization.organizationView.unlimited", { defaultValue: "Unlimited" })
                      : `$${formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}`}
                  </p>
                  {orgData.litellm_budget_table.budget_duration && (
                    <p className="text-muted-foreground">
                      {t("organization.organizationView.budgetReset", {
                        duration: orgData.litellm_budget_table.budget_duration,
                        defaultValue: "Reset: {{duration}}",
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("organization.organizationView.rateLimits", { defaultValue: "Rate Limits" })}
                </p>
                <div className="mt-2 text-sm text-foreground">
                  <p>
                    {t("organization.organizationView.tpmLabel", {
                      value:
                        orgData.litellm_budget_table.tpm_limit ??
                        t("organization.organizationView.unlimited", { defaultValue: "Unlimited" }),
                      defaultValue: "TPM: {{value}}",
                    })}
                  </p>
                  <p>
                    {t("organization.organizationView.rpmLabel", {
                      value:
                        orgData.litellm_budget_table.rpm_limit ??
                        t("organization.organizationView.unlimited", { defaultValue: "Unlimited" }),
                      defaultValue: "RPM: {{value}}",
                    })}
                  </p>
                  {orgData.litellm_budget_table.max_parallel_requests && (
                    <p>
                      {t("organization.organizationView.maxParallelRequests", {
                        value: orgData.litellm_budget_table.max_parallel_requests,
                        defaultValue: "Max Parallel Requests: {{value}}",
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("organization.organizationView.modelsCard", { defaultValue: "Models" })}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {orgData.models.length === 0 ? (
                    <BadgeLink>
                      {t("organization.organizationView.allProxyModels", { defaultValue: "All proxy models" })}
                    </BadgeLink>
                  ) : (
                    orgData.models.map((model, index) => <BadgeLink key={index}>{model}</BadgeLink>)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("organization.organizationView.teamsCard", { defaultValue: "Teams" })}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {orgData.teams?.map((team, index) => (
                    <BadgeLink key={index} href={teamDetailHref(team.team_id)}>
                      {teamAliasMap[team.team_id] || team.team_id}
                    </BadgeLink>
                  ))}
                </div>
              </CardContent>
            </Card>

            <ObjectPermissionsView
              objectPermission={orgData.object_permission}
              variant="card"
              accessToken={accessToken}
            />
          </div>
        </TabsContent>

        <TabsContent keepMounted={hasVisited("members")} value="members" className="pt-4">
          <div className="space-y-4">
            <MemberTable
              key={orgData.organization_id}
              members={(orgData.members || []).map((m) => ({
                role: m.user_role || "",
                user_id: m.user_id,
                user_email: m.user_email,
                user_alias: m.user?.user_alias ?? null,
              }))}
              canEdit={canEditOrg}
              onEdit={(member) => {
                setSelectedEditMember(member);
                setIsEditMemberModalVisible(true);
              }}
              onDelete={(member) => handleMemberDelete(member)}
              onAddMember={() => setIsAddMemberModalVisible(true)}
              roleColumnTitle={t("organization.organizationView.orgRoleColumnTitle", {
                defaultValue: "Organization Role",
              })}
              extraColumns={orgExtraColumns}
              emptyText={t("organization.organizationView.noMembersFound", { defaultValue: "No members found" })}
            />
          </div>
        </TabsContent>

        <TabsContent keepMounted={hasVisited("settings")} value="settings" className="pt-4">
          <Card className="max-h-[65vh] overflow-y-auto">
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("organization.organizationView.orgSettings", { defaultValue: "Organization Settings" })}
                </h2>
                {canEditOrg && !isEditing && (
                  <Button onClick={() => setIsEditing(true)}>
                    {t("organization.organizationView.editSettings", { defaultValue: "Edit Settings" })}
                  </Button>
                )}
              </div>

              {isEditing ? (
                <OrgSettingsForm
                  organizationId={organizationId}
                  org={orgData}
                  accessToken={accessToken || ""}
                  onCancel={() => setIsEditing(false)}
                  onSaved={() => setIsEditing(false)}
                />
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">
                      {t("organization.organizationView.displayOrgName", { defaultValue: "Organization Name" })}
                    </p>
                    <div>{orgData.organization_alias}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("organization.organizationView.displayOrgId", { defaultValue: "Organization ID" })}
                    </p>
                    <div className="font-mono">{orgData.organization_id}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("common.createdAt", { defaultValue: "Created At" })}
                    </p>
                    <div>{new Date(orgData.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("organization.organizationView.displayModels", { defaultValue: "Models" })}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {orgData.models.map((model, index) => (
                        <BadgeLink key={index}>{model}</BadgeLink>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("organization.organizationView.displayRateLimits", { defaultValue: "Rate Limits" })}
                    </p>
                    <div>
                      {t("organization.organizationView.displayTpm", {
                        value:
                          orgData.litellm_budget_table.tpm_limit ??
                          t("organization.organizationView.unlimited", { defaultValue: "Unlimited" }),
                        defaultValue: "TPM: {{value}}",
                      })}
                    </div>
                    <div>
                      {t("organization.organizationView.displayRpm", {
                        value:
                          orgData.litellm_budget_table.rpm_limit ??
                          t("organization.organizationView.unlimited", { defaultValue: "Unlimited" }),
                        defaultValue: "RPM: {{value}}",
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("organization.organizationView.displayBudget", { defaultValue: "Budget" })}
                    </p>
                    <div>
                      {t("organization.organizationView.displayMax", {
                        value:
                          orgData.litellm_budget_table.max_budget !== null
                            ? `$${formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}`
                            : t("organization.organizationView.noLimit", { defaultValue: "No Limit" }),
                        defaultValue: "Max: {{value}}",
                      })}
                    </div>
                    <div>
                      {t("organization.organizationView.displayReset", {
                        duration:
                          orgData.litellm_budget_table.budget_duration ||
                          t("common.neverResets", { defaultValue: "Never" }),
                        defaultValue: "Reset: {{duration}}",
                      })}
                    </div>
                  </div>

                  <ObjectPermissionsView
                    objectPermission={orgData.object_permission}
                    variant="inline"
                    className="border-t pt-4"
                    accessToken={accessToken}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserSearchModal
        isVisible={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onSubmit={handleMemberAdd}
        accessToken={accessToken}
        title={t("organization.organizationView.addMemberTitle", { defaultValue: "Add Organization Member" })}
        roles={[
          {
            label: "org_admin",
            value: "org_admin",
            description: t("organization.organizationView.roleOrgAdminDesc", {
              defaultValue: "Can add and remove members, and change their roles.",
            }),
          },
          {
            label: "internal_user",
            value: "internal_user",
            description: t("organization.organizationView.roleInternalUserDesc", {
              defaultValue: "Can view/create keys for themselves within organization.",
            }),
          },
          {
            label: "internal_user_viewer",
            value: "internal_user_viewer",
            description: t("organization.organizationView.roleInternalUserViewerDesc", {
              defaultValue: "Can only view their keys within organization.",
            }),
          },
        ]}
        defaultRole="internal_user"
      />
      <MemberModal
        visible={isEditMemberModalVisible}
        onCancel={() => setIsEditMemberModalVisible(false)}
        onSubmit={handleMemberUpdate}
        initialData={selectedEditMember}
        mode="edit"
        config={{
          title: t("organization.organizationView.editMemberTitle", { defaultValue: "Edit Member" }),
          showEmail: true,
          showUserId: true,
          roleOptions: [
            {
              label: t("organization.organizationView.roleOrgAdmin", { defaultValue: "Org Admin" }),
              value: "org_admin",
            },
            {
              label: t("organization.organizationView.roleInternalUser", { defaultValue: "Internal User" }),
              value: "internal_user",
            },
            {
              label: t("organization.organizationView.roleInternalUserViewer", {
                defaultValue: "Internal User Viewer",
              }),
              value: "internal_user_viewer",
            },
          ],
        }}
      />
    </div>
  );
};

export default OrganizationInfoView;
