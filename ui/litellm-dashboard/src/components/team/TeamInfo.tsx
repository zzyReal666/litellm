import i18n from "@/lib/i18n";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import type { components } from "@/lib/http/schema";
import useCan from "@/app/(dashboard)/hooks/useCan";
import { organizationKeys, useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { invalidateTeamQueries } from "@/app/(dashboard)/hooks/teams/useTeams";
import { useQueryClient } from "@tanstack/react-query";
import UserSearchModal from "@/components/common_components/user_search_modal";
import {
  getPoliciesList,
  getPolicyInfoWithGuardrails,
  Member,
  Organization,
  organizationInfoCall,
  teamInfoCall,
  teamMemberAddCall,
  teamMemberDeleteCall,
  teamMemberUpdateCall,
  teamUpdateCall,
} from "@/components/networking";
import { useGuardrails, GuardrailListItem } from "@/app/(dashboard)/hooks/guardrails/useGuardrails";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { numberOrNull } from "@/lib/forms/numberOrNull";
import type { ObjectPermission } from "@/components/object_permission_types";
import { isProxyAdminRole } from "@/utils/roles";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { StatusBadge, type StatusTone } from "@/components/shared/table_cells/status_badge";
import { BadgeLink } from "@/components/shared/BadgeLink";
import { Badge } from "@/components/ui/badge";
import { modelGroupHref, modelOrAccessGroupHref } from "@/utils/entityLinks";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input as UIInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SimpleTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { labelWithDocsHint, labelWithHint } from "@/components/shared/form/LabelWithHint";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { useZodForm } from "@/lib/forms/useZodForm";
import { TagsInput } from "@/app/(dashboard)/guardrails/_components/content_filter/TagsInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisitedTabs } from "@/hooks/useVisitedTabs";
import { toast } from "@/lib/toast";
import { CheckIcon, ChevronDown, CircleMinus, CopyIcon, Info, Pencil, Plus, Save } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";
import GuardrailsSelect from "./GuardrailsSelect";
import {
  type CallerEditAccess,
  parseTeamEditAccess,
  TEAM_ADMIN_EDITING_DISABLED_DESCRIPTION,
  TEAM_ADMIN_EDITING_DISABLED_TITLE,
  type TeamAdminSettingsChanges,
} from "./teamAdminEditAccess";
import TeamAdminSettingsForm from "./TeamAdminSettingsForm";
import { copyToClipboard as utilCopyToClipboard } from "../../utils/dataUtils";
import AccessGroupSelector from "../common_components/AccessGroupSelector";
import BudgetDurationDropdown, { NEVER_RESETS_BUDGET_DURATION } from "../common_components/budget_duration_dropdown";
import {
  ModelBudgetUsage,
  ModelMaxBudget,
  ModelMaxBudgetField,
  modelMaxBudgetToEntries,
} from "../key_team_helpers/ModelMaxBudgetEditor";
import { modelMaxBudgetUpdate, StoredModelMaxBudget } from "../key_team_helpers/modelMaxBudgetPayload";
import {
  computeTeamModelBadges,
  normalizeTeamModelSelection,
  TeamAccessGroupModelGrant,
  TeamModelBadge,
  TeamModelBadgeKind,
} from "./teamModelAccess";
import { computeInheritedGrants } from "../permissions/inheritedGrants";
import MetadataKeyValueFields, {
  metadataObjectToPairs,
  metadataPairsSchema,
  metadataPairsToObject,
} from "../common_components/MetadataKeyValueFields";
import { useTeamMetadataSchema } from "@/app/(dashboard)/hooks/teams/useTeamMetadataSchema";
import ModelAliasManager from "../common_components/ModelAliasManager";
import AgentSelector from "../agent_management/AgentSelector";
import DeleteResourceModal from "../common_components/DeleteResourceModal";
import PassThroughRoutesSelector from "../common_components/PassThroughRoutesSelector";
import { unfurlWildcardModelsInList } from "../key_team_helpers/fetch_available_models_team_key";
import GuardrailSettingsView from "../GuardrailSettingsView";
import LoggingSettingsView from "../logging_settings_view";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "../mcp_server_management/MCPToolPermissions";
import {
  mcpServersForIdentifier,
  resolveEffectiveMcpServers,
  type EffectiveMcpServer,
} from "../mcp_server_management/effectiveMcpServers";
import type { MCPServer } from "../mcp_tools/types";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { useMCPToolsets } from "@/app/(dashboard)/hooks/mcpServers/useMCPToolsets";
import { useAccessGroups, type AccessGroupResponse } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";
import { ModelSelect } from "../ModelSelect/ModelSelect";
import { estimateChecks, estimateTooltips } from "../templates/estimatedOutputTokens";
import ObjectPermissionsView from "../object_permissions_view";
import NumericalInput from "../shared/numerical_input";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";
import SearchToolSelector from "../search_tools/SearchToolSelector";
import SkillSelector from "../skills/SkillSelector";
import EditLoggingSettings from "./EditLoggingSettings";
import RouterSettingsAccordion, { RouterSettingsAccordionRef } from "../common_components/RouterSettingsAccordion";
import MemberModal from "./EditMembership";
import MemberPermissions from "./member_permissions";
import MyUserTab from "./MyUserTab";
import {
  getTeamInfoDefaultTab,
  getTeamInfoVisibleTabs,
  TEAM_INFO_TAB_KEYS,
  TEAM_INFO_TAB_LABELS,
} from "./tabVisibilityUtils";
import TeamMembersComponent from "./TeamMemberTab";
import { useModelAccessGroupNames } from "@/app/(dashboard)/hooks/models/useModels";
import {
  isValidThreshold,
  TEAM_MEMBER_MAX_BUDGET_ALERT_EMAILS_KEY,
  teamMemberBudgetAlertEmailsFromRows,
  teamMemberBudgetAlertRowsFromMetadata,
  teamMemberBudgetAlertSummary,
} from "./teamMemberBudgetAlertEmails";
import { TeamVirtualKeysTable } from "./TeamVirtualKeysTable";
import ResetMemberBudgetsDialog from "./ResetMemberBudgetsDialog";
import { customBudgetMemberUserIds, shouldPromptMemberBudgetReset } from "./memberBudgetReset";
import { useMemberBudgetReset } from "./useMemberBudgetReset";
import { fetchClient } from "@/lib/http/api";

const UI_MANAGED_METADATA_KEYS: ReadonlySet<string> = new Set([
  "logging",
  "secret_manager_settings",
  "soft_budget_alerting_emails",
  TEAM_MEMBER_MAX_BUDGET_ALERT_EMAILS_KEY,
  "model_tpm_limit",
  "model_rpm_limit",
  "default_estimated_output_tokens",
  "default_estimated_output_tokens_per_model",
  "allowed_passthrough_routes",
  "guardrails",
  "opted_out_global_guardrails",
  "disable_global_guardrails",
]);

const TEAM_MODEL_BADGE_TONES: Record<TeamModelBadgeKind, StatusTone> = {
  "all-proxy": "error",
  "no-default": "neutral",
  direct: "info",
  "access-group": "success",
};

const teamModelBadgeHref = (
  badge: TeamModelBadge,
  accessGroupNames: ReadonlySet<string> | undefined,
): string | undefined => {
  if (badge.kind === "direct") return modelOrAccessGroupHref(badge.label, accessGroupNames);
  if (badge.kind === "access-group") return modelGroupHref(badge.label);
  return undefined;
};

export type McpGrantResolution =
  | { readonly kind: "resolved"; readonly serverIds: ReadonlySet<string> }
  | { readonly kind: "unresolvable"; readonly reason: string };

export type TeamAccessGroupGrants = {
  readonly ids: readonly string[];
  readonly serverIds: readonly string[];
};

const sameIdSelection = (a: readonly string[], b: readonly string[]): boolean => {
  const aSet = new Set(a);
  const bSet = new Set(b);
  return aSet.size === bSet.size && [...aSet].every((id) => bSet.has(id));
};

export const standingToolPermissionServerIds = (
  loadedEffectiveServers: readonly EffectiveMcpServer[],
  loadedAccessGroupIds: readonly string[],
  accessGroups: readonly Pick<AccessGroupResponse, "access_group_id" | "access_mcp_server_ids">[],
  loadedTeamGroupServerIds: readonly string[],
): ReadonlySet<string> => {
  const loadedUnifiedServerIds = new Set([
    ...accessGroups
      .filter((group) => loadedAccessGroupIds.includes(group.access_group_id))
      .flatMap((group) => group.access_mcp_server_ids),
    ...loadedTeamGroupServerIds,
  ]);
  return new Set(
    loadedEffectiveServers
      .filter(({ source, server }) => source.kind === "toolPermission" && !loadedUnifiedServerIds.has(server.server_id))
      .map(({ server }) => server.server_id),
  );
};

export type McpGrantInput = {
  readonly effectiveServers: readonly EffectiveMcpServer[];
  readonly selectedAccessGroupIds: readonly string[];
  readonly accessGroups: readonly Pick<AccessGroupResponse, "access_group_id" | "access_mcp_server_ids">[];
  readonly standingServerIds: ReadonlySet<string>;
  readonly loadTeamGroups: () => Promise<TeamAccessGroupGrants>;
};

export const grantedMcpServerIds = async ({
  effectiveServers,
  selectedAccessGroupIds,
  accessGroups,
  standingServerIds,
  loadTeamGroups,
}: McpGrantInput): Promise<McpGrantResolution> => {
  const selectedGroups = accessGroups.filter((group) => selectedAccessGroupIds.includes(group.access_group_id));
  const direct = effectiveServers
    .filter(({ source }) => source.kind !== "toolPermission")
    .map(({ server }) => server.server_id);
  if (selectedAccessGroupIds.every((id) => selectedGroups.some((group) => group.access_group_id === id))) {
    return {
      kind: "resolved",
      serverIds: new Set([
        ...direct,
        ...selectedGroups.flatMap((group) => group.access_mcp_server_ids),
        ...standingServerIds,
      ]),
    };
  }
  const loadedTeamGroups = await loadTeamGroups().catch(() => null);
  if (loadedTeamGroups === null) {
    return { kind: "unresolvable", reason: "the team's access groups could not be reloaded" };
  }
  if (sameIdSelection(selectedAccessGroupIds, loadedTeamGroups.ids)) {
    return {
      kind: "resolved",
      serverIds: new Set([...direct, ...loadedTeamGroups.serverIds, ...standingServerIds]),
    };
  }
  return { kind: "unresolvable", reason: "the team's access groups could not be loaded" };
};

export const retainedMcpToolPermissions = (
  toolPermissions: Record<string, string[]>,
  grantedServerIds: ReadonlySet<string>,
  knownServers: readonly MCPServer[],
): Record<string, string[]> => {
  const entries = Object.entries(toolPermissions).flatMap(([key, tools]) => {
    const named = mcpServersForIdentifier(knownServers, key);
    const granted = named.filter((server) => grantedServerIds.has(server.server_id));
    if (named.length === 0 || granted.length === named.length) {
      return [[key, tools] as const];
    }
    if (granted.length === 0) {
      return [];
    }
    return granted.map(({ server_id }) => [server_id, [...(toolPermissions[server_id] ?? []), ...tools]] as const);
  });
  return entries.reduce<Record<string, string[]>>(
    (retained, [key, tools]) => ({
      ...retained,
      [key]: [...new Set([...(retained[key] ?? []), ...tools])],
    }),
    {},
  );
};

export const mcpUnresolvableSaveError = (reason: string): string =>
  `Cannot save MCP tool permissions because ${reason}. Retry once the page has finished loading`;

export type TeamMemberBudgetSource = components["schemas"]["TeamMemberResetBudgetResponse"]["budget_source"];

export interface TeamMembership {
  user_id: string;
  team_id: string;
  budget_id: string | null;
  budget_source: TeamMemberBudgetSource;
  spend: number;
  total_spend: number | null;
  litellm_budget_table: {
    budget_id: string;
    soft_budget: number | null;
    max_budget: number | null;
    max_parallel_requests: number | null;
    tpm_limit: number | null;
    rpm_limit: number | null;
    model_max_budget: Record<string, number> | null;
    budget_duration: string | null;
    budget_reset_at: string | null;
    allowed_models?: string[] | null;
    temp_budget_increase?: number | null;
    temp_budget_expiry?: string | null;
  };
}

export interface TeamData {
  team_id: string;
  team_info: {
    team_alias: string;
    team_id: string;
    organization_id: string | null;
    admins: string[];
    members: string[];
    members_with_roles: Member[];
    metadata: Record<string, any>;
    tpm_limit: number | null;
    rpm_limit: number | null;
    tpd_limit?: number | null;
    max_budget: number | null;
    soft_budget?: number | null;
    budget_duration: string | null;
    model_max_budget?: StoredModelMaxBudget | null;
    model_max_budget_usage?: Record<string, ModelBudgetUsage> | null;
    models: string[];
    blocked: boolean;
    spend: number;
    max_parallel_requests: number | null;
    budget_reset_at: string | null;
    model_id: string | null;
    litellm_model_table: {
      model_aliases: Record<string, string> | null;
    } | null;
    created_at: string;
    access_group_ids?: string[];
    default_team_member_models?: string[];
    access_group_models?: string[];
    access_group_mcp_server_ids?: string[];
    access_group_agent_ids?: string[];
    access_group_details?: TeamAccessGroupModelGrant[];
    router_settings?: Record<string, any>;
    guardrails?: string[];
    policies?: string[];
    object_permission?: ObjectPermission | null;
    caller_edit_access?: CallerEditAccess;
    team_member_budget_table: {
      max_budget: number | null;
      budget_duration: string | null;
      tpm_limit: number | null;
      rpm_limit: number | null;
    } | null;
  };
  keys: any[];
  team_memberships: TeamMembership[];
}

export interface TeamInfoProps {
  teamId: string;
  onUpdate: (data: any) => void;
  onClose: () => void;
  accessToken: string | null;
  is_team_admin: boolean;
  is_proxy_admin: boolean;
  userModels: string[];
  editTeam: boolean;
  premiumUser?: boolean;
}

const SUPPRESSED_BY_DESCRIPTION = "";

const numericInputSchema = z.union([z.string(), z.number()]).nullish();

const teamUpdateFieldsSchema = z.object({
  team_alias: z.string().min(1, i18n.t("teamPage.teamInfo.teamNameRequired", { defaultValue: "Please input a team name" })),
  models: z.array(z.string()).optional(),
  max_budget: numericInputSchema,
  soft_budget: numericInputSchema,
  soft_budget_alerting_emails: z.union([z.string(), z.array(z.string())]).optional(),
  default_team_member_models: z.array(z.string()).optional(),
  team_member_budget: numericInputSchema,
  team_member_budget_duration: z.string().nullish(),
  team_member_key_duration: z.string().optional(),
  team_member_tpm_limit: numericInputSchema,
  team_member_rpm_limit: numericInputSchema,
  team_member_max_budget_alert_emails: z
    .array(z.object({ threshold: z.number().nullable(), emails: z.string() }))
    .superRefine((rows, ctx) => {
      rows.forEach((row, index) => {
        if (!isValidThreshold(row.threshold)) {
          ctx.addIssue({ code: "custom", message: "Enter a whole number from 1 to 100", path: [index, "threshold"] });
        } else if (rows.filter((other) => other.threshold === row.threshold).length > 1) {
          ctx.addIssue({ code: "custom", message: "Duplicate threshold", path: [index, "threshold"] });
        }
      });
    })
    .optional(),
  budget_duration: z.string().nullish(),
  tpm_limit: numericInputSchema,
  rpm_limit: numericInputSchema,
  tpd_limit: numericInputSchema,
  modelLimits: z
    .array(
      z.object({
        model: z
          .string()
          .nullable()
          .refine((model) => Boolean(model), i18n.t("teamPage.teamInfo.missingModel", { defaultValue: "Missing model" })),
        tpm: z.number().nullish(),
        rpm: z.number().nullish(),
      }),
    )
    .superRefine((rows, ctx) => {
      rows.forEach((row, index) => {
        if (row.model && rows.filter((other) => other.model === row.model).length > 1) {
          ctx.addIssue({ code: "custom", message: i18n.t("teamPage.teamInfo.duplicateModel", { defaultValue: "Duplicate model" }), path: [index, "model"] });
        }
        if (row.model && row.tpm == null && row.rpm == null) {
          ctx.addIssue({ code: "custom", message: i18n.t("teamPage.teamInfo.setAtLeastOneLimitError", { defaultValue: "Set at least one of TPM or RPM" }), path: [index, "tpm"] });
        }
      });
    }),
  default_estimated_output_tokens: numericInputSchema.refine(
    estimateChecks.positive.isValid,
    estimateChecks.positive.message,
  ),
  default_estimated_output_tokens_per_model: z
    .string()
    .optional()
    .refine(estimateChecks.perModel.isValid, estimateChecks.perModel.message),
  guardrails: z.array(z.string()).optional(),
  disable_global_guardrails: z.boolean().optional(),
  policies: z.array(z.string()).optional(),
  access_group_ids: z.array(z.string()).optional(),
  vector_stores: z.array(z.string()).optional(),
  allowed_passthrough_routes: z.array(z.string()).optional(),
  mcp_servers_and_groups: z
    .object({
      servers: z.array(z.string()),
      accessGroups: z.array(z.string()),
      toolsets: z.array(z.string()).optional(),
    })
    .optional(),
  mcp_tool_permissions: z.record(z.string(), z.array(z.string())).optional(),
  agents_and_groups: z.object({ agents: z.array(z.string()), accessGroups: z.array(z.string()) }).optional(),
  object_permission_search_tools: z.array(z.string()).optional(),
  object_permission_skills: z.array(z.string()).optional(),
  organization_id: z.string().nullish(),
  logging_settings: z.array(z.unknown()).optional(),
  secret_manager_settings: z.string().optional(),
  metadata: metadataPairsSchema.optional(),
});

type TeamUpdateFormValues = z.infer<typeof teamUpdateFieldsSchema>;

type TeamInfoRecord = TeamData["team_info"] & { team_member_key_duration?: string };

const TEAM_MEMBER_SETTINGS_FIELDS = [
  "default_team_member_models",
  "team_member_budget",
  "team_member_budget_duration",
  "team_member_key_duration",
  "team_member_tpm_limit",
  "team_member_rpm_limit",
  "team_member_max_budget_alert_emails",
] as const;
const SEARCH_TOOL_SETTINGS_FIELDS = ["object_permission_search_tools"] as const;

const EMPTY_TEAM_UPDATE_VALUES: TeamUpdateFormValues = {
  team_alias: "",
  models: [],
  max_budget: undefined,
  soft_budget: undefined,
  soft_budget_alerting_emails: "",
  default_team_member_models: [],
  team_member_budget: undefined,
  team_member_budget_duration: undefined,
  team_member_key_duration: undefined,
  team_member_tpm_limit: undefined,
  team_member_rpm_limit: undefined,
  team_member_max_budget_alert_emails: [],
  budget_duration: undefined,
  tpm_limit: undefined,
  rpm_limit: undefined,
  tpd_limit: undefined,
  modelLimits: [],
  default_estimated_output_tokens: undefined,
  default_estimated_output_tokens_per_model: "",
  guardrails: [],
  disable_global_guardrails: false,
  policies: [],
  access_group_ids: [],
  vector_stores: [],
  allowed_passthrough_routes: [],
  mcp_servers_and_groups: { servers: [], accessGroups: [], toolsets: [] },
  mcp_tool_permissions: {},
  agents_and_groups: { agents: [], accessGroups: [] },
  object_permission_search_tools: [],
  object_permission_skills: [],
  organization_id: null,
  logging_settings: [],
  secret_manager_settings: "",
  metadata: [],
};

const computeEffectiveGuardrails = (info: TeamInfoRecord, globalGuardrailNames: ReadonlySet<string>): string[] => {
  const optedOutGlobals = new Set<string>(
    Array.isArray(info.metadata?.opted_out_global_guardrails) ? info.metadata.opted_out_global_guardrails : [],
  );
  const nonGlobalOptIns: string[] = (Array.isArray(info.metadata?.guardrails) ? info.metadata.guardrails : []).filter(
    (name: string) => !globalGuardrailNames.has(name),
  );
  return info.metadata?.disable_global_guardrails === true
    ? nonGlobalOptIns
    : [...Array.from(globalGuardrailNames).filter((name) => !optedOutGlobals.has(name)), ...nonGlobalOptIns];
};

const toTeamFormValues = (info: TeamInfoRecord, effectiveGuardrails: string[]): TeamUpdateFormValues => ({
  team_alias: info.team_alias,
  models: info.models,
  max_budget: info.max_budget,
  soft_budget: info.soft_budget,
  soft_budget_alerting_emails: Array.isArray(info.metadata?.soft_budget_alerting_emails)
    ? info.metadata.soft_budget_alerting_emails.join(", ")
    : "",
  default_team_member_models: info.default_team_member_models || [],
  team_member_budget: info.team_member_budget_table?.max_budget,
  team_member_budget_duration: info.team_member_budget_table?.budget_duration,
  team_member_key_duration: info.metadata?.team_member_key_duration,
  team_member_tpm_limit: info.team_member_budget_table?.tpm_limit,
  team_member_rpm_limit: info.team_member_budget_table?.rpm_limit,
  team_member_max_budget_alert_emails: [...teamMemberBudgetAlertRowsFromMetadata(info.metadata)],
  budget_duration: info.budget_duration,
  tpm_limit: info.tpm_limit,
  rpm_limit: info.rpm_limit,
  tpd_limit: info.tpd_limit,
  modelLimits: Array.from(
    new Set([
      ...Object.keys(info.metadata?.model_tpm_limit ?? {}),
      ...Object.keys(info.metadata?.model_rpm_limit ?? {}),
    ]),
  ).map((model) => ({
    model,
    tpm: info.metadata?.model_tpm_limit?.[model],
    rpm: info.metadata?.model_rpm_limit?.[model],
  })),
  default_estimated_output_tokens: info.metadata?.default_estimated_output_tokens,
  default_estimated_output_tokens_per_model: info.metadata?.default_estimated_output_tokens_per_model
    ? JSON.stringify(info.metadata.default_estimated_output_tokens_per_model)
    : "",
  guardrails: effectiveGuardrails,
  disable_global_guardrails: info.metadata?.disable_global_guardrails || false,
  policies: info.policies || [],
  access_group_ids: info.access_group_ids || [],
  vector_stores: info.object_permission?.vector_stores || [],
  allowed_passthrough_routes: info.metadata?.allowed_passthrough_routes || [],
  mcp_servers_and_groups: {
    servers: info.object_permission?.mcp_servers || [],
    accessGroups: info.object_permission?.mcp_access_groups || [],
    toolsets: info.object_permission?.mcp_toolsets || [],
  },
  mcp_tool_permissions: info.object_permission?.mcp_tool_permissions || {},
  agents_and_groups: {
    agents: info.object_permission?.agents || [],
    accessGroups: info.object_permission?.agent_access_groups || [],
  },
  object_permission_search_tools: info.object_permission?.search_tools || [],
  object_permission_skills: info.object_permission?.skills || [],
  organization_id: info.organization_id,
  logging_settings: info.metadata?.logging || [],
  secret_manager_settings: info.metadata?.secret_manager_settings
    ? JSON.stringify(info.metadata.secret_manager_settings, null, 2)
    : "",
  metadata: metadataObjectToPairs(info.metadata, UI_MANAGED_METADATA_KEYS),
});

const isParsableJson = (value: string | undefined): boolean => {
  if (!value) {
    return true;
  }
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

const TeamInfoView: React.FC<TeamInfoProps> = ({
  teamId,
  onClose,
  accessToken,
  is_team_admin,
  is_proxy_admin,
  userModels,
  editTeam,
  premiumUser = false,
  onUpdate,
}) => {
  const teamUpdateSchema = useMemo(
    () =>
      teamUpdateFieldsSchema.superRefine((values, ctx) => {
        if (!isParsableJson(values.secret_manager_settings)) {
          ctx.addIssue({ code: "custom", message: SUPPRESSED_BY_DESCRIPTION, path: ["secret_manager_settings"] });
        }
      }),
    [],
  );
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const form = useZodForm(teamUpdateSchema, { defaultValues: EMPTY_TEAM_UPDATE_VALUES });
  const {
    fields: modelLimitRows,
    append: appendModelLimit,
    remove: removeModelLimit,
  } = useFieldArray({ control: form.control, name: "modelLimits" });
  const {
    fields: memberBudgetAlertRows,
    append: appendMemberBudgetAlertRow,
    remove: removeMemberBudgetAlertRow,
  } = useFieldArray({ control: form.control, name: "team_member_max_budget_alert_emails" });
  const [teamMemberSettingsOpen, setTeamMemberSettingsOpen] = useState(false);
  const [searchToolSettingsOpen, setSearchToolSettingsOpen] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [selectedEditMember, setSelectedEditMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const { data: guardrailsData, isLoading: isGuardrailsLoading } = useGuardrails();
  const globalGuardrailNames = guardrailsData?.globalGuardrailNames ?? new Set<string>();
  const canViewPolicies = useCan("viewPolicies");
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [policyGuardrails, setPolicyGuardrails] = useState<Record<string, string[]>>({});
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTeamSaving, setIsTeamSaving] = useState(false);
  const [teamModelAliases, setTeamModelAliases] = useState<Record<string, string>>({});
  const [teamModelMaxBudget, setTeamModelMaxBudget] = useState<ModelMaxBudget>({});
  const routerSettingsRef = React.useRef<RouterSettingsAccordionRef>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const { userRole } = useAuthorized();
  const accessGroupNames = useModelAccessGroupNames();
  const { data: allMcpServers = [], isError: mcpServersFailed, isLoading: mcpServersLoading } = useMCPServers();
  const { data: allMcpToolsets = [], isError: mcpToolsetsFailed, isLoading: mcpToolsetsLoading } = useMCPToolsets();
  const { data: allAccessGroups = [], isError: accessGroupsFailed, isLoading: accessGroupsLoading } = useAccessGroups();
  const canEditTeamEstimates = isProxyAdminRole(userRole);
  const teamEstimateTooltip = estimateTooltips(canEditTeamEstimates, "team");
  const { data: userOrganizations = [] } = useOrganizations();
  const { data: teamMetadataSchemaFields = [], isLoading: isTeamMetadataSchemaLoading } = useTeamMetadataSchema();
  const queryClient = useQueryClient();

  // Models currently selected in the team edit form, used to scope the per-model
  // rate limit dropdown to models this team actually has access to.
  const watchedModels = form.watch("models");
  const killSwitchOn = form.watch("disable_global_guardrails");
  const watchedMcpSelection = form.watch("mcp_servers_and_groups");
  const watchedToolPermissions = form.watch("mcp_tool_permissions");
  const mcpLookupFailure =
    (
      [
        [mcpServersFailed, i18n.t("teamPage.teamInfo.mcpServerListLoadFailed", { defaultValue: "the MCP server list could not be loaded" })],
        [mcpToolsetsFailed, i18n.t("teamPage.teamInfo.mcpToolsetListLoadFailed", { defaultValue: "the MCP toolset list could not be loaded" })],
        [accessGroupsFailed, i18n.t("teamPage.teamInfo.accessGroupListLoadFailed", { defaultValue: "the access group list could not be loaded" })],
        [mcpServersLoading || mcpToolsetsLoading || accessGroupsLoading, i18n.t("teamPage.teamInfo.mcpInventoryStillLoading", { defaultValue: "the MCP server inventory is still loading" })],
      ] as const
    ).find(([failed]) => failed)?.[1] ?? null;
  const availableRateLimitModels = useMemo(() => {
    const selected = watchedModels ?? teamData?.team_info?.models ?? [];
    if (selected.includes("all-proxy-models") || selected.includes("all-team-models")) {
      return userModels;
    }
    return unfurlWildcardModelsInList(selected, userModels);
  }, [watchedModels, teamData, userModels]);

  const teamEditAccess = useMemo(() => parseTeamEditAccess(teamData?.team_info?.caller_edit_access), [teamData]);
  const canEditTeam = is_team_admin || is_proxy_admin || teamEditAccess.kind !== "none";
  const visibleTabs = useMemo(() => getTeamInfoVisibleTabs(canEditTeam), [canEditTeam]);
  const defaultTabKey = useMemo(() => getTeamInfoDefaultTab(editTeam, canEditTeam), [editTeam, canEditTeam]);
  const { onTabChange, hasVisited } = useVisitedTabs(defaultTabKey);

  const teamFormValues = (): TeamUpdateFormValues => {
    const info = teamData?.team_info;
    return info
      ? toTeamFormValues(info, computeEffectiveGuardrails(info, globalGuardrailNames))
      : EMPTY_TEAM_UPDATE_VALUES;
  };

  const startEditing = () => {
    form.reset(teamFormValues());
    setTeamModelMaxBudget((teamData?.team_info?.model_max_budget ?? {}) as ModelMaxBudget);
    setTeamMemberSettingsOpen(false);
    setSearchToolSettingsOpen(false);
    setIsEditing(true);
  };

  const openSettingsEditor = (modelAliases: Record<string, string>) => {
    if (teamEditAccess.kind === "team_admin_disabled") {
      toast.error(TEAM_ADMIN_EDITING_DISABLED_TITLE, { description: TEAM_ADMIN_EDITING_DISABLED_DESCRIPTION });
      return;
    }
    setTeamModelAliases(modelAliases);
    startEditing();
  };

  const applyKillSwitchToGuardrails = (checked: boolean) => {
    const current = form.getValues("guardrails") ?? [];
    const nonGlobals = current.filter((name) => !globalGuardrailNames.has(name));
    form.setValue("guardrails", checked ? nonGlobals : [...Array.from(globalGuardrailNames), ...nonGlobals]);
  };

  const mountedUpdateValues = (values: TeamUpdateFormValues): Record<string, unknown> => {
    const unmounted = new Set<string>([
      ...(teamMemberSettingsOpen ? [] : TEAM_MEMBER_SETTINGS_FIELDS),
      ...(canViewPolicies ? [] : ["policies"]),
      ...(searchToolSettingsOpen ? [] : SEARCH_TOOL_SETTINGS_FIELDS),
    ]);
    return Object.fromEntries(Object.entries(values).filter(([key]) => !unmounted.has(key)));
  };

  const onTeamUpdateSubmit = (values: TeamUpdateFormValues) => handleTeamUpdate(mountedUpdateValues(values));

  const fetchTeamInfo = async () => {
    try {
      setLoading(true);
      if (!accessToken) return;
      const response = await teamInfoCall(accessToken, teamId);
      setTeamData(response);
    } catch (error) {
      toast.fromError(i18n.t("teamPage.teamInfo.failedToLoadTeam", { defaultValue: "Failed to load team information" }));
      console.error("Error fetching team info:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTeamData = async () => {
    if (!accessToken) return;
    try {
      setTeamData(await teamInfoCall(accessToken, teamId));
    } catch {
      toast.fromError(i18n.t("teamPage.teamInfo.failedToLoadTeam", { defaultValue: "Failed to load team information" }));
    }
  };

  useEffect(() => {
    fetchTeamInfo();
  }, [teamId, accessToken]);

  // Fetch organization data when team has organization_id
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!accessToken || !teamData?.team_info?.organization_id) {
        setOrganization(null);
        return;
      }

      try {
        const orgData = await organizationInfoCall(accessToken, teamData.team_info.organization_id);
        setOrganization(orgData);
      } catch (error) {
        console.error("Error fetching organization info:", error);
        setOrganization(null);
      }
    };

    fetchOrganization();
  }, [accessToken, teamData?.team_info?.organization_id]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        if (!accessToken) return;
        const response = await getPoliciesList(accessToken);
        const policyNames = response.policies.map((p: { policy_name: string }) => p.policy_name);
        setPoliciesList(policyNames);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      }
    };

    if (canViewPolicies) fetchPolicies();
  }, [accessToken, canViewPolicies]);

  // Fetch resolved guardrails for all policies
  useEffect(() => {
    const fetchPolicyGuardrails = async () => {
      if (!accessToken || !teamData?.team_info?.policies || teamData.team_info.policies.length === 0) {
        return;
      }

      setLoadingPolicies(true);
      const guardrailsMap: Record<string, string[]> = {};

      try {
        await Promise.all(
          teamData.team_info.policies.map(async (policyName: string) => {
            try {
              const policyInfo = await getPolicyInfoWithGuardrails(accessToken, policyName);
              guardrailsMap[policyName] = policyInfo.resolved_guardrails || [];
            } catch (error) {
              console.error(`Failed to fetch guardrails for policy ${policyName}:`, error);
              guardrailsMap[policyName] = [];
            }
          }),
        );
        setPolicyGuardrails(guardrailsMap);
      } catch (error) {
        console.error("Failed to fetch policy guardrails:", error);
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchPolicyGuardrails();
  }, [accessToken, teamData?.team_info?.policies]);

  const handleMemberCreate = async (values: any) => {
    try {
      if (accessToken == null) return;

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };

      await teamMemberAddCall(accessToken, teamId, member);

      toast.success(i18n.t("teamPage.teamInfo.memberAddedSuccess", { defaultValue: "Team member added successfully" }));
      setIsAddMemberModalVisible(false);
      form.reset(teamFormValues());

      // Fetch updated team info
      const updatedTeamData = await teamInfoCall(accessToken, teamId);
      setTeamData(updatedTeamData);

      // Notify parent component of the update
      onUpdate(updatedTeamData);
    } catch (error: any) {
      let errMsg = i18n.t("teamPage.teamInfo.failedToAddMember", { defaultValue: "Failed to add team member" });

      if (error?.raw?.detail?.error?.includes("Assigning team admins is a premium feature")) {
        errMsg = i18n.t("teamPage.teamInfo.assignAdminsEnterprise", { defaultValue: "Assigning admins is an enterprise-only feature. Please upgrade your LiteLLM plan to enable this." });
      } else if (error?.message) {
        errMsg = error.message;
      }

      toast.fromError(errMsg);
      console.error("Error adding team member:", error);
    }
  };

  const handleMemberUpdate = async (values: any) => {
    try {
      if (accessToken == null) {
        return;
      }

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
        max_budget_in_team: values.max_budget_in_team,
        tpm_limit: values.tpm_limit,
        rpm_limit: values.rpm_limit,
        budget_duration: values.budget_duration,
        allowed_models: values.allowed_models,
        temp_budget_increase: values.temp_budget_increase,
        temp_budget_expiry: values.temp_budget_expiry,
      };
      toast.dismiss(); // Remove all existing toasts

      await teamMemberUpdateCall(accessToken, teamId, member);

      toast.success(i18n.t("teamPage.teamInfo.memberUpdatedSuccess", { defaultValue: "Team member updated successfully" }));
      setIsEditMemberModalVisible(false);

      // Fetch updated team info
      const updatedTeamData = await teamInfoCall(accessToken, teamId);
      setTeamData(updatedTeamData);

      // Notify parent component of the update
      onUpdate(updatedTeamData);
    } catch (error: any) {
      let errMsg = i18n.t("teamPage.teamInfo.failedToUpdateMember", { defaultValue: "Failed to update team member" });
      if (error?.raw?.detail?.includes("Assigning team admins is a premium feature")) {
        errMsg = i18n.t("teamPage.teamInfo.assignAdminsEnterprise", { defaultValue: "Assigning admins is an enterprise-only feature. Please upgrade your LiteLLM plan to enable this." });
      } else if (error?.message) {
        errMsg = error.message;
      }
      setIsEditMemberModalVisible(false);

      toast.dismiss(); // Remove all existing toasts

      toast.fromError(errMsg);
      console.error("Error updating team member:", error);
    }
  };

  const handleMemberDelete = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await teamMemberDeleteCall(accessToken, teamId, memberToDelete);

      toast.success(i18n.t("teamPage.teamInfo.memberRemovedSuccess", { defaultValue: "Team member removed successfully" }));

      // Fetch updated team info
      const updatedTeamData = await teamInfoCall(accessToken, teamId);
      setTeamData(updatedTeamData);

      // Notify parent component of the update
      onUpdate(updatedTeamData);
    } catch (error) {
      toast.fromError(i18n.t("teamPage.teamInfo.failedToRemoveMember", { defaultValue: "Failed to remove team member" }));
      console.error("Error removing team member:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const persistTeamUpdate = async (token: string, updateData: Record<string, unknown>) => {
    await teamUpdateCall(token, updateData);
    void queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    void invalidateTeamQueries(queryClient);
    setIsEditing(false);
  };

  const memberBudgetReset = useMemberBudgetReset({
    saveTeam: async (updateData) => {
      if (!accessToken) return;
      setIsTeamSaving(true);
      try {
        await persistTeamUpdate(accessToken, updateData);
      } finally {
        setIsTeamSaving(false);
      }
    },
    resetMemberBudgets: async (bulkTeamId, userIds) => {
      const { data } = await fetchClient.POST("/management/v1/teams/{team_id}/members/bulk_update", {
        params: { path: { team_id: bulkTeamId } },
        body: { members: userIds.map((user_id) => ({ user_id, max_budget_in_team: null })) },
      });
      return data?.data ?? [];
    },
    refreshTeamData,
  });

  const { dismiss: dismissMemberBudgetReset } = memberBudgetReset;
  useEffect(() => {
    dismissMemberBudgetReset();
  }, [teamId, dismissMemberBudgetReset]);

  const saveTeamAdminSettings = async (changes: TeamAdminSettingsChanges) => {
    if (!accessToken) return;
    setIsTeamSaving(true);
    try {
      await persistTeamUpdate(accessToken, { team_id: teamId, ...changes });
      toast.success(i18n.t("teamPage.teamInfo.teamSettingsUpdatedSuccess", { defaultValue: "Team settings updated successfully" }));
      await fetchTeamInfo();
    } catch (error) {
      console.error("Error updating team:", error);
    } finally {
      setIsTeamSaving(false);
    }
  };

  const handleTeamUpdate = async (values: any) => {
    try {
      if (!accessToken) return;
      setIsTeamSaving(true);

      const parsedMetadata = metadataPairsToObject(values.metadata);

      let secretManagerSettings: Record<string, any> | undefined;
      if (typeof values.secret_manager_settings === "string") {
        const trimmedSecretConfig = values.secret_manager_settings.trim();
        if (trimmedSecretConfig.length > 0) {
          try {
            secretManagerSettings = JSON.parse(values.secret_manager_settings);
          } catch (e) {
            toast.fromError(i18n.t("teamPage.teamInfo.invalidSecretManagerJson", { defaultValue: "Invalid JSON in secret manager settings" }));
            return;
          }
        }
      }

      const estimatedOutputTokens = numberOrNull(values.default_estimated_output_tokens);

      let estimatedOutputTokensPerModel: Record<string, number> | undefined;
      if (typeof values.default_estimated_output_tokens_per_model === "string") {
        const trimmedEstimates = values.default_estimated_output_tokens_per_model.trim();
        if (trimmedEstimates.length > 0) {
          try {
            estimatedOutputTokensPerModel = JSON.parse(trimmedEstimates);
          } catch (e) {
            toast.fromError(i18n.t("teamPage.teamInfo.invalidEstimatedTokensJson", { defaultValue: "Invalid JSON in estimated output tokens per model" }));
            return;
          }
        }
      }

      const modelTpmLimit: Record<string, number> = {};
      const modelRpmLimit: Record<string, number> = {};
      for (const entry of (values.modelLimits ?? []) as { model?: string; tpm?: number; rpm?: number }[]) {
        if (entry?.model) {
          if (entry.tpm != null) modelTpmLimit[entry.model] = entry.tpm;
          if (entry.rpm != null) modelRpmLimit[entry.model] = entry.rpm;
        }
      }

      const killSwitchOnAtSave = values.disable_global_guardrails === true;
      const optedOutGlobalGuardrails = killSwitchOnAtSave
        ? Array.from(globalGuardrailNames)
        : Array.from(globalGuardrailNames).filter((n) => !(values.guardrails || []).includes(n));

      // Non-proxy-admins can't set allowed_passthrough_routes; preserve the
      // stored value so an unrelated save can't wipe it.
      const passthroughRoutesMetadata = is_proxy_admin
        ? { allowed_passthrough_routes: values.allowed_passthrough_routes || [] }
        : info.metadata?.allowed_passthrough_routes
          ? { allowed_passthrough_routes: info.metadata.allowed_passthrough_routes }
          : {};

      const memberBudgetAlertEmails =
        values.team_member_max_budget_alert_emails !== undefined
          ? teamMemberBudgetAlertEmailsFromRows(values.team_member_max_budget_alert_emails)
          : info.metadata?.[TEAM_MEMBER_MAX_BUDGET_ALERT_EMAILS_KEY];
      const memberBudgetAlertEmailsMetadata =
        memberBudgetAlertEmails !== undefined && Object.keys(memberBudgetAlertEmails).length > 0
          ? { [TEAM_MEMBER_MAX_BUDGET_ALERT_EMAILS_KEY]: memberBudgetAlertEmails }
          : {};

      const updateData: any = {
        team_id: teamId,
        team_alias: values.team_alias,
        models: normalizeTeamModelSelection(values.models),
        tpm_limit: numberOrNull(values.tpm_limit),
        rpm_limit: numberOrNull(values.rpm_limit),
        tpd_limit: numberOrNull(values.tpd_limit),
        model_tpm_limit: modelTpmLimit,
        model_rpm_limit: modelRpmLimit,
        max_budget: numberOrNull(values.max_budget),
        soft_budget: numberOrNull(values.soft_budget),
        budget_duration: values.budget_duration ?? null,
        metadata: {
          ...parsedMetadata,
          ...passthroughRoutesMetadata,
          guardrails: (values.guardrails || []).filter((n: string) => !globalGuardrailNames.has(n)),
          opted_out_global_guardrails: optedOutGlobalGuardrails,
          ...(values.logging_settings?.length > 0 ? { logging: values.logging_settings } : {}),
          disable_global_guardrails: killSwitchOnAtSave,
          ...(estimatedOutputTokens !== null ? { default_estimated_output_tokens: estimatedOutputTokens } : {}),
          ...(estimatedOutputTokensPerModel !== undefined
            ? { default_estimated_output_tokens_per_model: estimatedOutputTokensPerModel }
            : {}),
          soft_budget_alerting_emails:
            typeof values.soft_budget_alerting_emails === "string"
              ? values.soft_budget_alerting_emails
                  .split(",")
                  .map((email: string) => email.trim())
                  .filter((email: string) => email.length > 0)
              : values.soft_budget_alerting_emails || [],
          ...(secretManagerSettings !== undefined ? { secret_manager_settings: secretManagerSettings } : {}),
          ...memberBudgetAlertEmailsMetadata,
        },
        ...(values.policies?.length > 0 ? { policies: values.policies } : {}),
        ...(values.organization_id !== info.organization_id ? { organization_id: values.organization_id ?? null } : {}),
      };

      updateData.team_member_budget_duration = values.team_member_budget_duration;

      const newTeamMemberBudget =
        values.team_member_budget !== undefined ? numberOrNull(values.team_member_budget) : undefined;
      if (newTeamMemberBudget !== undefined) {
        updateData.team_member_budget = newTeamMemberBudget;
      }

      if (values.team_member_key_duration !== undefined) {
        updateData.team_member_key_duration = values.team_member_key_duration;
      }

      if (values.team_member_tpm_limit !== undefined || values.team_member_rpm_limit !== undefined) {
        updateData.team_member_tpm_limit = numberOrNull(values.team_member_tpm_limit);
        updateData.team_member_rpm_limit = numberOrNull(values.team_member_rpm_limit);
      }

      // Handle object_permission updates
      const { servers, accessGroups, toolsets } = values.mcp_servers_and_groups || {
        servers: [],
        accessGroups: [],
        toolsets: [],
      };
      const submittedToolPermissions: Record<string, string[]> = values.mcp_tool_permissions || {};
      const effectiveMcpInput = {
        allServers: allMcpServers,
        selectedServers: servers || [],
        selectedAccessGroups: accessGroups || [],
        selectedToolsets: toolsets || [],
        toolsets: allMcpToolsets,
        toolPermissions: submittedToolPermissions,
      };
      const loadedObjectPermission = info.object_permission ?? {};
      const loadedMcpInput = {
        allServers: allMcpServers,
        selectedServers: loadedObjectPermission.mcp_servers ?? [],
        selectedAccessGroups: loadedObjectPermission.mcp_access_groups ?? [],
        selectedToolsets: loadedObjectPermission.mcp_toolsets ?? [],
        toolsets: allMcpToolsets,
        toolPermissions: loadedObjectPermission.mcp_tool_permissions ?? {},
      };
      const loadedEffectiveMcpServers = resolveEffectiveMcpServers(loadedMcpInput);
      const standingServerIds = standingToolPermissionServerIds(
        loadedEffectiveMcpServers,
        info.access_group_ids ?? [],
        allAccessGroups,
        info.access_group_mcp_server_ids ?? [],
      );
      const mcpGrantInput: McpGrantInput = {
        effectiveServers: resolveEffectiveMcpServers(effectiveMcpInput),
        selectedAccessGroupIds: values.access_group_ids || [],
        accessGroups: allAccessGroups,
        standingServerIds,
        loadTeamGroups: async () => {
          const teamInfo = await teamInfoCall(accessToken, teamId);
          return {
            ids: teamInfo.team_info.access_group_ids ?? [],
            serverIds: teamInfo.team_info.access_group_mcp_server_ids ?? [],
          };
        },
      };
      const mcpResolution: McpGrantResolution =
        mcpLookupFailure !== null
          ? { kind: "unresolvable", reason: mcpLookupFailure }
          : await grantedMcpServerIds(mcpGrantInput);
      if (mcpResolution.kind === "unresolvable" && Object.keys(submittedToolPermissions).length > 0) {
        toast.fromError(mcpUnresolvableSaveError(mcpResolution.reason));
        return;
      }
      const mcpToolPermissions =
        mcpResolution.kind === "resolved"
          ? retainedMcpToolPermissions(submittedToolPermissions, mcpResolution.serverIds, allMcpServers)
          : submittedToolPermissions;

      updateData.object_permission = {};
      if (servers) {
        updateData.object_permission.mcp_servers = servers;
      }
      if (accessGroups) {
        updateData.object_permission.mcp_access_groups = accessGroups;
      }
      if (mcpToolPermissions) {
        updateData.object_permission.mcp_tool_permissions = mcpToolPermissions;
      }
      if (toolsets) {
        updateData.object_permission.mcp_toolsets = toolsets;
      }
      delete values.mcp_servers_and_groups;
      delete values.mcp_tool_permissions;

      // Handle agent permissions
      const { agents, accessGroups: agentAccessGroups } = values.agents_and_groups || {
        agents: [],
        accessGroups: [],
      };
      updateData.object_permission.agents = agents;
      updateData.object_permission.agent_access_groups = agentAccessGroups;
      delete values.agents_and_groups;

      // Handle vector stores permissions
      if (values.vector_stores) {
        updateData.object_permission.vector_stores = values.vector_stores;
      }

      if (Array.isArray(values.object_permission_search_tools)) {
        updateData.object_permission.search_tools = values.object_permission_search_tools;
      }

      if (Array.isArray(values.object_permission_skills)) {
        updateData.object_permission.skills = values.object_permission_skills;
      }

      // Pass access_group_ids to the update request
      if (values.access_group_ids !== undefined) {
        updateData.access_group_ids = values.access_group_ids;
      }

      // Pass default_team_member_models to the update request
      if (values.default_team_member_models !== undefined) {
        updateData.default_team_member_models = values.default_team_member_models;
      }

      const previousModelAliases = info.litellm_model_table?.model_aliases ?? {};
      if (Object.keys(teamModelAliases).length > 0 || Object.keys(previousModelAliases).length > 0) {
        updateData.model_aliases = teamModelAliases;
      }

      const modelBudgets = modelMaxBudgetUpdate(teamModelMaxBudget, info.model_max_budget);
      if (modelBudgets !== undefined) {
        updateData.model_max_budget = modelBudgets;
      }

      // Handle router_settings - read fresh values from DOM at save time.
      const currentRouterSettings = routerSettingsRef.current?.getValue();
      if (currentRouterSettings?.router_settings) {
        const isMeaningfulValue = (value: unknown) =>
          value !== null &&
          value !== undefined &&
          value !== "" &&
          value !== false &&
          !(Array.isArray(value) && value.length === 0);

        const hasNewValues = Object.values(currentRouterSettings.router_settings).some(isMeaningfulValue);
        const hadExistingSettings = info.router_settings && Object.values(info.router_settings).some(isMeaningfulValue);

        // Send if there are new values OR if the user is clearing existing ones
        if (hasNewValues || hadExistingSettings) {
          updateData.router_settings = currentRouterSettings.router_settings;
        }
      }

      const customBudgetUserIds = customBudgetMemberUserIds(teamData?.team_memberships ?? []);
      if (
        typeof newTeamMemberBudget === "number" &&
        shouldPromptMemberBudgetReset(
          newTeamMemberBudget,
          info.team_member_budget_table?.max_budget,
          customBudgetUserIds,
        )
      ) {
        const pendingReset = {
          teamId,
          updateData,
          userIds: customBudgetUserIds,
          newBudget: newTeamMemberBudget,
        };
        memberBudgetReset.prompt(pendingReset);
        return;
      }

      await persistTeamUpdate(accessToken, updateData);
      toast.success(i18n.t("teamPage.teamInfo.teamSettingsUpdatedSuccess", { defaultValue: "Team settings updated successfully" }));
      await fetchTeamInfo();
    } catch (error) {
      console.error("Error updating team:", error);
    } finally {
      setIsTeamSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">{i18n.t("common.loading", { defaultValue: "Loading..." })}</div>;
  }

  if (!teamData?.team_info) {
    return <div className="p-4">{i18n.t("teamPage.teamInfo.teamNotFound", { defaultValue: "Team not found" })}</div>;
  }

  const { team_info: info } = teamData;

  const teamAdminSettingsEditor =
    teamEditAccess.kind === "team_admin" ? (
      <TeamAdminSettingsForm
        initialValues={{ tpm_limit: info.tpm_limit, rpm_limit: info.rpm_limit, max_budget: info.max_budget }}
        editableFields={teamEditAccess.editableFields}
        isSaving={isTeamSaving}
        onCancel={() => setIsEditing(false)}
        onSave={saveTeamAdminSettings}
      />
    ) : null;

  const inheritedMcpServers = computeInheritedGrants(
    info.access_group_mcp_server_ids,
    info.access_group_details,
    (grant) => grant.mcp_server_ids,
  );
  const inheritedAgents = computeInheritedGrants(
    info.access_group_agent_ids,
    info.access_group_details,
    (grant) => grant.agent_ids,
  );

  const initialKillSwitchOn = info.metadata?.disable_global_guardrails === true;

  const allGuardrails: GuardrailListItem[] = guardrailsData?.guardrails ?? [];
  const globalGuardrails = allGuardrails.filter((g) => g.litellm_params?.default_on);
  const otherGuardrails = allGuardrails.filter((g) => !g.litellm_params?.default_on);

  const copyToClipboard = async (text: string, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const tabItems = [
    {
      key: TEAM_INFO_TAB_KEYS.OVERVIEW,
      label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.OVERVIEW],
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="block p-6">
            <p>{i18n.t("teamPage.teamInfo.budgetStatus", { defaultValue: "Budget Status" })}</p>
            <div className="mt-2">
              <h3 className="text-lg font-medium">¥{formatNumberWithCommas(info.spend, 2)}</h3>
              <p>of {info.max_budget === null ? i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" }) : `¥${formatNumberWithCommas(info.max_budget, 2)}`}</p>
              {info.budget_duration && <p className="text-muted-foreground">Reset: {info.budget_duration}</p>}
              <br />
              {info.team_member_budget_table && (
                <p className="text-muted-foreground">
                  Team Member Budget: ¥{formatNumberWithCommas(info.team_member_budget_table.max_budget, 2)}
                </p>
              )}
            </div>
          </Card>

          <Card className="block p-6">
            <p>{i18n.t("teamPage.teamInfo.rateLimits", { defaultValue: "Rate Limits" })}</p>
            <div className="mt-2">
              <p>TPM: {info.tpm_limit ?? i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" })}</p>
              <p>RPM: {info.rpm_limit ?? i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" })}</p>
              <p>TPD (batch): {info.tpd_limit ?? i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" })}</p>
              {info.max_parallel_requests && <p>Max Parallel Requests: {info.max_parallel_requests}</p>}
              {(() => {
                const modelTpm = (info.metadata?.model_tpm_limit ?? {}) as Record<string, number>;
                const modelRpm = (info.metadata?.model_rpm_limit ?? {}) as Record<string, number>;
                const models = Array.from(new Set([...Object.keys(modelTpm), ...Object.keys(modelRpm)]));
                if (models.length === 0) return null;
                return (
                  <div className="mt-3">
                    <p className="text-muted-foreground">{i18n.t("teamPage.teamInfo.perModelLimits", { defaultValue: "Per-model limits:" })}</p>
                    {models.map((m) => (
                      <p key={m} className="text-xs">
                        {m}: TPM {modelTpm[m] ?? "—"}, RPM {modelRpm[m] ?? "—"}
                      </p>
                    ))}
                  </div>
                );
              })()}
              <p>Estimated Output Tokens: {info.metadata?.default_estimated_output_tokens ?? i18n.t("common.default", { defaultValue: "Default" })}</p>
              <p>
                Estimated Output Tokens Per Model:{" "}
                {info.metadata?.default_estimated_output_tokens_per_model
                  ? JSON.stringify(info.metadata.default_estimated_output_tokens_per_model)
                  : i18n.t("common.default", { defaultValue: "Default" })}
              </p>
            </div>
          </Card>

          <Card className="block p-6">
            <p>{i18n.t("teamPage.teamInfo.modelsLabel", { defaultValue: "Models" })}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {computeTeamModelBadges(info.models, info.access_group_models || [], info.access_group_details).map(
                (badge, index) => (
                  <SimpleTooltip key={`${badge.kind}-${badge.label}-${index}`} content={badge.tooltip}>
                    <span>
                      <StatusBadge
                        tone={TEAM_MODEL_BADGE_TONES[badge.kind]}
                        label={badge.label}
                        href={teamModelBadgeHref(badge, accessGroupNames)}
                      />
                    </span>
                  </SimpleTooltip>
                ),
              )}
            </div>
          </Card>

          <Card className="block p-6">
            <p className="font-semibold text-foreground">{i18n.t("teamPage.teamInfo.virtualKeys", { defaultValue: "Virtual Keys" })}</p>
            <div className="mt-2">
              <p>User Keys: {teamData.keys.filter((key) => key.user_id).length}</p>
              <p>Service Account Keys: {teamData.keys.filter((key) => !key.user_id).length}</p>
              <p className="text-muted-foreground">Total: {teamData.keys.length}</p>
            </div>
          </Card>

          <ObjectPermissionsView
            objectPermission={info.object_permission}
            inheritedMcpServers={inheritedMcpServers}
            inheritedAgents={inheritedAgents}
            variant="card"
            accessToken={accessToken}
          />

          <Card className="block p-6">
            <GuardrailSettingsView
              globalGuardrailNames={globalGuardrailNames}
              teamGuardrails={Array.isArray(info.metadata?.guardrails) ? info.metadata.guardrails : []}
              optedOutGlobalGuardrails={
                Array.isArray(info.metadata?.opted_out_global_guardrails)
                  ? info.metadata.opted_out_global_guardrails
                  : []
              }
              killSwitchOn={initialKillSwitchOn}
              variant="inline"
            />
          </Card>

          <Card className="block p-6">
            <p className="font-semibold text-foreground mb-3">{i18n.t("teamPage.teamInfo.policiesLabel", { defaultValue: "Policies" })}</p>
            {info.policies && info.policies.length > 0 ? (
              <div className="space-y-4">
                {info.policies.map((policy: string, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{policy}</Badge>
                      {loadingPolicies && <p className="text-xs text-muted-foreground">{i18n.t("teamPage.teamInfo.loadingGuardrails", { defaultValue: "Loading guardrails..." })}</p>}
                    </div>
                    {!loadingPolicies && policyGuardrails[policy] && policyGuardrails[policy].length > 0 && (
                      <div className="ml-4 pl-3 border-l-2 border-border">
                        <p className="text-xs text-muted-foreground mb-1">{i18n.t("teamPage.teamInfo.resolvedGuardrails", { defaultValue: "Resolved Guardrails:" })}</p>
                        <div className="flex flex-wrap gap-1">
                          {policyGuardrails[policy].map((guardrail: string, gIndex: number) => (
                            <Badge key={gIndex} variant="secondary">
                              {guardrail}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{i18n.t("teamPage.teamInfo.noPoliciesConfigured", { defaultValue: "No policies configured" })}</p>
            )}
          </Card>

          <LoggingSettingsView loggingConfigs={info.metadata?.logging || []} disabledCallbacks={[]} variant="card" />
        </div>
      ),
    },
    {
      key: TEAM_INFO_TAB_KEYS.MY_USER,
      label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.MY_USER],
      children: <MyUserTab teamId={teamId} />,
    },
    {
      key: TEAM_INFO_TAB_KEYS.VIRTUAL_KEYS,
      label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.VIRTUAL_KEYS],
      children: <TeamVirtualKeysTable teamId={teamId} teamAlias={info.team_alias} organization={organization} />,
    },
    {
      key: TEAM_INFO_TAB_KEYS.MEMBERS,
      label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.MEMBERS],
      children: (
        <TeamMembersComponent
          teamData={teamData}
          canEditTeam={canEditTeam}
          handleMemberDelete={handleMemberDelete}
          onMemberSpendReset={refreshTeamData}
          onMemberBudgetReset={refreshTeamData}
          setSelectedEditMember={setSelectedEditMember}
          setIsEditMemberModalVisible={setIsEditMemberModalVisible}
          setIsAddMemberModalVisible={setIsAddMemberModalVisible}
        />
      ),
    },
    {
      key: TEAM_INFO_TAB_KEYS.MEMBER_PERMISSIONS,
      label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.MEMBER_PERMISSIONS],
      children: <MemberPermissions teamId={teamId} accessToken={accessToken} canEditTeam={canEditTeam} />,
    },
    {
      key: TEAM_INFO_TAB_KEYS.SETTINGS,
      label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.SETTINGS],
      children: (
        <Card className="block p-6 overflow-y-auto max-h-[65vh]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{i18n.t("teamPage.teamInfo.teamSettings", { defaultValue: "Team Settings" })}</h3>
            {canEditTeam && !isEditing && (
              <Button
                variant="outline"
                onClick={() => openSettingsEditor(info.litellm_model_table?.model_aliases ?? {})}
              >
                <Pencil />
                {i18n.t("teamPage.teamInfo.editSettings", { defaultValue: "Edit Settings" })}
              </Button>
            )}
          </div>

          {isEditing && (teamAdminSettingsEditor !== null || isGuardrailsLoading) ? (
            teamAdminSettingsEditor ?? <div className="p-4">{i18n.t("common.loading", { defaultValue: "Loading..." })}</div>
          ) : isEditing ? (
            <TooltipProvider>
              <form onSubmit={(event) => void form.handleSubmit(onTeamUpdateSubmit)(event)}>
                <FieldGroup>
                  <FormField control={form.control} name="team_alias" label={i18n.t("teamPage.teamInfo.teamNameLabel", { defaultValue: "Team Name" })}>
                    {({ ref, value, ...field }) => <UIInput {...field} ref={ref} value={value ?? ""} />}
                  </FormField>

                  <FormField
                    control={form.control}
                    name="models"
                    label={i18n.t("teamPage.teamInfo.modelsLabel", { defaultValue: "Models" })}
                    description={i18n.t("teamPage.teamInfo.modelsDescription", { defaultValue: "Leave empty to grant no models directly. The team keeps any models granted through its access groups" })}
                  >
                    {({ id, value, onChange }) => (
                      <ModelSelect
                        id={id}
                        value={value ?? []}
                        onChange={onChange}
                        teamID={teamId}
                        organizationID={teamData?.team_info?.organization_id || undefined}
                        options={{
                          includeSpecialOptions: true,
                          includeUserModels: !teamData?.team_info?.organization_id,
                          showAllProxyModelsOverride:
                            isProxyAdminRole(userRole) && !teamData?.team_info?.organization_id,
                        }}
                        context="team"
                        dataTestId="models-select"
                      />
                    )}
                  </FormField>

                  <Field>
                    <FieldLabel>
                      {labelWithHint(
                        i18n.t("teamPage.accordions.modelAliases", { defaultValue: "Model Aliases" }),
                        i18n.t("teamPage.teamInfo.modelAliasesTooltip", { defaultValue: "Map a custom alias to an underlying model. Team members can call the alias in API requests instead of the real model name." }),
                      )}
                    </FieldLabel>
                    <ModelAliasManager
                      accessToken={accessToken || ""}
                      initialModelAliases={teamModelAliases}
                      onAliasUpdate={setTeamModelAliases}
                      showExampleConfig={false}
                    />
                  </Field>

                  <FormField control={form.control} name="max_budget" label={i18n.t("teamPage.teamInfo.maxBudgetLabel", { defaultValue: "Max Budget (CNY)" })}>
                    {({ ref, value, ...field }) => (
                      <NumericalInput {...field} ref={ref} value={value ?? ""} step={0.01} precision={2} />
                    )}
                  </FormField>

                  <FormField control={form.control} name="soft_budget" label={i18n.t("teamPage.teamInfo.softBudgetLabel", { defaultValue: "Soft Budget (CNY)" })}>
                    {({ ref, value, ...field }) => (
                      <NumericalInput {...field} ref={ref} value={value ?? ""} step={0.01} precision={2} />
                    )}
                  </FormField>

                  <FormField
                    control={form.control}
                    name="soft_budget_alerting_emails"
                    label={labelWithHint(
                      i18n.t("teamPage.teamInfo.softBudgetEmailsLabel", { defaultValue: "Soft Budget Alerting Emails" }),
                      i18n.t("teamPage.teamInfo.softBudgetEmailsTooltip", { defaultValue: "Comma-separated email addresses to receive alerts when the soft budget is reached" }),
                    )}
                  >
                    {({ ref, value, ...field }) => (
                      <UIInput
                        {...field}
                        ref={ref}
                        value={typeof value === "string" ? value : ""}
                        placeholder={i18n.t("teamPage.teamInfo.softBudgetEmailsPlaceholder", { defaultValue: "example1@test.com, example2@test.com" })}
                      />
                    )}
                  </FormField>

                  <Collapsible
                    open={teamMemberSettingsOpen}
                    onOpenChange={setTeamMemberSettingsOpen}
                    className="mt-4 mb-4 overflow-hidden rounded-lg border"
                  >
                    <CollapsibleTrigger className="group/section flex w-full items-center justify-between px-4 py-3 text-left">
                      <b>{i18n.t("teamPage.teamInfo.teamMemberSettings", { defaultValue: "Team Member Settings" })}</b>
                      <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/section:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-3">
                      <p className="mb-4 text-xs text-muted-foreground">
                        {i18n.t("teamPage.teamInfo.teamMemberSettingsDesc", { defaultValue: "Optional defaults applied when members join this team. All fields can be overridden per member." })}
                      </p>
                      <FieldGroup>
                        <FormField
                          control={form.control}
                          name="default_team_member_models"
                          label={labelWithHint(
                            i18n.t("teamPage.teamInfo.defaultModelAccessLabel", { defaultValue: "Default Model Access" }),
                            i18n.t("teamPage.teamInfo.defaultModelAccessTooltip", { defaultValue: "Optional. If set, new members can only access these models by default. Must be a subset of the team's models above. Leave empty to give all members access to all team models." }),
                          )}
                        >
                          {({ id, value, onChange }) => (
                            <MultiSelect
                              id={id}
                              value={value ?? []}
                              onValueChange={onChange}
                              options={(watchedModels ?? info.models ?? []).map((model) => ({
                                label: model,
                                value: model,
                              }))}
                              placeholder={i18n.t("teamPage.teamInfo.defaultModelAccessPlaceholder", { defaultValue: "Leave empty — all team models accessible to every member" })}
                            />
                          )}
                        </FormField>
                        <FormField
                          control={form.control}
                          name="team_member_budget"
                          label={labelWithHint(
                            "Default Budget (CNY)",
                            i18n.t("teamPage.teamInfo.defaultBudgetTooltip", { defaultValue: "Default spend budget for each member in this team." }),
                          )}
                        >
                          {({ ref, value, ...field }) => (
                            <NumericalInput {...field} ref={ref} value={value ?? ""} step={0.01} precision={2} />
                          )}
                        </FormField>
                        <FormField
                          control={form.control}
                          name="team_member_budget_duration"
                          label={i18n.t("teamPage.teamInfo.defaultBudgetDurationLabel", { defaultValue: "Default Budget Duration" })}
                        >
                          {({ id, value, onChange }) => (
                            <BudgetDurationDropdown
                              id={id}
                              showNeverResets
                              placeholder={i18n.t("teamPage.teamInfo.inheritTeamResetPeriod", { defaultValue: "Inherit team reset period" })}
                              value={value === null ? NEVER_RESETS_BUDGET_DURATION : value}
                              onChange={(next) =>
                                onChange(next === NEVER_RESETS_BUDGET_DURATION ? null : next ?? undefined)
                              }
                            />
                          )}
                        </FormField>
                        <FormField
                          control={form.control}
                          name="team_member_key_duration"
                          label={labelWithHint(
                            i18n.t("teamPage.teamInfo.defaultKeyDurationLabel", { defaultValue: "Default Key Duration (eg: 1d, 1mo)" }),
                            i18n.t("teamPage.teamInfo.defaultKeyDurationTooltip", { defaultValue: "Set a limit to the duration of a team member's key. Format: 30s (seconds), 30m (minutes), 30h (hours), 30d (days), 1mo (month)" }),
                          )}
                        >
                          {({ ref, value, ...field }) => (
                            <UIInput {...field} ref={ref} value={value ?? ""} placeholder={i18n.t("teamPage.teamInfo.defaultKeyDurationPlaceholder", { defaultValue: "e.g., 30d" })} />
                          )}
                        </FormField>
                        <FormField
                          control={form.control}
                          name="team_member_tpm_limit"
                          label={labelWithHint(
                            i18n.t("teamPage.teamInfo.defaultTpmLimitLabel", { defaultValue: "Default TPM Limit" }),
                            i18n.t("teamPage.teamInfo.defaultTpmLimitTooltip", { defaultValue: "Default tokens per minute limit for each member. Can be overridden per member." }),
                          )}
                        >
                          {({ ref, value, ...field }) => (
                            <NumericalInput
                              {...field}
                              ref={ref}
                              value={value ?? ""}
                              step={1}
                              placeholder={i18n.t("teamPage.teamInfo.defaultTpmLimitPlaceholder", { defaultValue: "e.g., 1000" })}
                            />
                          )}
                        </FormField>
                        <FormField
                          control={form.control}
                          name="team_member_rpm_limit"
                          label={labelWithHint(
                            i18n.t("teamPage.teamInfo.defaultRpmLimitLabel", { defaultValue: "Default RPM Limit" }),
                            i18n.t("teamPage.teamInfo.defaultRpmLimitTooltip", { defaultValue: "Default requests per minute limit for each member. Can be overridden per member." }),
                          )}
                        >
                          {({ ref, value, ...field }) => (
                            <NumericalInput {...field} ref={ref} value={value ?? ""} step={1} placeholder={i18n.t("teamPage.teamInfo.defaultRpmLimitPlaceholder", { defaultValue: "e.g., 100" })} />
                          )}
                        </FormField>
                        <Field>
                          <FieldLabel>
                            {labelWithHint(
                              i18n.t("teamPage.teamInfo.budgetAlertThresholdsLabel", { defaultValue: "Budget Alert Thresholds" }),
                              i18n.t("teamPage.teamInfo.budgetAlertThresholdsTooltip", {
                                defaultValue: "Email each member when their spend reaches a percentage of their team member budget. The member is always notified; add comma-separated addresses to notify others as well. Requires email alerting to be configured on the proxy.",
                              }),
                            )}
                          </FieldLabel>
                          {memberBudgetAlertRows.map((row, index) => (
                            <div key={row.id} className="mb-2 flex items-start gap-2">
                              <FormField
                                control={form.control}
                                name={`team_member_max_budget_alert_emails.${index}.threshold`}
                                className="w-32"
                              >
                                {({ ref, value, onChange, ...field }) => (
                                  <NumericalInput
                                    {...field}
                                    ref={ref}
                                    value={value ?? ""}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                      onChange(event.target.value === "" ? null : Number(event.target.value))
                                    }
                                    placeholder={i18n.t("teamPage.teamInfo.budgetAlertPercentPlaceholder", { defaultValue: "% of budget" })}
                                    min={1}
                                    max={100}
                                    step={1}
                                  />
                                )}
                              </FormField>
                              <FormField
                                control={form.control}
                                name={`team_member_max_budget_alert_emails.${index}.emails`}
                                className="flex-1"
                              >
                                {({ ref, value, ...field }) => (
                                  <UIInput
                                    {...field}
                                    ref={ref}
                                    value={value ?? ""}
                                    placeholder={i18n.t("teamPage.teamInfo.budgetAlertEmailsPlaceholder", { defaultValue: "Additional recipients, e.g. finance@example.com" })}
                                  />
                                )}
                              </FormField>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={i18n.t("teamPage.teamInfo.removeBudgetAlertThreshold", { defaultValue: "Remove budget alert threshold" })}
                                className="mt-1 text-destructive"
                                onClick={() => removeMemberBudgetAlertRow(index)}
                              >
                                <CircleMinus className="size-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => appendMemberBudgetAlertRow({ threshold: null, emails: "" })}
                          >
                            <Plus className="size-4" />
                            {i18n.t("teamPage.teamInfo.addBudgetAlertThreshold", { defaultValue: "Add Budget Alert Threshold" })}
                          </Button>
                        </Field>
                      </FieldGroup>
                    </CollapsibleContent>
                  </Collapsible>

                  <FormField control={form.control} name="budget_duration" label={i18n.t("teamPage.teamInfo.resetBudgetLabel", { defaultValue: "Reset Budget" })}>
                    {({ id, value, onChange }) => (
                      <BudgetDurationDropdown
                        id={id}
                        placeholder={i18n.t("teamPage.teamInfo.neverResetsPlaceholder", { defaultValue: "Never resets" })}
                        value={value}
                        onChange={(next) => onChange(next ?? null)}
                      />
                    )}
                  </FormField>

                  <ModelMaxBudgetField
                    premiumUser={premiumUser}
                    value={teamModelMaxBudget}
                    onChange={setTeamModelMaxBudget}
                    availableModels={availableRateLimitModels}
                    usage={info.model_max_budget_usage}
                    hint={i18n.t("teamPage.teamInfo.modelMaxBudgetHint", { defaultValue: "Cap this team's spend on individual models, each with its own reset window. Every key on the team shares the cap unless the key sets its own budget for that model." })}
                  />

                  <FormField control={form.control} name="tpm_limit" label={i18n.t("teamPage.teamInfo.tpmLimitLabel", { defaultValue: "Tokens per minute Limit (TPM)" })}>
                    {({ ref, value, ...field }) => <NumericalInput {...field} ref={ref} value={value ?? ""} step={1} />}
                  </FormField>

                  <FormField control={form.control} name="rpm_limit" label={i18n.t("teamPage.teamInfo.rpmLimitLabel", { defaultValue: "Requests per minute Limit (RPM)" })}>
                    {({ ref, value, ...field }) => <NumericalInput {...field} ref={ref} value={value ?? ""} step={1} />}
                  </FormField>

                  <FormField
                    control={form.control}
                    name="tpd_limit"
                    label={labelWithHint(
                      i18n.t("teamPage.teamInfo.tokensPerDayLabel", { defaultValue: "Tokens per day Limit (TPD)" }),
                      i18n.t("teamPage.teamInfo.tokensPerDayTooltip", {
                        defaultValue: "Daily token budget for batch submissions (/v1/batches). When set, batch input files are charged against this 24h window instead of the team's TPM/RPM limits. Online requests keep using TPM/RPM.",
                      }),
                    )}
                  >
                    {({ ref, value, ...field }) => <NumericalInput {...field} ref={ref} value={value ?? ""} step={1} />}
                  </FormField>

                  <Field>
                    <FieldLabel>{i18n.t("teamPage.teamInfo.metadataLabel", { defaultValue: "Metadata" })}</FieldLabel>
                    <MetadataKeyValueFields
                      control={form.control}
                      getValues={form.getValues}
                      name="metadata"
                      schemaFields={teamMetadataSchemaFields}
                      schemaLoading={isTeamMetadataSchemaLoading}
                    />
                    <FieldDescription>
                      Values are saved as text. Enter JSON for typed values, e.g. 3, true, or {'{"region": "us"}'}.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {labelWithHint(
                        i18n.t("teamPage.teamInfo.modelSpecificRateLimitsLabel", { defaultValue: "Model-Specific Rate Limits" }),
                        i18n.t("teamPage.teamInfo.modelSpecificRateLimitsTooltip", { defaultValue: "Set per-model TPM/RPM limits that apply across the whole team." }),
                      )}
                    </FieldLabel>
                    {modelLimitRows.map((row, index) => (
                      <div key={row.id} className="mb-2 flex items-start gap-2">
                        <FormField control={form.control} name={`modelLimits.${index}.model`} className="min-w-60">
                          {({ id, value, onChange }) => (
                            <SearchSelect
                              inputId={id}
                              value={value ?? ""}
                              onValueChange={onChange}
                              options={availableRateLimitModels.map((model) => ({
                                label: model,
                                value: model,
                              }))}
                              placeholder={i18n.t("teamPage.teamInfo.selectModelPlaceholder", { defaultValue: "Select model" })}
                            />
                          )}
                        </FormField>
                        <FormField control={form.control} name={`modelLimits.${index}.tpm`}>
                          {({ ref, value, onChange, ...field }) => (
                            <NumericalInput
                              {...field}
                              ref={ref}
                              value={value ?? ""}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                onChange(event.target.value === "" ? null : Number(event.target.value))
                              }
                              placeholder={i18n.t("teamPage.teamInfo.tpmLimitPlaceholder", { defaultValue: "TPM Limit" })}
                              min={0}
                              step={1}
                            />
                          )}
                        </FormField>
                        <FormField control={form.control} name={`modelLimits.${index}.rpm`}>
                          {({ ref, value, onChange, ...field }) => (
                            <NumericalInput
                              {...field}
                              ref={ref}
                              value={value ?? ""}
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                onChange(event.target.value === "" ? null : Number(event.target.value))
                              }
                              placeholder={i18n.t("teamPage.teamInfo.rpmLimitPlaceholder", { defaultValue: "RPM Limit" })}
                              min={0}
                              step={1}
                            />
                          )}
                        </FormField>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={i18n.t("teamPage.teamInfo.removeModelLimitAria", { defaultValue: "Remove model limit" })}
                          className="mt-1 text-destructive"
                          onClick={() => removeModelLimit(index)}
                        >
                          <CircleMinus className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={() => appendModelLimit({ model: "", tpm: null, rpm: null })}
                    >
                      <Plus className="size-4" />
                      {i18n.t("teamPage.teamInfo.addModelLimitButton", { defaultValue: "Add Model Limit" })}
                    </Button>
                  </Field>

                  <FormField
                    control={form.control}
                    name="default_estimated_output_tokens"
                    label={labelWithHint(i18n.t("teamPage.teamInfo.estimatedOutputTokensLabel", { defaultValue: "Estimated Output Tokens" }), teamEstimateTooltip.estimate)}
                  >
                    {({ ref, value, ...field }) => (
                      <NumericalInput
                        {...field}
                        ref={ref}
                        value={value ?? ""}
                        min={1}
                        step={1}
                        disabled={!canEditTeamEstimates}
                      />
                    )}
                  </FormField>

                  <FormField
                    control={form.control}
                    name="default_estimated_output_tokens_per_model"
                    label={labelWithHint(i18n.t("teamPage.teamInfo.estimatedOutputTokensPerModelLabel", { defaultValue: "Estimated Output Tokens Per Model" }), teamEstimateTooltip.perModel)}
                  >
                    {({ ref, value, ...field }) => (
                      <Textarea
                        {...field}
                        ref={ref}
                        value={value ?? ""}
                        rows={4}
                        placeholder='{"gpt-4": 4096}'
                        disabled={!canEditTeamEstimates}
                      />
                    )}
                  </FormField>

                  <Field>
                    <FieldLabel>{i18n.t("teamPage.teamInfo.routerSettingsLabel", { defaultValue: "Router Settings" })}</FieldLabel>
                    <RouterSettingsAccordion
                      ref={routerSettingsRef}
                      accessToken={accessToken || ""}
                      teamId={teamId}
                      value={info.router_settings ? { router_settings: info.router_settings } : undefined}
                    />
                  </Field>

                  <FormField
                    control={form.control}
                    name="guardrails"
                    label={labelWithDocsHint(
                      i18n.t("teamPage.teamInfo.guardrailsLabel", { defaultValue: "Guardrails" }),
                      i18n.t("teamPage.teamInfo.guardrailsHint", { defaultValue: "Select which guardrails apply to this team. Global guardrails are enabled by default, uncheck to opt out. Other guardrails are opt-in." }),
                    )}
                  >
                    {({ id, value, onChange }) => (
                      <GuardrailsSelect
                        id={id}
                        value={value ?? []}
                        onValueChange={onChange}
                        globalGuardrails={globalGuardrails.map((g) => ({
                          name: g.guardrail_name,
                          disabled: Boolean(killSwitchOn),
                        }))}
                        otherGuardrails={otherGuardrails.map((g) => ({
                          name: g.guardrail_name,
                          disabled: false,
                        }))}
                        globalGuardrailNames={globalGuardrailNames}
                      />
                    )}
                  </FormField>

                  {is_proxy_admin && (
                    <FormField
                      control={form.control}
                      name="disable_global_guardrails"
                      label={labelWithHint(
                        i18n.t("teamPage.teamInfo.disableGlobalGuardrailsLabel", { defaultValue: "Disable all global guardrails" }),
                        i18n.t("teamPage.teamInfo.disableGlobalGuardrailsTooltip", { defaultValue: "Kill switch: bypass every global guardrail for this team, including any added in the future. For per-guardrail opt-out instead, use the Guardrails dropdown above." }),
                      )}
                    >
                      {({ id, value, onChange }) => (
                        <Switch
                          id={id}
                          checked={value === true}
                          onCheckedChange={(checked) => {
                            onChange(checked);
                            applyKillSwitchToGuardrails(checked);
                          }}
                        />
                      )}
                    </FormField>
                  )}

                  {canViewPolicies && (
                    <FormField
                      control={form.control}
                      name="policies"
                      label={labelWithDocsHint(
                        i18n.t("teamPage.teamInfo.policiesLabel", { defaultValue: "Policies" }),
                        i18n.t("teamPage.teamInfo.policiesTooltip", { defaultValue: "Apply policies to this team to control guardrails and other settings" }),
                      )}
                    >
                      {({ id, value, onChange }) => (
                        <TagsInput
                          id={id}
                          value={value ?? []}
                          onValueChange={onChange}
                          options={policiesList.map((name) => ({ value: name, label: name }))}
                          placeholder={i18n.t("teamPage.teamInfo.selectPoliciesPlaceholder", { defaultValue: "Select or enter policies" })}
                        />
                      )}
                    </FormField>
                  )}

                  <FormField
                    control={form.control}
                    name="access_group_ids"
                    label={labelWithHint(
                      i18n.t("teamPage.teamInfo.accessGroupsLabel", { defaultValue: "Access Groups" }),
                      i18n.t("teamPage.teamInfo.accessGroupsTooltip", { defaultValue: "Assign access groups to this team. Access groups control which models, MCP servers, and agents this team can use" }),
                    )}
                  >
                    {({ value, onChange }) => (
                      <AccessGroupSelector
                        value={value}
                        onChange={onChange}
                        placeholder={i18n.t("teamPage.teamInfo.accessGroupsPlaceholder", { defaultValue: "Select access groups (optional)" })}
                      />
                    )}
                  </FormField>

                  <FormField control={form.control} name="vector_stores" label={i18n.t("teamPage.teamInfo.vectorStoresLabel", { defaultValue: "Vector Stores" })}>
                    {({ value, onChange }) => (
                      <VectorStoreSelector
                        onChange={onChange}
                        value={value}
                        accessToken={accessToken || ""}
                        placeholder={i18n.t("teamPage.teamInfo.vectorStoresPlaceholder", { defaultValue: "Select vector stores" })}
                      />
                    )}
                  </FormField>

                  <FormField
                    control={form.control}
                    name="allowed_passthrough_routes"
                    label={
                      !premiumUser
                        ? labelWithHint(
                            i18n.t("teamPage.teamInfo.allowedPassThroughLabel", { defaultValue: "Allowed Pass Through Routes" }),
                            i18n.t("teamPage.teamInfo.passThroughPremiumTooltip", { defaultValue: "Premium feature - Upgrade to set allowed pass through routes" }),
                          )
                        : !is_proxy_admin
                          ? labelWithHint(
                              i18n.t("teamPage.teamInfo.allowedPassThroughLabel", { defaultValue: "Allowed Pass Through Routes" }),
                              i18n.t("teamPage.teamInfo.passThroughAdminTooltip", { defaultValue: "Only proxy admins can set allowed pass through routes" }),
                            )
                          : i18n.t("teamPage.teamInfo.allowedPassThroughLabel", { defaultValue: "Allowed Pass Through Routes" })
                    }
                  >
                    {({ value, onChange }) => (
                      <PassThroughRoutesSelector
                        value={value}
                        onChange={onChange}
                        accessToken={accessToken || ""}
                        placeholder={i18n.t("teamPage.teamInfo.passThroughPlaceholder", { defaultValue: "Select pass through routes" })}
                        disabled={!premiumUser || !is_proxy_admin}
                      />
                    )}
                  </FormField>

                  <FormField control={form.control} name="mcp_servers_and_groups" label={i18n.t("teamPage.teamInfo.mcpServersLabel", { defaultValue: "MCP Servers / Access Groups" })}>
                    {({ value, onChange }) => (
                      <MCPServerSelector
                        onChange={onChange}
                        value={value}
                        accessToken={accessToken || ""}
                        placeholder={i18n.t("teamPage.teamInfo.mcpServersPlaceholder", { defaultValue: "Select MCP servers or access groups (optional)" })}
                        allowAllProxyMcpServers={is_proxy_admin}
                      />
                    )}
                  </FormField>

                  <div className="mb-6">
                    <MCPToolPermissions
                      accessToken={accessToken || ""}
                      selectedServers={watchedMcpSelection?.servers || []}
                      selectedAccessGroups={watchedMcpSelection?.accessGroups || []}
                      selectedToolsets={watchedMcpSelection?.toolsets || []}
                      toolPermissions={watchedToolPermissions || {}}
                      onChange={(toolPerms) => form.setValue("mcp_tool_permissions", toolPerms)}
                    />
                  </div>

                  <FormField control={form.control} name="agents_and_groups" label={i18n.t("teamPage.teamInfo.agentsLabel", { defaultValue: "Agents / Access Groups" })}>
                    {({ value, onChange }) => (
                      <AgentSelector
                        onChange={onChange}
                        value={value}
                        accessToken={accessToken || ""}
                        placeholder={i18n.t("teamPage.teamInfo.agentsPlaceholder", { defaultValue: "Select agents or access groups (optional)" })}
                      />
                    )}
                  </FormField>

                  <Collapsible
                    open={searchToolSettingsOpen}
                    onOpenChange={setSearchToolSettingsOpen}
                    className="mt-4 mb-4 overflow-hidden rounded-lg border"
                  >
                    <CollapsibleTrigger className="group/section flex w-full items-center justify-between px-4 py-3 text-left">
                      <b>{i18n.t("teamPage.teamInfo.searchToolSettingsHeader", { defaultValue: "Search Tool Settings" })}</b>
                      <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/section:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-3">
                      <FormField
                        control={form.control}
                        name="object_permission_search_tools"
                        label={labelWithHint(
                          i18n.t("teamPage.teamInfo.allowedSearchToolsLabel", { defaultValue: "Allowed Search Tools" }),
                          i18n.t("teamPage.teamInfo.allowedSearchToolsTooltip", { defaultValue: "Select which search tools this team can access. Leave empty to allow all search tools." }),
                        )}
                      >
                        {({ value, onChange }) => (
                          <SearchToolSelector
                            onChange={onChange}
                            value={value}
                            accessToken={accessToken || ""}
                            placeholder={i18n.t("teamPage.teamInfo.searchToolsPlaceholder", { defaultValue: "Select search tools (optional, empty = all allowed)" })}
                          />
                        )}
                      </FormField>
                    </CollapsibleContent>
                  </Collapsible>

                  <FormField
                    control={form.control}
                    name="object_permission_skills"
                    label={labelWithHint(
                      i18n.t("teamPage.teamInfo.skillsLabel", { defaultValue: "Skills" }),
                      i18n.t("teamPage.teamInfo.skillsTooltip", { defaultValue: "Enabled skills are visible to every team. Grant disabled (private) Claude Code plugins to this team here." }),
                    )}
                  >
                    {({ value, onChange }) => (
                      <SkillSelector
                        onChange={onChange}
                        value={value}
                        accessToken={accessToken || ""}
                        placeholder={i18n.t("teamPage.teamInfo.skillsPlaceholder", { defaultValue: "Select skills (optional)" })}
                      />
                    )}
                  </FormField>

                  <FormField control={form.control} name="organization_id" label={i18n.t("teamPage.teamInfo.organizationLabel", { defaultValue: "Organization" })}>
                    {({ id, value, onChange }) => (
                      <SearchSelect
                        inputId={id}
                        value={value ?? ""}
                        onValueChange={onChange}
                        options={userOrganizations.map((org) => ({
                          value: org.organization_id ?? "",
                          label: org.organization_alias || org.organization_id || "",
                        }))}
                        placeholder={i18n.t("teamPage.teamInfo.organizationPlaceholder", { defaultValue: "Select an organization" })}
                        emptyText={i18n.t("teamPage.teamInfo.noMatchingOrganizations", { defaultValue: "No matching organizations" })}
                      />
                    )}
                  </FormField>

                  <FormField control={form.control} name="logging_settings" label={i18n.t("teamPage.teamInfo.loggingSettingsLabel", { defaultValue: "Logging Settings" })}>
                    {({ value, onChange }) => (
                      <EditLoggingSettings value={(value as unknown[]) ?? []} onChange={onChange} />
                    )}
                  </FormField>

                  <FormField
                    control={form.control}
                    name="secret_manager_settings"
                    label={i18n.t("teamPage.teamInfo.secretManagerSettingsLabel", { defaultValue: "Secret Manager Settings" })}
                    description={
                      premiumUser
                        ? i18n.t("teamPage.teamInfo.secretManagerSettingsHelp", { defaultValue: "Enter secret manager configuration as a JSON object." })
                        : i18n.t("teamPage.teamInfo.secretManagerSettingsPremiumHelp", { defaultValue: "Premium feature - Upgrade to manage secret manager settings." })
                    }
                  >
                    {({ ref, value, ...field }) => (
                      <Textarea
                        {...field}
                        ref={ref}
                        value={value ?? ""}
                        rows={6}
                        placeholder='{"namespace": "admin", "mount": "secret", "path_prefix": "litellm"}'
                        disabled={!premiumUser}
                      />
                    )}
                  </FormField>
                </FieldGroup>

                <div className="sticky z-chrome -inset-x-6 -bottom-6 border-t border-border bg-card p-4 pr-0">
                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isTeamSaving}>
                      {i18n.t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>
                    <Button type="submit" disabled={isTeamSaving}>
                      {isTeamSaving ? <UiLoadingSpinner className="size-4" /> : <Save className="size-4" />}
                      {i18n.t("teamPage.teamInfo.saveChanges", { defaultValue: "Save Changes" })}
                    </Button>
                  </div>
                </div>
              </form>
            </TooltipProvider>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{i18n.t("teamPage.teamInfo.teamNameLabel", { defaultValue: "Team Name" })}</p>
                <div>{info.team_alias}</div>
              </div>
              <div>
                <p className="font-medium">{i18n.t("teamPage.teamInfo.teamIdLabel", { defaultValue: "Team ID" })}</p>
                <div className="font-mono">{info.team_id}</div>
              </div>
              <div>
                <p className="font-medium">{i18n.t("common.createdAt", { defaultValue: "Created At" })}</p>
                <div>{new Date(info.created_at).toLocaleString()}</div>
              </div>
              <div>
                <p className="font-medium">{i18n.t("teamPage.teamInfo.modelsLabel", { defaultValue: "Models" })}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {info.models.map((model, index) => (
                    <BadgeLink key={index} href={modelOrAccessGroupHref(model, accessGroupNames)}>
                      {model}
                    </BadgeLink>
                  ))}
                </div>
              </div>
              {info.default_team_member_models && info.default_team_member_models.length > 0 && (
                <div>
                  <p className="font-medium">{i18n.t("teamPage.teamInfo.defaultMemberModels", { defaultValue: "Default Member Models" })}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {info.default_team_member_models.map((model, index) => (
                      <BadgeLink key={index} href={modelOrAccessGroupHref(model, accessGroupNames)}>
                        {model}
                      </BadgeLink>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="font-medium">{i18n.t("teamPage.accordions.modelAliases", { defaultValue: "Model Aliases" })}</p>
                {(() => {
                  const aliasEntries = Object.entries(info.litellm_model_table?.model_aliases ?? {});
                  if (aliasEntries.length === 0) {
                    return <div className="text-muted-foreground">{i18n.t("teamPage.teamInfo.noModelAliases", { defaultValue: "No model aliases configured" })}</div>;
                  }
                  return (
                    <div className="mt-1 space-y-1">
                      {aliasEntries.map(([alias, target]) => (
                        <div key={alias} className="text-sm">
                          <span className="font-mono">{alias}</span>
                          <span className="text-muted-foreground">{" -> "}</span>
                          <span className="font-mono">{target}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div>
                <p className="font-medium">{i18n.t("teamPage.teamInfo.rateLimits", { defaultValue: "Rate Limits" })}</p>
                <div>TPM: {info.tpm_limit ?? i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" })}</div>
                <div>RPM: {info.rpm_limit ?? i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" })}</div>
                <div>TPD (batch): {info.tpd_limit ?? i18n.t("teamPage.teamInfo.unlimited", { defaultValue: "Unlimited" })}</div>
                {(() => {
                  const modelTpm = (info.metadata?.model_tpm_limit ?? {}) as Record<string, number>;
                  const modelRpm = (info.metadata?.model_rpm_limit ?? {}) as Record<string, number>;
                  const models = Array.from(new Set([...Object.keys(modelTpm), ...Object.keys(modelRpm)]));
                  if (models.length === 0) return null;
                  return (
                    <div className="mt-2">
                      <p className="text-muted-foreground">{i18n.t("teamPage.teamInfo.perModelLimits", { defaultValue: "Per-model limits:" })}</p>
                      {models.map((m) => (
                        <div key={m} className="text-xs ml-2">
                          {m}: TPM {modelTpm[m] ?? "—"}, RPM {modelRpm[m] ?? "—"}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div>Estimated Output Tokens: {info.metadata?.default_estimated_output_tokens ?? i18n.t("common.default", { defaultValue: "Default" })}</div>
                <div>
                  Estimated Output Tokens Per Model:{" "}
                  {info.metadata?.default_estimated_output_tokens_per_model
                    ? JSON.stringify(info.metadata.default_estimated_output_tokens_per_model)
                    : i18n.t("common.default", { defaultValue: "Default" })}
                </div>
              </div>
              <div>
                <p className="font-medium">{i18n.t("teamPage.teamInfo.teamBudgetLabel", { defaultValue: "Team Budget" })}</p>
                <div>
                  Max Budget: {info.max_budget !== null ? `¥${formatNumberWithCommas(info.max_budget, 4)}` : i18n.t("teamPage.teamInfo.noLimit", { defaultValue: "No Limit" })}
                </div>
                <div>
                  Soft Budget:{" "}
                  {info.soft_budget !== null && info.soft_budget !== undefined
                    ? `¥${formatNumberWithCommas(info.soft_budget, 4)}`
                    : i18n.t("teamPage.teamInfo.noLimit", { defaultValue: "No Limit" })}
                </div>
                <div>Budget Reset: {info.budget_duration || i18n.t("common.never", { defaultValue: "Never" })}</div>
                {modelMaxBudgetToEntries(info.model_max_budget as ModelMaxBudget | null | undefined).map(
                  ({ model, budgetLimit, timePeriod }) => {
                    const spent = model === null ? undefined : info.model_max_budget_usage?.[model]?.current_spend;
                    return (
                      <div key={model}>
                        Per-Model Budget ({model}): ¥{budgetLimit ?? "?"} per {timePeriod}
                        {spent !== undefined && `, spent ¥${spent}`}
                      </div>
                    );
                  },
                )}
                {info.metadata?.soft_budget_alerting_emails &&
                  Array.isArray(info.metadata.soft_budget_alerting_emails) &&
                  info.metadata.soft_budget_alerting_emails.length > 0 && (
                    <div>Soft Budget Alerting Emails: {info.metadata.soft_budget_alerting_emails.join(", ")}</div>
                  )}
              </div>
              <div>
                <p className="font-medium">
                  Team Member Settings{" "}
                  <SimpleTooltip content={i18n.t("teamPage.teamInfo.teamMemberSettingsTooltip", { defaultValue: "These are limits on individual team members" })}>
                    <Info className="ml-1 inline size-3.5 align-text-bottom" />
                  </SimpleTooltip>
                </p>
                <div>Max Budget: {info.team_member_budget_table?.max_budget ?? i18n.t("teamPage.teamInfo.noLimit", { defaultValue: "No Limit" })}</div>
                <div>Budget Duration: {info.team_member_budget_table?.budget_duration || i18n.t("teamPage.teamInfo.noLimit", { defaultValue: "No Limit" })}</div>
                <div>Key Duration: {info.metadata?.team_member_key_duration || i18n.t("teamPage.teamInfo.noLimit", { defaultValue: "No Limit" })}</div>
                <div>TPM Limit: {info.team_member_budget_table?.tpm_limit ?? i18n.t("teamPage.teamInfo.noLimit", { defaultValue: "No Limit" })}</div>
                <div>RPM Limit: {info.team_member_budget_table?.rpm_limit ?? i18n.t("teamPage.teamInfo.noLimit", { defaultValue: "No Limit" })}</div>
                <div>Budget Alert Thresholds: {teamMemberBudgetAlertSummary(info.metadata).join("; ") || "None"}</div>
              </div>
              <div>
                <p className="font-medium">{i18n.t("teamPage.teamInfo.routerSettingsLabel", { defaultValue: "Router Settings" })}</p>
                {info.router_settings &&
                Object.values(info.router_settings).some(
                  (v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0),
                ) ? (
                  <div className="mt-1 space-y-1">
                    {info.router_settings.routing_strategy && (
                      <div>
                        Routing Strategy: <Badge variant="secondary">{info.router_settings.routing_strategy}</Badge>
                      </div>
                    )}
                    {info.router_settings.num_retries != null && (
                      <div>Number of Retries: {info.router_settings.num_retries}</div>
                    )}
                    {info.router_settings.allowed_fails != null && (
                      <div>Allowed Failures: {info.router_settings.allowed_fails}</div>
                    )}
                    {info.router_settings.cooldown_time != null && (
                      <div>Cooldown Time: {info.router_settings.cooldown_time}s</div>
                    )}
                    {info.router_settings.timeout != null && <div>Timeout: {info.router_settings.timeout}s</div>}
                    {info.router_settings.retry_after != null && (
                      <div>Retry After: {info.router_settings.retry_after}s</div>
                    )}
                    {info.router_settings.fallbacks &&
                      Array.isArray(info.router_settings.fallbacks) &&
                      info.router_settings.fallbacks.length > 0 && (
                        <div>Fallbacks: {info.router_settings.fallbacks.length} configured</div>
                      )}
                    {info.router_settings.enable_tag_filtering && <div>{i18n.t("teamPage.teamInfo.tagFilteringEnabled", { defaultValue: "Tag Filtering: Enabled" })}</div>}
                  </div>
                ) : (
                  <div className="text-muted-foreground">{i18n.t("teamPage.teamInfo.noRouterSettings", { defaultValue: "No router settings configured" })}</div>
                )}
              </div>
              <div>
                <p className="font-medium">{i18n.t("teamPage.teamInfo.organizationIdLabel", { defaultValue: "Organization ID" })}</p>
                <div>{info.organization_id}</div>
              </div>
              <div>
                <p className="font-medium">{i18n.t("common.status", { defaultValue: "Status" })}</p>
                <Badge variant={info.blocked ? "destructive" : "secondary"}>
                  {info.blocked ? i18n.t("teamPage.teamInfo.blockedStatus", { defaultValue: "Blocked" }) : i18n.t("teamPage.teamInfo.activeStatus", { defaultValue: "Active" })}
                </Badge>
              </div>

              <ObjectPermissionsView
                objectPermission={info.object_permission}
                inheritedMcpServers={inheritedMcpServers}
                inheritedAgents={inheritedAgents}
                variant="inline"
                className="pt-4 border-t border-border"
                accessToken={accessToken}
              />

              <GuardrailSettingsView
                globalGuardrailNames={globalGuardrailNames}
                teamGuardrails={Array.isArray(info.metadata?.guardrails) ? info.metadata.guardrails : []}
                optedOutGlobalGuardrails={
                  Array.isArray(info.metadata?.opted_out_global_guardrails)
                    ? info.metadata.opted_out_global_guardrails
                    : []
                }
                killSwitchOn={initialKillSwitchOn}
                variant="inline"
                className="pt-4 border-t border-border"
              />

              <LoggingSettingsView
                loggingConfigs={info.metadata?.logging || []}
                disabledCallbacks={[]}
                variant="inline"
                className="pt-4 border-t border-border"
              />

              {info.metadata?.secret_manager_settings && (
                <div className="pt-4 border-t border-border">
                  <p className="font-medium">{i18n.t("teamPage.teamInfo.secretManagerSettingsLabel", { defaultValue: "Secret Manager Settings" })}</p>
                  <pre className="mt-2 bg-muted p-3 rounded-sm text-xs overflow-x-auto">
                    {JSON.stringify(info.metadata.secret_manager_settings, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card>
      ),
    },
  ].filter((tab) => visibleTabs.includes(tab.key));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="ghost" onClick={onClose} className="mb-4">
            <ArrowLeftIcon className="h-4 w-4" />
            {i18n.t("teamPage.teamInfo.backToTeams", { defaultValue: "Back to Teams" })}
          </Button>
          <h1 className="text-2xl font-semibold">{info.team_alias}</h1>
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground font-mono">{info.team_id}</p>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => copyToClipboard(info.team_id, "team-id")}
              className={`left-2 z-raised transition-all duration-200 ${
                copiedStates["team-id"]
                  ? "text-success bg-success/10 border-success/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {copiedStates["team-id"] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTabKey} className="mb-4" onValueChange={onTabChange}>
        <TabsList variant="line" className="mb-4 h-auto w-full justify-start rounded-none border-b p-0">
          {tabItems.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="flex-none rounded-none px-4 py-2">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabItems.map(({ key, children }) => (
          <TabsContent key={key} value={key} keepMounted={hasVisited(key)}>
            {children}
          </TabsContent>
        ))}
      </Tabs>

      <MemberModal
        visible={isEditMemberModalVisible}
        onCancel={() => setIsEditMemberModalVisible(false)}
        onSubmit={handleMemberUpdate}
        initialData={selectedEditMember}
        mode="edit"
        config={{
          title: i18n.t("teamPage.teamInfo.editMemberTitle", { defaultValue: "Edit Member" }),
          showEmail: true,
          showUserId: true,
          roleOptions: [
            { label: i18n.t("teamPage.teamInfo.adminRole", { defaultValue: "Admin" }), value: "admin" },
            { label: i18n.t("teamPage.teamInfo.userRole", { defaultValue: "User" }), value: "user" },
          ],
          additionalFields: [
            {
              name: "max_budget_in_team",
              label: (
                <span>
                  Team Member Budget (CNY){" "}
                  <SimpleTooltip content={i18n.t("teamPage.teamInfo.teamMemberBudgetTooltip", { defaultValue: "Maximum amount in CNY this member can spend within this team. This is separate from any global user budget limits" })}>
                    <Info className="ml-1 inline size-3.5 align-text-bottom" />
                  </SimpleTooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 0.01,
              min: 0,
              placeholder: i18n.t("teamPage.teamInfo.teamMemberBudgetPlaceholder", { defaultValue: "Budget limit for this member within this team" }),
            },
            {
              name: "budget_duration",
              label: (
                <span>
                  Budget Reset Period{" "}
                  <SimpleTooltip content={i18n.t("teamPage.teamInfo.budgetResetPeriodTooltip", { defaultValue: "How often this member's budget resets within the team. Leave unset and the budget never resets." })}>
                    <Info className="ml-1 inline size-3.5 align-text-bottom" />
                  </SimpleTooltip>
                </span>
              ),
              type: "budget-duration" as const,
            },
            {
              name: "temp_budget_increase",
              label: (
                <span>
                  Temporary Budget Increase (CNY){" "}
                  <SimpleTooltip content="Extra CNY added on top of the team member budget until the expiry below. The permanent budget is left unchanged and the increase stops applying at expiry.">
                    <Info className="ml-1 inline size-3.5 align-text-bottom" />
                  </SimpleTooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 0.01,
              min: 0,
              placeholder: "Extra budget for this member until the expiry",
            },
            {
              name: "temp_budget_expiry",
              label: (
                <span>
                  Temporary Budget Expiry (UTC){" "}
                  <SimpleTooltip content="When the temporary budget increase stops applying. Required whenever a temporary budget increase is set.">
                    <Info className="ml-1 inline size-3.5 align-text-bottom" />
                  </SimpleTooltip>
                </span>
              ),
              type: "utc-datetime" as const,
            },
            {
              name: "tpm_limit",
              label: (
                <span>
                  Team Member TPM Limit{" "}
                  <SimpleTooltip content={i18n.t("teamPage.teamInfo.teamMemberTpmTooltip", { defaultValue: "Maximum tokens per minute this member can use within this team. This is separate from any global user TPM limit" })}>
                    <Info className="ml-1 inline size-3.5 align-text-bottom" />
                  </SimpleTooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 1,
              min: 0,
              placeholder: i18n.t("teamPage.teamInfo.teamMemberTpmPlaceholder", { defaultValue: "Tokens per minute limit for this member in this team" }),
            },
            {
              name: "rpm_limit",
              label: (
                <span>
                  Team Member RPM Limit{" "}
                  <SimpleTooltip content={i18n.t("teamPage.teamInfo.teamMemberRpmTooltip", { defaultValue: "Maximum requests per minute this member can make within this team. This is separate from any global user RPM limit" })}>
                    <Info className="ml-1 inline size-3.5 align-text-bottom" />
                  </SimpleTooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 1,
              min: 0,
              placeholder: i18n.t("teamPage.teamInfo.teamMemberRpmPlaceholder", { defaultValue: "Requests per minute limit for this member in this team" }),
            },
            {
              name: "allowed_models",
              label: (
                <span>
                  Allowed Models{" "}
                  <SimpleTooltip content={i18n.t("teamPage.teamInfo.allowedModelsTooltip", { defaultValue: "Models this member can access within this team. Leave empty to inherit all team models." })}>
                    <Info className="ml-1 inline size-3.5 align-text-bottom" />
                  </SimpleTooltip>
                </span>
              ),
              type: "multi-select" as const,
              options: (info.models || []).map((m: string) => ({ label: m, value: m })),
              placeholder: i18n.t("teamPage.teamInfo.allowedModelsPlaceholder", { defaultValue: "Leave empty to inherit all team models" }),
            },
          ],
        }}
      />

      <UserSearchModal
        isVisible={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onSubmit={handleMemberCreate}
        accessToken={accessToken}
        teamId={teamId}
      />

      {/* Delete Member Confirmation Modal */}
      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={i18n.t("teamPage.teamInfo.deleteMemberTitle", { defaultValue: "Delete Team Member" })}
        alertMessage={i18n.t("teamPage.teamInfo.deleteMemberAlert", { defaultValue: "Removing team members will also delete any keys created by or created for this member." })}
        message={i18n.t("teamPage.teamInfo.deleteMemberMessage", { defaultValue: "Are you sure you want to remove this member from the team? This action cannot be undone." })}
        resourceInformationTitle={i18n.t("teamPage.teamInfo.deleteMemberInfoTitle", { defaultValue: "Team Member Information" })}
        resourceInformation={[
          { label: i18n.t("teamPage.teamInfo.userIdLabel", { defaultValue: "User ID" }), value: memberToDelete?.user_id, code: true },
          { label: i18n.t("teamPage.teamInfo.emailLabel", { defaultValue: "Email" }), value: memberToDelete?.user_email },
          { label: i18n.t("teamPage.teamInfo.roleLabel", { defaultValue: "Role" }), value: memberToDelete?.role },
        ]}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteConfirm}
        confirmLoading={isDeleting}
      />

      <ResetMemberBudgetsDialog
        state={memberBudgetReset.state}
        onReset={memberBudgetReset.reset}
        onRetry={memberBudgetReset.retry}
        onKeep={memberBudgetReset.keepCustom}
        onDismiss={memberBudgetReset.dismiss}
      />
    </div>
  );
};

export default TeamInfoView;
