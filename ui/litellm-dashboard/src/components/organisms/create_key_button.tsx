"use client";
import { keyKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { useProjects } from "@/app/(dashboard)/hooks/projects/useProjects";
import { useTags } from "@/app/(dashboard)/hooks/tags/useTags";
import { useUISettings } from "@/app/(dashboard)/hooks/uiSettings/useUISettings";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useCan from "@/app/(dashboard)/hooks/useCan";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { MultiSelect, type MultiSelectOption } from "@/components/shared/MultiSelect";
import { PaginatedSearchSelect } from "@/components/shared/PaginatedSearchSelect";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import { TagsInput } from "@/app/(dashboard)/guardrails/_components/content_filter/TagsInput";
import { ChevronDown, Info } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { type Control, useForm, useWatch, type UseFormSetValue } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { rolesWithWriteAccess } from "../../utils/roles";
import AgentSelector from "../agent_management/AgentSelector";
import SkillSelector from "../skills/SkillSelector";
import AccessGroupSelector from "../common_components/AccessGroupSelector";
import BudgetDurationDropdown from "../common_components/budget_duration_dropdown";
import SchemaFormFields from "../common_components/check_openapi_schema";
import KeyLifecycleSettings from "../common_components/KeyLifecycleSettings";
import ModelAliasManager from "../common_components/ModelAliasManager";
import {
  MountedFormField,
  MountedFormProvider,
  projectMountedValues,
  useMountRegistry,
  type MountedFormValues,
} from "../common_components/MountedFormField";
import PassThroughRoutesSelector from "../common_components/PassThroughRoutesSelector";
import PremiumLoggingSettings from "../common_components/PremiumLoggingSettings";
import RateLimitTypeFormItem from "../common_components/RateLimitTypeFormItem";
import RouterSettingsAccordion, {
  RouterSettingsAccordionRef,
  RouterSettingsAccordionValue,
} from "../common_components/RouterSettingsAccordion";
import TeamDropdown from "../common_components/team_dropdown";
import OrganizationDropdown from "../common_components/OrganizationDropdown";
import ProjectDropdown from "../common_components/ProjectDropdown";
import { CreateUserButton } from "../CreateUserButton";
import { BudgetFallbacksEditor } from "../key_team_helpers/BudgetFallbacksEditor";
import { BudgetWindowEntry, BudgetWindowsEditor } from "../key_team_helpers/BudgetWindowsEditor";
import { ModelMaxBudget, ModelMaxBudgetEditor } from "../key_team_helpers/ModelMaxBudgetEditor";
import { TagRateLimitEditor, TagRateLimitEntry } from "../key_team_helpers/TagRateLimitEditor";
import {
  excludeProxyWideSentinel,
  getModelDisplayName,
  hasAllModelsSentinel,
} from "../key_team_helpers/fetch_available_models_team_key";
import { Team } from "../key_team_helpers/key_list";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "../mcp_server_management/MCPToolPermissions";
import { toast } from "@/lib/toast";
import {
  getAgentsList,
  getGuardrailsList,
  getPoliciesList,
  getPossibleUserRoles,
  getPromptsList,
  keyCreateCall,
  keyCreateServiceAccountCall,
  modelAvailableCall,
  proxyBaseUrl,
  userFilterUICall,
} from "../networking";
import CreatedKeyDisplay from "../shared/CreatedKeyDisplay";
import NumericalInput from "../shared/numerical_input";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";
import { buildKeyCreatePayload, type KeyCreateInput } from "./createKeyPayload";
import { simplifyKeyGenerateError } from "./utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const KEY_TYPE_OPTIONS = [
  {
    value: "llm_api",
    labelKey: "organisms.createKeyButton.keyTypeAiApis",
    label: "AI APIs",
    hintKey: "organisms.createKeyButton.keyTypeAiApisDescription",
    hint: "Can call only AI API routes (chat/completions, embeddings, etc.)",
  },
  {
    value: "management",
    labelKey: "organisms.createKeyButton.keyTypeManagement",
    label: "Management",
    hintKey: "organisms.createKeyButton.keyTypeManagementDescription",
    hint: "Can call only management routes (user/team/key management)",
  },
  {
    value: "default",
    labelKey: "organisms.createKeyButton.keyTypeFullAccess",
    label: "Full Access",
    hintKey: "organisms.createKeyButton.keyTypeFullAccessDescription",
    hint: "Can call all routes (AI APIs, Management, and read-only)",
  },
];

const KEY_OWNER_LABEL_CLASS = "flex items-center gap-2 text-sm font-normal text-foreground";

const SECTION_HEADER_CLASS = "group/section flex w-full items-center justify-between px-4 py-3 text-left";
const SECTION_CHEVRON_CLASS =
  "size-5 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/section:rotate-180";

type FieldWrite = (value: unknown) => void;

type McpSelectorValue = { servers: string[]; accessGroups: string[]; toolsets?: string[] };

type AgentSelectorValue = { agents: string[]; accessGroups: string[] };

const isBlank = (value: unknown): boolean => value === undefined || value === null || value === "";

const requiredRule = (required: boolean, message: string) => ({
  validate: (value: unknown) => (required && isBlank(value) ? message : true),
});

const ceilingRule = (ceiling: number | null | undefined, message: (limit: number) => string) => ({
  validate: (value: unknown) =>
    value && ceiling !== null && ceiling !== undefined && (value as number) > ceiling ? message(ceiling) : true,
});

interface McpToolPermissionsFieldProps {
  readonly accessToken: string;
  readonly control: Control<MountedFormValues>;
  readonly setValue: UseFormSetValue<MountedFormValues>;
}

const McpToolPermissionsField: React.FC<McpToolPermissionsFieldProps> = ({ accessToken, control, setValue }) => {
  const selection = useWatch({ control, name: "allowed_mcp_servers_and_groups" }) as
    | { servers?: string[]; accessGroups?: string[]; toolsets?: string[] }
    | undefined;
  const toolPermissions = useWatch({ control, name: "mcp_tool_permissions" }) as Record<string, string[]> | undefined;

  return (
    <div className="mt-6">
      <MCPToolPermissions
        accessToken={accessToken}
        selectedServers={selection?.servers || []}
        selectedAccessGroups={selection?.accessGroups || []}
        selectedToolsets={selection?.toolsets || []}
        toolPermissions={toolPermissions || {}}
        onChange={(toolPerms) => setValue("mcp_tool_permissions", toolPerms)}
      />
    </div>
  );
};

/**
 * Interface for pre-filling the create key form from URL parameters
 */
export interface CreateKeyPrefillData {
  owned_by?: "you" | "service_account" | "another_user";
  team_id?: string;
  key_alias?: string;
  models?: string[];
  key_type?: "default" | "llm_api" | "management";
}

interface CreateKeyProps {
  team: Team | null;
  data: any[] | null;
  teams: Team[] | null;
  addKey: (data: any) => void;
  autoOpenCreate?: boolean;
  prefillData?: CreateKeyPrefillData;
}

interface User {
  user_id: string;
  user_email: string;
  role?: string;
}

export const fetchTeamModels = async (
  userID: string,
  userRole: string,
  accessToken: string,
  teamID: string | null,
): Promise<string[]> => {
  try {
    if (userID === null || userRole === null) {
      return [];
    }

    if (accessToken !== null) {
      const model_available = await modelAvailableCall(accessToken, userID, userRole, true, teamID, true);
      let available_model_names = model_available["data"].map((element: { id: string }) => element.id);
      return available_model_names;
    }
    return [];
  } catch (error) {
    console.error("Error fetching user models:", error);
    return [];
  }
};

export const fetchUserModels = async (
  userID: string,
  userRole: string,
  accessToken: string,
  setUserModels: (models: string[]) => void,
) => {
  try {
    if (userID === null || userRole === null) {
      return;
    }

    if (accessToken !== null) {
      const model_available = await modelAvailableCall(accessToken, userID, userRole);
      let available_model_names = model_available["data"].map((element: { id: string }) => element.id);
      setUserModels(available_model_names);
    }
  } catch (error) {
    console.error("Error fetching user models:", error);
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────
 * @deprecated
 * This component is being DEPRECATED in favor of src/app/(dashboard)/virtual-keys/components/CreateKey.tsx
 * Please contribute to the new refactor.
 * ─────────────────────────────────────────────────────────────────────────
 */
const CreateKey: React.FC<CreateKeyProps> = ({ team, teams, data, addKey, autoOpenCreate, prefillData }) => {
  const { t } = useTranslation();
  const { accessToken, userId: userID, userRole, premiumUser } = useAuthorized();
  const keyTypeOptions = KEY_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: t(option.labelKey, { defaultValue: option.label }),
    hint: t(option.hintKey, { defaultValue: option.hint }),
  }));
  const canEditGuardrails = premiumUser || (userRole != null && rolesWithWriteAccess.includes(userRole));
  const canViewPolicies = useCan("viewPolicies");
  const canViewPrompts = useCan("viewPrompts");
  const { data: organizations, isLoading: isOrganizationsLoading } = useOrganizations();
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const { data: uiSettingsData } = useUISettings();
  const { data: tagsData } = useTags();
  const enableProjectsUI = Boolean(uiSettingsData?.values?.enable_projects_ui);
  const disableCustomApiKeys = Boolean(uiSettingsData?.values?.disable_custom_api_keys);
  const tagOptions = tagsData ? Object.values(tagsData).map((tag) => ({ value: tag.name, label: tag.name })) : [];
  const queryClient = useQueryClient();
  const [formDefaults] = useState<MountedFormValues>(() => ({
    team_id: team ? team.team_id : null,
    key_type: "llm_api",
    tpm_limit_type: null,
    rpm_limit_type: null,
    mcp_tool_permissions: {},
    duration: "",
  }));
  const form = useForm<MountedFormValues>({
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: formDefaults,
  });
  const registry = useMountRegistry();
  const mountedForm = useMemo(() => ({ control: form.control, registry }), [form.control, registry]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [modelsToPick, setModelsToPick] = useState<string[]>([]);
  const [keyOwner, setKeyOwner] = useState("you");
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [pendingPrefillModels, setPendingPrefillModels] = useState<string[] | null>(null);
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [promptsList, setPromptsList] = useState<string[]>([]);
  const [loggingSettings, setLoggingSettings] = useState<any[]>([]);
  const [selectedCreateKeyTeam, setSelectedCreateKeyTeam] = useState<Team | null>(team);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateUserModalVisible, setIsCreateUserModalVisible] = useState(false);
  const [possibleUIRoles, setPossibleUIRoles] = useState<Record<string, Record<string, string>>>({});
  const [userOptions, setUserOptions] = useState<SearchSelectOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState<boolean>(false);
  const latestUserSearchRef = useRef(0);
  const [disabledCallbacks, setDisabledCallbacks] = useState<string[]>([]);
  const [keyType, setKeyType] = useState<string>("llm_api");
  const [modelAliases, setModelAliases] = useState<{ [key: string]: string }>({});
  const [autoRotationEnabled, setAutoRotationEnabled] = useState<boolean>(false);
  const [rotationInterval, setRotationInterval] = useState<string>("30d");
  const [routerSettings, setRouterSettings] = useState<RouterSettingsAccordionValue | null>(null);
  const routerSettingsRef = useRef<RouterSettingsAccordionRef>(null);
  const [budgetLimits, setBudgetLimits] = useState<BudgetWindowEntry[]>([]);
  const [modelMaxBudget, setModelMaxBudget] = useState<ModelMaxBudget>({});
  const [tagRateLimits, setTagRateLimits] = useState<TagRateLimitEntry[]>([]);
  const [budgetFallbacks, setBudgetFallbacks] = useState<Record<string, string[]>>({});
  const [budgetFallbacksKey, setBudgetFallbacksKey] = useState<number>(0);
  const [routerSettingsKey, setRouterSettingsKey] = useState<number>(0);
  const [agentsList, setAgentsList] = useState<{ agent_id: string; agent_name: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedModels: string[] = (useWatch({ control: form.control, name: "models" }) as string[] | undefined) ?? [];
  const handleCancel = () => {
    setIsModalVisible(false);
    setApiKey(null);
    setSelectedCreateKeyTeam(null);
    form.reset(formDefaults);
    setLoggingSettings([]);
    setDisabledCallbacks([]);
    setKeyType("llm_api");
    setModelAliases({});
    setAutoRotationEnabled(false);
    setRotationInterval("30d");
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
    setSelectedAgentId(null);
    setSelectedOrganizationId(null);
    setSelectedProjectId(null);
    setBudgetLimits([]);
    setTagRateLimits([]);
    setBudgetFallbacks({});
    setBudgetFallbacksKey((k) => k + 1);
  };

  useEffect(() => {
    if (userID && userRole && accessToken) {
      fetchUserModels(userID, userRole, accessToken, setUserModels);
    }
  }, [accessToken, userID, userRole]);

  useEffect(() => {
    if (accessToken) {
      getAgentsList(accessToken)
        .then((res) => setAgentsList(res?.agents || []))
        .catch(() => setAgentsList([]));
    }
  }, [accessToken]);

  useEffect(() => {
    const fetchGuardrails = async () => {
      try {
        const response = await getGuardrailsList(accessToken);
        const guardrailNames = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(guardrailNames);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    const fetchPolicies = async () => {
      try {
        const response = await getPoliciesList(accessToken);
        const policyNames = response.policies.map((p: { policy_name: string }) => p.policy_name);
        setPoliciesList(policyNames);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      }
    };

    const fetchPrompts = async () => {
      try {
        const response = await getPromptsList(accessToken);
        setPromptsList(Array.from(new Set(response.prompts.map((prompt) => prompt.prompt_id))));
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      }
    };

    fetchGuardrails();
    if (canViewPolicies) fetchPolicies();
    if (canViewPrompts) fetchPrompts();
  }, [accessToken, canViewPolicies, canViewPrompts]);

  // Fetch possible user roles when component mounts
  useEffect(() => {
    const fetchPossibleRoles = async () => {
      try {
        if (accessToken) {
          // Check if roles are cached in session storage
          const cachedRoles = sessionStorage.getItem("possibleUserRoles");
          if (cachedRoles) {
            setPossibleUIRoles(JSON.parse(cachedRoles));
          } else {
            const availableUserRoles = await getPossibleUserRoles(accessToken);
            sessionStorage.setItem("possibleUserRoles", JSON.stringify(availableUserRoles));
            setPossibleUIRoles(availableUserRoles);
          }
        }
      } catch (error) {
        console.error("Error fetching possible user roles:", error);
      }
    };

    fetchPossibleRoles();
  }, [accessToken]);

  // Auto-open modal and prefill form from URL params (deep link).
  // Guarded by write access so we don't open for read-only users.
  useEffect(() => {
    if (autoOpenCreate && !hasPrefilled && teams && userRole && rolesWithWriteAccess.includes(userRole)) {
      // Open the modal
      setIsModalVisible(true);
      setHasPrefilled(true);

      // Apply prefill data if provided
      if (prefillData) {
        // Set key owner (owned_by) - validate that "another_user" is only allowed for Admin
        if (prefillData.owned_by) {
          if (prefillData.owned_by === "another_user" && userRole !== "Admin") {
            // Ignore invalid owned_by for non-admin users, fall back to default
            setKeyOwner("you");
          } else {
            setKeyOwner(prefillData.owned_by);
          }
        }

        // Set team - find the team by ID and set it (only if team exists in user's teams)
        if (prefillData.team_id) {
          const selectedTeam = teams?.find((t) => t.team_id === prefillData.team_id) || null;
          if (selectedTeam) {
            setSelectedCreateKeyTeam(selectedTeam);
            form.setValue("team_id", prefillData.team_id);
          }
          // Silently ignore invalid team_id - don't prefill with a team user doesn't have access to
        }

        // Set key alias
        if (prefillData.key_alias) {
          form.setValue("key_alias", prefillData.key_alias);
        }

        // Defer model selection until we load the allowed model list.
        if (prefillData.models && prefillData.models.length > 0) {
          setPendingPrefillModels(prefillData.models);
        }

        // Set key type
        if (prefillData.key_type) {
          setKeyType(prefillData.key_type);
          form.setValue("key_type", prefillData.key_type);
        }
      }
    }
  }, [autoOpenCreate, prefillData, teams, hasPrefilled, form, userRole]);

  // Check if team selection is required
  const isTeamSelectionRequired = modelsToPick.includes("no-default-models");
  const isFormDisabled = isTeamSelectionRequired && !selectedCreateKeyTeam;

  const handleCreate = async (formValues: MountedFormValues) => {
    try {
      const input: KeyCreateInput = {
        formValues,
        existingKeys: data,
        keyOwner,
        userID,
        selectedAgentId,
        loggingSettings,
        disabledCallbacks,
        autoRotationEnabled,
        rotationInterval,
        modelAliases,
        routerSettings: routerSettingsRef.current?.getValue() ?? routerSettings,
        budgetLimits,
        modelMaxBudget,
        tagRateLimits,
        budgetFallbacks,
      };
      const built = buildKeyCreatePayload(input);
      if (built.kind === "duplicate_alias") {
        throw new Error(
          t("organisms.createKeyButton.duplicateKeyAliasError", {
            defaultValue:
              "Key alias {{alias}} already exists for team with ID {{teamId}}, please provide another key alias",
            alias: built.alias,
            teamId: built.teamId,
          }),
        );
      }

      toast.info(t("organisms.createKeyButton.notificationMakingApiCall", { defaultValue: "Making API Call" }));
      setIsModalVisible(true);

      if (built.kind === "agent_not_selected") {
        toast.fromError(
          t("organisms.createKeyButton.notificationPleaseSelectAgent", { defaultValue: "Please select an agent" }),
        );
        return;
      }
      const { payload, endpoint } = built;

      const response =
        endpoint === "service_account"
          ? await keyCreateServiceAccountCall(accessToken, payload)
          : await keyCreateCall(accessToken, userID, payload);

      // Add the data to the state in the parent component
      // Also directly update the keys list in VirtualKeysTable without an API call
      addKey(response);

      // Invalidate and refetch all keys list queries to update the table
      // This will trigger a refetch of all key list queries regardless of pagination
      queryClient.invalidateQueries({ queryKey: keyKeys.lists() });

      setApiKey(response["key"]);
      toast.success(
        t("organisms.createKeyButton.notificationVirtualKeyCreated", { defaultValue: "Virtual Key Created" }),
      );
      form.reset(formDefaults);
      setBudgetLimits([]);
      setTagRateLimits([]);
      setBudgetFallbacks({});
      setBudgetFallbacksKey((k) => k + 1);
      localStorage.removeItem("userData" + userID);
    } catch (error) {
      const simplifiedError = simplifyKeyGenerateError(error);
      toast.fromError(simplifiedError);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) =>
    void form.handleSubmit(() => handleCreate(projectMountedValues(registry, form.getValues)))(event);

  // Fetch available models when team or auth changes.
  // Note: Model prefill from URL params is handled by the useEffect below, which
  // watches for pendingPrefillModels + modelsToPick to both be populated.
  useEffect(() => {
    if (selectedProjectId) {
      // When a project is selected, use the project's models
      const project = projects?.find((p) => p.project_id === selectedProjectId);
      const projectModels = project?.models ?? [];
      setModelsToPick(projectModels);
      form.setValue("models", []);
      return;
    }
    if (userID && userRole && accessToken) {
      fetchTeamModels(userID, userRole, accessToken, selectedCreateKeyTeam?.team_id ?? null).then((models) => {
        const allModels = excludeProxyWideSentinel(
          Array.from(new Set([...(selectedCreateKeyTeam?.models ?? []), ...models])),
        );
        setModelsToPick(allModels);
      });
    }
    // Only clear models if we don't have pending prefill models
    if (!pendingPrefillModels) {
      form.setValue("models", []);
    }
    // Clear MCP server selection when team changes (available servers may differ)
    form.setValue("allowed_mcp_servers_and_groups", { servers: [], accessGroups: [] });
  }, [selectedCreateKeyTeam, selectedProjectId, accessToken, userID, userRole, form]);

  // Apply deferred model prefill once the available model list arrives.
  // This handles timing where prefill data arrives before or after models are fetched.
  useEffect(() => {
    if (!pendingPrefillModels || pendingPrefillModels.length === 0) {
      return;
    }
    if (!modelsToPick || modelsToPick.length === 0) {
      return;
    }

    const validModels = pendingPrefillModels.filter((model) => modelsToPick.includes(model));
    if (validModels.length > 0) {
      form.setValue("models", validModels);
    }
    setPendingPrefillModels(null);
  }, [pendingPrefillModels, modelsToPick, form]);

  // Sync team when project is selected but teams loaded later (race condition)
  useEffect(() => {
    if (!selectedProjectId || !teams) return;
    const project = projects?.find((p) => p.project_id === selectedProjectId);
    if (!project?.team_id) return;
    // If team is already set correctly, skip
    if (selectedCreateKeyTeam?.team_id === project.team_id) return;
    const projectTeam = teams.find((t) => t.team_id === project.team_id) || null;
    if (projectTeam) {
      setSelectedCreateKeyTeam(projectTeam);
      form.setValue("team_id", projectTeam.team_id);
    }
  }, [teams, selectedProjectId, projects]);

  // Add a callback function to handle user creation
  const handleUserCreated = (userId: string) => {
    form.setValue("user_id", userId);
    setIsCreateUserModalVisible(false);
  };

  const fetchUsers = async (searchText: string): Promise<void> => {
    const searchId = latestUserSearchRef.current + 1;
    latestUserSearchRef.current = searchId;
    const isLatestSearch = (): boolean => searchId === latestUserSearchRef.current;

    if (!searchText) {
      setUserOptions([]);
      setUserSearchLoading(false);
      return;
    }

    setUserSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("user_email", searchText); // Always search by email
      if (accessToken == null) {
        return;
      }
      const response = await userFilterUICall(accessToken, params);
      if (!isLatestSearch()) return;

      const data: User[] = response;
      const options: SearchSelectOption[] = data.map((user) => ({
        label: `${user.user_email} (${user.user_id})`,
        value: user.user_id,
      }));

      setUserOptions(options);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (isLatestSearch())
        toast.fromError(
          t("organisms.createKeyButton.notificationFailedToSearchUsers", {
            defaultValue: "Failed to search for users",
          }),
        );
    } finally {
      if (isLatestSearch()) setUserSearchLoading(false);
    }
  };

  const changeOrganization = (write: FieldWrite) => (orgId: string | null) => {
    write(orgId);
    setSelectedOrganizationId(orgId);
    // Clear team and project when org changes
    setSelectedCreateKeyTeam(null);
    setSelectedProjectId(null);
    form.setValue("team_id", null);
    form.setValue("project_id", null);
  };

  const selectTeam = (team: Team | null) => {
    setSelectedCreateKeyTeam(team);
    setSelectedProjectId(null);
    form.setValue("project_id", null);
    // Auto-populate org from team for non-admin users
    if (team?.organization_id) {
      setSelectedOrganizationId(team.organization_id);
      form.setValue("organization_id", team.organization_id);
    } else if (!team) {
      setSelectedOrganizationId(null);
      form.setValue("organization_id", null);
    }
  };

  const changeProject = (write: FieldWrite) => (projectId: string | null) => {
    write(projectId);
    if (!projectId) {
      setSelectedProjectId(null);
      setSelectedCreateKeyTeam(null);
      form.setValue("team_id", null);
      return;
    }
    setSelectedProjectId(projectId);
  };

  const modelOptions: MultiSelectOption[] = [
    ...(selectedProjectId === null && selectedCreateKeyTeam
      ? [
          {
            value: "all-team-models",
            label: t("organisms.createKeyButton.modelsAllTeam", { defaultValue: "All Team Models" }),
          },
        ]
      : []),
    ...(selectedProjectId === null && !selectedCreateKeyTeam
      ? [
          {
            value: "all-proxy-models",
            label: t("organisms.createKeyButton.modelsAllProxy", { defaultValue: "All Proxy Models" }),
          },
        ]
      : []),
    ...modelsToPick.map((model) => ({
      value: model,
      label: getModelDisplayName(model),
      disabled: hasAllModelsSentinel(selectedModels),
    })),
  ];

  const changeKeyType = (write: FieldWrite) => (value: string) => {
    write(value);
    setKeyType(value);
    // Clear models field and disable if management or read_only
    if (value === "management" || value === "read_only") {
      form.setValue("models", []);
    }
  };

  return (
    <div>
      {userRole && rolesWithWriteAccess.includes(userRole) && (
        <Button className="mx-auto" onClick={() => setIsModalVisible(true)} data-testid="create-key-button">
          {t("organisms.createKeyButton.createNewKey", { defaultValue: "+ Create New Key" })}
        </Button>
      )}
      <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              {t("organisms.createKeyButton.createNewKeyTitle", { defaultValue: "Create New Key" })}
            </DialogTitle>
          </DialogHeader>
          <MountedFormProvider value={mountedForm}>
            <form onSubmit={handleSubmit}>
              {/* Section 1: Key Ownership */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  {t("organisms.createKeyButton.sectionKeyOwnership", { defaultValue: "Key Ownership" })}
                </h3>
                <Field className="mb-4">
                  <FieldLabel>
                    <span>
                      {t("organisms.createKeyButton.ownedByLabel", { defaultValue: "Owned By" })}{" "}
                      <SimpleTooltip
                        content={t("organisms.createKeyButton.ownedByTooltip", {
                          defaultValue: "Select who will own this Virtual Key",
                        })}
                      >
                        <Info className="ml-1 inline size-3.5 align-text-bottom" />
                      </SimpleTooltip>
                    </span>
                  </FieldLabel>
                  <RadioGroup
                    className="flex flex-wrap items-center gap-4"
                    value={keyOwner}
                    onValueChange={(value: unknown) => setKeyOwner(String(value))}
                  >
                    <label className={KEY_OWNER_LABEL_CLASS}>
                      <RadioGroupItem value="you" />
                      {t("organisms.createKeyButton.ownerYou", { defaultValue: "You" })}
                    </label>
                    <label className={KEY_OWNER_LABEL_CLASS}>
                      <RadioGroupItem value="service_account" />
                      {t("organisms.createKeyButton.ownerServiceAccount", { defaultValue: "Service Account" })}
                    </label>
                    {userRole === "Admin" && (
                      <label className={KEY_OWNER_LABEL_CLASS}>
                        <RadioGroupItem value="another_user" />
                        {t("organisms.createKeyButton.ownerAnotherUser", { defaultValue: "Another User" })}
                      </label>
                    )}
                    <label className={KEY_OWNER_LABEL_CLASS}>
                      <RadioGroupItem value="agent" />
                      {t("organisms.createKeyButton.ownerAgent", { defaultValue: "Agent" })}{" "}
                      <Badge>{t("organisms.createKeyButton.ownerAgentNew", { defaultValue: "New" })}</Badge>
                    </label>
                  </RadioGroup>
                </Field>

                {keyOwner === "another_user" && (
                  <MountedFormField
                    label={
                      <span>
                        {t("organisms.createKeyButton.userIdLabel", { defaultValue: "User ID" })}{" "}
                        <SimpleTooltip
                          content={t("organisms.createKeyButton.userIdTooltip", {
                            defaultValue: "The user who will own this key and be responsible for its usage",
                          })}
                        >
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="user_id"
                    className="mt-4"
                    required
                    rules={requiredRule(
                      keyOwner === "another_user",
                      t("organisms.createKeyButton.userIdRuleMessage", {
                        defaultValue: "Please input the user ID of the user you are assigning the key to",
                      }),
                    )}
                  >
                    {(control) => (
                      <div>
                        <div className="mb-2 flex">
                          <PaginatedSearchSelect
                            options={userOptions}
                            value={typeof control.value === "string" ? control.value : undefined}
                            onValueChange={control.onChange}
                            onSearchChange={fetchUsers}
                            isLoading={userSearchLoading}
                            placeholder={t("organisms.createKeyButton.userSearchPlaceholder", {
                              defaultValue: "Type email to search for users",
                            })}
                            emptyText={t("organisms.createKeyButton.userNotFound", { defaultValue: "No users found" })}
                            loadingText={t("organisms.createKeyButton.userSearching", { defaultValue: "Searching..." })}
                            inputId={control.id}
                            aria-required={control["aria-required"] === "true" ? true : undefined}
                            aria-invalid={control["aria-invalid"] === "true" ? true : undefined}
                            aria-describedby={control["aria-describedby"]}
                          />
                          <Button variant="outline" className="ml-2" onClick={() => setIsCreateUserModalVisible(true)}>
                            {t("organisms.createKeyButton.createUserButton", { defaultValue: "Create User" })}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("organisms.createKeyButton.searchByEmailHint", {
                            defaultValue: "Search by email to find users",
                          })}
                        </div>
                      </div>
                    )}
                  </MountedFormField>
                )}
                {keyOwner === "agent" && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md dark:bg-purple-950 dark:border-purple-800">
                    <div className="mb-3">
                      <label htmlFor="create-key-agent" className="text-sm font-medium text-foreground">
                        {t("organisms.createKeyButton.selectAgentLabel", { defaultValue: "Select Agent" })}{" "}
                        <span className="text-destructive">*</span>
                      </label>
                    </div>
                    <SearchSelect
                      inputId="create-key-agent"
                      placeholder={t("organisms.createKeyButton.selectAgentPlaceholder", {
                        defaultValue: "Select an agent",
                      })}
                      emptyText={t("organisms.createKeyButton.agentNotFound", { defaultValue: "No agents found" })}
                      value={selectedAgentId}
                      onValueChange={setSelectedAgentId}
                      options={agentsList.map((a) => ({
                        label: a.agent_name || a.agent_id,
                        value: a.agent_id,
                      }))}
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      {t("organisms.createKeyButton.agentKeyDescription", {
                        defaultValue: "This key will be used by the selected agent to make requests to LiteLLM",
                      })}
                    </div>
                  </div>
                )}
                <MountedFormField
                  label={
                    <span>
                      {t("organisms.createKeyButton.organizationLabel", { defaultValue: "Organization" })}{" "}
                      <SimpleTooltip
                        content={t("organisms.createKeyButton.organizationTooltip", {
                          defaultValue:
                            "The organization this key belongs to. Selecting an organization filters the available teams.",
                        })}
                      >
                        <Info className="ml-1 inline size-3.5 align-text-bottom" />
                      </SimpleTooltip>
                    </span>
                  }
                  name="organization_id"
                  className="mt-4"
                >
                  {(control) => (
                    <OrganizationDropdown
                      id={control.id}
                      value={typeof control.value === "string" ? control.value : null}
                      organizations={organizations}
                      loading={isOrganizationsLoading}
                      disabled={userRole !== "Admin"}
                      onChange={changeOrganization(control.onChange)}
                    />
                  )}
                </MountedFormField>
                <MountedFormField
                  label={
                    <span>
                      {t("organisms.createKeyButton.teamLabel", { defaultValue: "Team" })}{" "}
                      <SimpleTooltip
                        content={t("organisms.createKeyButton.teamTooltip", {
                          defaultValue:
                            "The team this key belongs to, which determines available models and budget limits",
                        })}
                      >
                        <Info className="ml-1 inline size-3.5 align-text-bottom" />
                      </SimpleTooltip>
                    </span>
                  }
                  name="team_id"
                  className="mt-4"
                  required={keyOwner === "service_account"}
                  rules={requiredRule(
                    keyOwner === "service_account",
                    t("organisms.createKeyButton.teamRuleMessage", {
                      defaultValue: "Please select a team for the service account",
                    }),
                  )}
                  help={
                    keyOwner === "service_account"
                      ? t("organisms.createKeyButton.helpRequired", { defaultValue: "required" })
                      : ""
                  }
                >
                  {(control) => (
                    <TeamDropdown
                      id={control.id}
                      value={typeof control.value === "string" ? control.value : null}
                      onChange={control.onChange}
                      disabled={selectedProjectId !== null}
                      organizationId={selectedOrganizationId}
                      onTeamSelect={selectTeam}
                    />
                  )}
                </MountedFormField>
                {enableProjectsUI && (
                  <MountedFormField
                    label={
                      <span>
                        {t("organisms.createKeyButton.projectLabel", { defaultValue: "Project" })}{" "}
                        <SimpleTooltip
                          content={t("organisms.createKeyButton.projectTooltip", {
                            defaultValue:
                              "Assign this key to a project. Selecting a project will lock the team to the project's team.",
                          })}
                        >
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="project_id"
                    className="mt-4"
                  >
                    {(control) => (
                      <ProjectDropdown
                        id={control.id}
                        value={typeof control.value === "string" ? control.value : null}
                        projects={projects}
                        teamId={selectedCreateKeyTeam?.team_id}
                        loading={isProjectsLoading || !teams}
                        onChange={changeProject(control.onChange)}
                      />
                    )}
                  </MountedFormField>
                )}
              </div>

              {/* Show message when team selection is required */}
              {isFormDisabled && (
                <div className="mb-8 p-4 bg-info/10 border border-info/20 rounded-md">
                  <p className="text-info text-sm">
                    {t("organisms.createKeyButton.teamSelectionRequiredMessage", {
                      defaultValue:
                        "Please select a team to continue configuring your Virtual Key. If you do not see any teams, please contact your Proxy Admin to either provide you with access to models or to add you to a team.",
                    })}
                  </p>
                </div>
              )}

              {/* Section 2: Key Details */}
              {!isFormDisabled && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    {t("organisms.createKeyButton.sectionKeyDetails", { defaultValue: "Key Details" })}
                  </h3>
                  <MountedFormField
                    label={
                      <span>
                        {keyOwner === "you" || keyOwner === "another_user"
                          ? t("organisms.createKeyButton.keyNameLabel", { defaultValue: "Key Name" })
                          : t("organisms.createKeyButton.serviceAccountIdLabel", {
                              defaultValue: "Service Account ID",
                            })}{" "}
                        <SimpleTooltip
                          content={
                            keyOwner === "you" || keyOwner === "another_user"
                              ? t("organisms.createKeyButton.keyNameTooltip", {
                                  defaultValue: "A descriptive name to identify this key",
                                })
                              : t("organisms.createKeyButton.serviceAccountIdTooltip", {
                                  defaultValue: "Unique identifier for this service account",
                                })
                          }
                        >
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="key_alias"
                    required
                    rules={requiredRule(
                      true,
                      keyOwner === "you"
                        ? t("organisms.createKeyButton.keyAliasRuleMessageKeyName", {
                            defaultValue: "Please input a key name",
                          })
                        : t("organisms.createKeyButton.keyAliasRuleMessageServiceAccountId", {
                            defaultValue: "Please input a service account ID",
                          }),
                    )}
                    help={t("organisms.createKeyButton.helpRequired", { defaultValue: "required" })}
                  >
                    {(control) => <Input {...control} value={(control.value as string | undefined) ?? ""} />}
                  </MountedFormField>

                  <MountedFormField
                    label={
                      <span>
                        {t("organisms.createKeyButton.modelsLabel", { defaultValue: "Models" })}{" "}
                        <SimpleTooltip
                          content={t("organisms.createKeyButton.modelsTooltip", {
                            defaultValue:
                              "Select which models this key can access. Choose 'All Team Models' to grant access to all models available to the team. Leave empty to allow access to all models.",
                          })}
                        >
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="models"
                    help={
                      keyType === "management" || keyType === "read_only"
                        ? t("organisms.createKeyButton.modelsHelpDisabled", {
                            defaultValue: "Models field is disabled for this key type",
                          })
                        : t("organisms.createKeyButton.modelsHelpOptional", {
                            defaultValue: "optional - leave empty to allow access to all models",
                          })
                    }
                    className="mt-4"
                  >
                    {(control) => (
                      <MultiSelect
                        id={control.id}
                        options={modelOptions}
                        value={(control.value as string[] | undefined) ?? []}
                        placeholder={t("organisms.createKeyButton.modelsPlaceholder", {
                          defaultValue: "Select models",
                        })}
                        disabled={keyType === "management" || keyType === "read_only"}
                        onValueChange={(values) => {
                          control.onChange(values);
                          if (values.includes("all-team-models")) {
                            form.setValue("models", ["all-team-models"]);
                          } else if (values.includes("all-proxy-models")) {
                            form.setValue("models", ["all-proxy-models"]);
                          }
                        }}
                      />
                    )}
                  </MountedFormField>

                  <MountedFormField
                    label={
                      <span>
                        {t("organisms.createKeyButton.keyTypeLabel", { defaultValue: "Key Type" })}{" "}
                        <SimpleTooltip
                          content={t("organisms.createKeyButton.keyTypeTooltip", {
                            defaultValue:
                              "Select the type of key to determine what routes and operations this key can access",
                          })}
                        >
                          <Info className="ml-1 inline size-3.5 align-text-bottom" />
                        </SimpleTooltip>
                      </span>
                    }
                    name="key_type"
                    className="mt-4"
                  >
                    {(control) => (
                      <Select
                        items={keyTypeOptions}
                        value={control.value as string | undefined}
                        onValueChange={(value: string | null) =>
                          value != null && changeKeyType(control.onChange)(value)
                        }
                      >
                        <SelectTrigger
                          id={control.id}
                          className="w-full"
                          aria-invalid={control["aria-invalid"]}
                          aria-describedby={control["aria-describedby"]}
                        >
                          <SelectValue
                            placeholder={t("organisms.createKeyButton.keyTypePlaceholder", {
                              defaultValue: "Select key type",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {keyTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="py-1">
                                <div className="font-medium">{option.label}</div>
                                <div className="mt-0.5 text-[11px] text-muted-foreground">{option.hint}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </MountedFormField>
                </div>
              )}

              {/* Section 3: Optional Settings */}
              {!isFormDisabled && (
                <div className="mb-8">
                  <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                    <h3 className="m-0 text-lg font-medium text-foreground">
                      <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                        {t("organisms.createKeyButton.sectionOptionalSettings", { defaultValue: "Optional Settings" })}
                        <ChevronDown className={SECTION_CHEVRON_CLASS} />
                      </CollapsibleTrigger>
                    </h3>
                    <CollapsibleContent className="px-4 pb-3">
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {t("organisms.createKeyButton.maxBudgetLabel", { defaultValue: "Max Budget (USD)" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.maxBudgetTooltip", {
                                defaultValue:
                                  "Maximum amount in USD this key can spend. When reached, the key will be blocked from making further requests",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="max_budget"
                        help={t("organisms.createKeyButton.maxBudgetHelp", {
                          defaultValue: "Budget cannot exceed team max budget: ${{value}}",
                          value:
                            team?.max_budget !== null && team?.max_budget !== undefined
                              ? team?.max_budget
                              : t("organisms.createKeyButton.unlimitedValue", { defaultValue: "unlimited" }),
                        })}
                        rules={ceilingRule(team?.max_budget, (limit) =>
                          t("organisms.createKeyButton.maxBudgetValidatorError", {
                            defaultValue: "Budget cannot exceed team max budget: ${{value}}",
                            value: formatNumberWithCommas(limit, 4),
                          }),
                        )}
                      >
                        {(control) => (
                          <NumericalInput
                            {...control}
                            value={control.value as number | string | undefined}
                            step={0.01}
                            precision={2}
                            width={200}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {t("organisms.createKeyButton.resetBudgetLabel", { defaultValue: "Reset Budget" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.resetBudgetTooltip", {
                                defaultValue:
                                  "How often the budget should reset. For example, setting 'daily' will reset the budget every 24 hours",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="budget_duration"
                        help={t("organisms.createKeyButton.resetBudgetHelp", {
                          defaultValue: "Team Reset Budget: {{value}}",
                          value:
                            team?.budget_duration !== null && team?.budget_duration !== undefined
                              ? team?.budget_duration
                              : t("common.none", { defaultValue: "None" }),
                        })}
                      >
                        {(control) => (
                          <BudgetDurationDropdown
                            id={control.id}
                            value={control.value as string | null | undefined}
                            showNeverResets
                            placeholder={t("organisms.createKeyButton.resetBudgetPlaceholder", {
                              defaultValue: "Not set",
                            })}
                            onChange={(next) => control.onChange(next ?? undefined)}
                          />
                        )}
                      </MountedFormField>
                      <Field className="mt-4">
                        <FieldLabel>
                          <span>
                            {t("organisms.createKeyButton.budgetWindowsLabel", { defaultValue: "Budget Windows" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.budgetWindowsTooltip", {
                                defaultValue:
                                  "Set multiple independent budget windows (e.g., hourly $10 AND monthly $200). Each window tracks spend separately and resets on its own schedule.",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        </FieldLabel>
                        <BudgetWindowsEditor value={budgetLimits} onChange={setBudgetLimits} />
                      </Field>
                      <Field className="mt-4">
                        <FieldLabel>
                          <span>
                            {t("organisms.createKeyButton.perModelBudgetsLabel", { defaultValue: "Per-Model Budgets" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.perModelBudgetsTooltip", {
                                defaultValue:
                                  "Cap spend on individual models, each with its own reset window. Enforced across every request this key makes; usage is reported on the key's info page.",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        </FieldLabel>
                        <ModelMaxBudgetEditor
                          value={modelMaxBudget}
                          onChange={setModelMaxBudget}
                          availableModels={modelsToPick}
                          premiumUser={premiumUser === true}
                        />
                      </Field>
                      <Field className="mt-4">
                        <FieldLabel>
                          <span>
                            {t("organisms.createKeyButton.budgetFallbacksLabel", { defaultValue: "Budget Fallbacks" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.budgetFallbacksTooltip", {
                                defaultValue:
                                  "When a model exceeds its per-model budget (model_max_budget), requests automatically reroute to fallback models instead of failing. Configure per-model budgets in Advanced Settings.",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        </FieldLabel>
                        <BudgetFallbacksEditor
                          key={budgetFallbacksKey}
                          value={budgetFallbacks}
                          onChange={setBudgetFallbacks}
                          availableModels={modelsToPick}
                        />
                      </Field>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {t("organisms.createKeyButton.tpmLabel", { defaultValue: "Tokens per minute Limit (TPM)" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.tpmTooltip", {
                                defaultValue:
                                  "Maximum number of tokens this key can process per minute. Helps control usage and costs",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="tpm_limit"
                        help={t("organisms.createKeyButton.tpmHelp", {
                          defaultValue: "TPM cannot exceed team TPM limit: {{value}}",
                          value:
                            team?.tpm_limit !== null && team?.tpm_limit !== undefined
                              ? team?.tpm_limit
                              : t("organisms.createKeyButton.unlimitedValue", { defaultValue: "unlimited" }),
                        })}
                        rules={ceilingRule(team?.tpm_limit, (limit) =>
                          t("organisms.createKeyButton.tpmValidatorError", {
                            defaultValue: "TPM limit cannot exceed team TPM limit: {{value}}",
                            value: limit,
                          }),
                        )}
                      >
                        {(control) => (
                          <NumericalInput
                            {...control}
                            value={control.value as number | string | undefined}
                            step={1}
                            width={400}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField name="tpm_limit_type" bare>
                        {(control) => (
                          <RateLimitTypeFormItem
                            type="tpm"
                            name="tpm_limit_type"
                            className="mt-4"
                            showDetailedDescriptions
                            id={control.id}
                            value={control.value as string | null | undefined}
                            onChange={control.onChange}
                            aria-invalid={control["aria-invalid"] ? true : undefined}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {t("organisms.createKeyButton.rpmLabel", {
                              defaultValue: "Requests per minute Limit (RPM)",
                            })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.rpmTooltip", {
                                defaultValue:
                                  "Maximum number of API requests this key can make per minute. Helps prevent abuse and manage load",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="rpm_limit"
                        help={t("organisms.createKeyButton.rpmHelp", {
                          defaultValue: "RPM cannot exceed team RPM limit: {{value}}",
                          value:
                            team?.rpm_limit !== null && team?.rpm_limit !== undefined
                              ? team?.rpm_limit
                              : t("organisms.createKeyButton.unlimitedValue", { defaultValue: "unlimited" }),
                        })}
                        rules={ceilingRule(team?.rpm_limit, (limit) =>
                          t("organisms.createKeyButton.rpmValidatorError", {
                            defaultValue: "RPM limit cannot exceed team RPM limit: {{value}}",
                            value: limit,
                          }),
                        )}
                      >
                        {(control) => (
                          <NumericalInput
                            {...control}
                            value={control.value as number | string | undefined}
                            step={1}
                            width={400}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField name="rpm_limit_type" bare>
                        {(control) => (
                          <RateLimitTypeFormItem
                            type="rpm"
                            name="rpm_limit_type"
                            className="mt-4"
                            showDetailedDescriptions
                            id={control.id}
                            value={control.value as string | null | undefined}
                            onChange={control.onChange}
                            aria-invalid={control["aria-invalid"] ? true : undefined}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      <Field className="mt-4">
                        <FieldLabel>
                          <span>
                            {t("organisms.createKeyButton.perTagRateLimitsLabel", {
                              defaultValue: "Per-Tag Rate Limits",
                            })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.perTagRateLimitsTooltip", {
                                defaultValue:
                                  "Scope rate limits to a request tag so each tag (e.g. a cell or group) gets its own RPM counter. Requests without a matching tag fall back to the key-level limit.",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        </FieldLabel>
                        <TagRateLimitEditor value={tagRateLimits} onChange={setTagRateLimits} />
                      </Field>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {t("organisms.createKeyButton.throttleOnBudgetExceededLabel", {
                              defaultValue: "Throttle on budget exceeded",
                            })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.throttleOnBudgetExceededTooltip", {
                                defaultValue:
                                  "When this key exceeds its max budget, throttle its TPM/RPM to the globally configured percentage instead of blocking access entirely. Requires budget_exceeded_throttle_percentage in litellm_settings and a TPM/RPM limit on the key.",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="throttle_on_budget_exceeded"
                      >
                        {(control) => (
                          <Switch
                            id={control.id}
                            checked={control.value === true}
                            onCheckedChange={control.onChange}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        className="mt-4"
                        label={
                          <span>
                            {t("organisms.createKeyButton.enablePromptCachingLabel", {
                              defaultValue: "Enable Prompt Caching",
                            })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.enablePromptCachingTooltip", {
                                defaultValue:
                                  "Automatically add prompt caching breakpoints (cache_control markers) to requests made with this key, cutting input cost on repeated prompts. Applies to Anthropic and Bedrock Claude models; requests that already set their own cache_control markers are left untouched.",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="enable_prompt_caching"
                      >
                        {(control) => (
                          <Switch
                            id={control.id}
                            checked={control.value === true}
                            onCheckedChange={control.onChange}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {t("organisms.createKeyButton.guardrailsLabel", { defaultValue: "Guardrails" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.guardrailsTooltip", {
                                defaultValue:
                                  "Apply safety guardrails to this key to filter content or enforce policies",
                              })}
                            >
                              <a
                                href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                              >
                                <Info className="ml-1 inline size-3.5 align-text-bottom" />
                              </a>
                            </SimpleTooltip>
                          </span>
                        }
                        name="guardrails"
                        className="mt-4"
                        help={
                          canEditGuardrails
                            ? t("organisms.createKeyButton.guardrailsHelpPremium", {
                                defaultValue: "Select existing guardrails or enter new ones",
                              })
                            : t("organisms.createKeyButton.guardrailsHelpNonPremium", {
                                defaultValue: "Premium feature - Upgrade to set guardrails by key",
                              })
                        }
                      >
                        {(control) => (
                          <TagsInput
                            id={control.id}
                            value={(control.value as string[] | undefined) ?? []}
                            onValueChange={control.onChange}
                            disabled={!canEditGuardrails}
                            placeholder={
                              !canEditGuardrails
                                ? t("organisms.createKeyButton.guardrailsPlaceholderNonPremium", {
                                    defaultValue: "Premium feature - Upgrade to set guardrails by key",
                                  })
                                : t("organisms.createKeyButton.guardrailsPlaceholderPremium", {
                                    defaultValue: "Select or enter guardrails",
                                  })
                            }
                            options={guardrailsList.map((name) => ({ value: name, label: name }))}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {t("organisms.createKeyButton.disableGlobalGuardrailsLabel", {
                              defaultValue: "Disable Global Guardrails",
                            })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.disableGlobalGuardrailsTooltip", {
                                defaultValue:
                                  "When enabled, this key will bypass any guardrails configured to run on every request (global guardrails)",
                              })}
                            >
                              <a
                                href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                              >
                                <Info className="ml-1 inline size-3.5 align-text-bottom" />
                              </a>
                            </SimpleTooltip>
                          </span>
                        }
                        name="disable_global_guardrails"
                        className="mt-4"
                        help={
                          canEditGuardrails
                            ? t("organisms.createKeyButton.disableGlobalGuardrailsHelpPremium", {
                                defaultValue: "Bypass global guardrails for this key",
                              })
                            : t("organisms.createKeyButton.disableGlobalGuardrailsHelpNonPremium", {
                                defaultValue: "Premium feature - Upgrade to disable global guardrails by key",
                              })
                        }
                      >
                        {(control) => (
                          <Switch
                            id={control.id}
                            checked={control.value === true}
                            onCheckedChange={control.onChange}
                            disabled={!canEditGuardrails}
                            aria-describedby={control["aria-describedby"]}
                          />
                        )}
                      </MountedFormField>
                      {canViewPolicies && (
                        <MountedFormField
                          label={
                            <span>
                              {t("organisms.createKeyButton.policiesLabel", { defaultValue: "Policies" })}{" "}
                              <SimpleTooltip
                                content={t("organisms.createKeyButton.policiesTooltip", {
                                  defaultValue: "Apply policies to this key to control guardrails and other settings",
                                })}
                              >
                                <a
                                  href="https://docs.litellm.ai/docs/proxy/guardrails/guardrail_policies"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                                >
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </a>
                              </SimpleTooltip>
                            </span>
                          }
                          name="policies"
                          className="mt-4"
                          help={
                            premiumUser
                              ? t("organisms.createKeyButton.policiesHelpPremium", {
                                  defaultValue: "Select existing policies or enter new ones",
                                })
                              : t("organisms.createKeyButton.policiesHelpNonPremium", {
                                  defaultValue: "Premium feature - Upgrade to set policies by key",
                                })
                          }
                        >
                          {(control) => (
                            <TagsInput
                              id={control.id}
                              value={(control.value as string[] | undefined) ?? []}
                              onValueChange={control.onChange}
                              disabled={!premiumUser}
                              placeholder={
                                !premiumUser
                                  ? t("organisms.createKeyButton.policiesPlaceholderNonPremium", {
                                      defaultValue: "Premium feature - Upgrade to set policies by key",
                                    })
                                  : t("organisms.createKeyButton.policiesPlaceholderPremium", {
                                      defaultValue: "Select or enter policies",
                                    })
                              }
                              options={policiesList.map((name) => ({ value: name, label: name }))}
                            />
                          )}
                        </MountedFormField>
                      )}
                      {canViewPrompts && (
                        <MountedFormField
                          label={
                            <span>
                              {t("organisms.createKeyButton.promptsLabel", { defaultValue: "Prompts" })}{" "}
                              <SimpleTooltip
                                content={t("organisms.createKeyButton.promptsTooltip", {
                                  defaultValue: "Allow this key to use specific prompt templates",
                                })}
                              >
                                <a
                                  href="https://docs.litellm.ai/docs/proxy/prompt_management"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                                >
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </a>
                              </SimpleTooltip>
                            </span>
                          }
                          name="prompts"
                          className="mt-4"
                          help={
                            premiumUser
                              ? t("organisms.createKeyButton.promptsHelpPremium", {
                                  defaultValue: "Select existing prompts or enter new ones",
                                })
                              : t("organisms.createKeyButton.promptsHelpNonPremium", {
                                  defaultValue: "Premium feature - Upgrade to set prompts by key",
                                })
                          }
                        >
                          {(control) => (
                            <TagsInput
                              id={control.id}
                              value={(control.value as string[] | undefined) ?? []}
                              onValueChange={control.onChange}
                              disabled={!premiumUser}
                              placeholder={
                                !premiumUser
                                  ? t("organisms.createKeyButton.promptsPlaceholderNonPremium", {
                                      defaultValue: "Premium feature - Upgrade to set prompts by key",
                                    })
                                  : t("organisms.createKeyButton.promptsPlaceholderPremium", {
                                      defaultValue: "Select or enter prompts",
                                    })
                              }
                              options={promptsList.map((name) => ({ value: name, label: name }))}
                            />
                          )}
                        </MountedFormField>
                      )}
                      <MountedFormField
                        label={
                          <span>
                            {t("organisms.createKeyButton.accessGroupsLabel", { defaultValue: "Access Groups" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.accessGroupsTooltip", {
                                defaultValue:
                                  "Assign access groups to this key. Access groups control which models, MCP servers, and agents this key can use",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="access_group_ids"
                        className="mt-4"
                        help={t("organisms.createKeyButton.accessGroupsHelp", {
                          defaultValue: "Select access groups to assign to this key",
                        })}
                      >
                        {(control) => (
                          <AccessGroupSelector
                            value={control.value as string[] | undefined}
                            onChange={control.onChange}
                            placeholder={t("organisms.createKeyButton.accessGroupsPlaceholder", {
                              defaultValue: "Select access groups (optional)",
                            })}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {t("organisms.createKeyButton.passThroughRoutesLabel", {
                              defaultValue: "Allowed Pass Through Routes",
                            })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.passThroughRoutesTooltip", {
                                defaultValue: "Allow this key to use specific pass through routes",
                              })}
                            >
                              <a
                                href="https://docs.litellm.ai/docs/proxy/pass_through"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} // Prevent accordion from collapsing when clicking link
                              >
                                <Info className="ml-1 inline size-3.5 align-text-bottom" />
                              </a>
                            </SimpleTooltip>
                          </span>
                        }
                        name="allowed_passthrough_routes"
                        className="mt-4"
                        help={
                          premiumUser
                            ? t("organisms.createKeyButton.passThroughRoutesHelpPremium", {
                                defaultValue: "Select existing pass through routes or enter new ones",
                              })
                            : t("organisms.createKeyButton.passThroughRoutesHelpNonPremium", {
                                defaultValue: "Premium feature - Upgrade to set pass through routes by key",
                              })
                        }
                      >
                        {(control) => (
                          <PassThroughRoutesSelector
                            value={control.value as string[] | undefined}
                            onChange={control.onChange}
                            accessToken={accessToken}
                            placeholder={
                              !premiumUser
                                ? t("organisms.createKeyButton.passThroughRoutesPlaceholderNonPremium", {
                                    defaultValue: "Premium feature - Upgrade to set pass through routes by key",
                                  })
                                : t("organisms.createKeyButton.passThroughRoutesPlaceholderPremium", {
                                    defaultValue: "Select or enter pass through routes",
                                  })
                            }
                            disabled={!premiumUser}
                            teamId={selectedCreateKeyTeam ? selectedCreateKeyTeam.team_id : null}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {t("organisms.createKeyButton.vectorStoresLabel", {
                              defaultValue: "Allowed Vector Stores",
                            })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.vectorStoresTooltip", {
                                defaultValue:
                                  "Select which vector stores this key can access. If none selected, the key will have access to all available vector stores",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="allowed_vector_store_ids"
                        className="mt-4"
                        help={t("organisms.createKeyButton.vectorStoresHelp", {
                          defaultValue:
                            "Select vector stores this key can access. Leave empty for access to all vector stores",
                        })}
                      >
                        {(control) => (
                          <VectorStoreSelector
                            onChange={control.onChange}
                            value={control.value as string[] | undefined}
                            accessToken={accessToken}
                            placeholder={t("organisms.createKeyButton.vectorStoresPlaceholder", {
                              defaultValue: "Select vector stores (optional)",
                            })}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {t("organisms.createKeyButton.metadataLabel", { defaultValue: "Metadata" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.metadataTooltip", {
                                defaultValue:
                                  "JSON object with additional information about this key. Used for tracking or custom logic",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="metadata"
                        className="mt-4"
                      >
                        {(control) => (
                          <Textarea
                            {...control}
                            value={(control.value as string | undefined) ?? ""}
                            rows={4}
                            placeholder={t("organisms.createKeyButton.metadataPlaceholder", {
                              defaultValue: "Enter metadata as JSON",
                            })}
                          />
                        )}
                      </MountedFormField>
                      <MountedFormField
                        label={
                          <span>
                            {t("organisms.createKeyButton.tagsLabel", { defaultValue: "Tags" })}{" "}
                            <SimpleTooltip
                              content={t("organisms.createKeyButton.tagsTooltip", {
                                defaultValue:
                                  "Tags for tracking spend and/or doing tag-based routing. Used for analytics and filtering",
                              })}
                            >
                              <Info className="ml-1 inline size-3.5 align-text-bottom" />
                            </SimpleTooltip>
                          </span>
                        }
                        name="tags"
                        className="mt-4"
                        help={t("organisms.createKeyButton.tagsHelp", {
                          defaultValue: "Tags for tracking spend and/or doing tag-based routing.",
                        })}
                      >
                        {(control) => (
                          <TagsInput
                            id={control.id}
                            value={(control.value as string[] | undefined) ?? []}
                            onValueChange={control.onChange}
                            placeholder={t("organisms.createKeyButton.tagsPlaceholder", {
                              defaultValue: "Select or enter tags",
                            })}
                            tokenSeparators={[","]}
                            options={tagOptions}
                          />
                        )}
                      </MountedFormField>
                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{t("organisms.createKeyButton.mcpSettingsHeader", { defaultValue: "MCP Settings" })}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <MountedFormField
                            label={
                              <span>
                                {t("organisms.createKeyButton.allowedMcpServersLabel", {
                                  defaultValue: "Allowed MCP Servers",
                                })}{" "}
                                <SimpleTooltip
                                  content={t("organisms.createKeyButton.allowedMcpServersTooltip", {
                                    defaultValue: "Select which MCP servers or access groups this key can access",
                                  })}
                                >
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </SimpleTooltip>
                              </span>
                            }
                            name="allowed_mcp_servers_and_groups"
                            help={t("organisms.createKeyButton.allowedMcpServersHelp", {
                              defaultValue: "Select MCP servers or access groups this key can access",
                            })}
                          >
                            {(control) => (
                              <MCPServerSelector
                                onChange={control.onChange}
                                value={control.value as McpSelectorValue | undefined}
                                accessToken={accessToken}
                                teamId={selectedCreateKeyTeam?.team_id ?? null}
                                placeholder={t("organisms.createKeyButton.allowedMcpServersPlaceholder", {
                                  defaultValue: "Select MCP servers or access groups (optional)",
                                })}
                                allowNoMcpServers
                              />
                            )}
                          </MountedFormField>

                          {/* Hidden field to register mcp_tool_permissions with the form */}
                          <MountedFormField name="mcp_tool_permissions" bare>
                            {(control) => <input type="hidden" id={control.id} name={control.name} />}
                          </MountedFormField>

                          <McpToolPermissionsField
                            accessToken={accessToken}
                            control={form.control}
                            setValue={form.setValue}
                          />
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>
                            {t("organisms.createKeyButton.agentSettingsHeader", { defaultValue: "Agent Settings" })}
                          </b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <MountedFormField
                            label={
                              <span>
                                {t("organisms.createKeyButton.allowedAgentsLabel", { defaultValue: "Allowed Agents" })}{" "}
                                <SimpleTooltip
                                  content={t("organisms.createKeyButton.allowedAgentsTooltip", {
                                    defaultValue: "Select which agents or access groups this key can access",
                                  })}
                                >
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </SimpleTooltip>
                              </span>
                            }
                            name="allowed_agents_and_groups"
                            help={t("organisms.createKeyButton.allowedAgentsHelp", {
                              defaultValue: "Select agents or access groups this key can access",
                            })}
                          >
                            {(control) => (
                              <AgentSelector
                                onChange={control.onChange}
                                value={control.value as AgentSelectorValue | undefined}
                                accessToken={accessToken}
                                placeholder={t("organisms.createKeyButton.allowedAgentsPlaceholder", {
                                  defaultValue: "Select agents or access groups (optional)",
                                })}
                              />
                            )}
                          </MountedFormField>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>
                            {t("organisms.createKeyButton.skillSettingsHeader", { defaultValue: "Skill Settings" })}
                          </b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <MountedFormField
                            label={
                              <span>
                                {t("organisms.createKeyButton.allowedSkillsLabel", { defaultValue: "Allowed Skills" })}{" "}
                                <SimpleTooltip
                                  content={t("organisms.createKeyButton.allowedSkillsTooltip", {
                                    defaultValue:
                                      "Enabled skills are visible to every key. Grant disabled (private) Claude Code plugins to this key here",
                                  })}
                                >
                                  <Info className="ml-1 inline size-3.5 align-text-bottom" />
                                </SimpleTooltip>
                              </span>
                            }
                            name="allowed_skills"
                            help={t("organisms.createKeyButton.allowedSkillsHelp", {
                              defaultValue: "Select private skills this key can access in the Claude Code marketplace",
                            })}
                          >
                            {(control) => (
                              <SkillSelector
                                onChange={control.onChange}
                                value={control.value as string[] | undefined}
                                accessToken={accessToken}
                                placeholder={t("organisms.createKeyButton.allowedSkillsPlaceholder", {
                                  defaultValue: "Select skills (optional)",
                                })}
                              />
                            )}
                          </MountedFormField>
                        </CollapsibleContent>
                      </Collapsible>

                      {premiumUser ? (
                        <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                          <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                            <b>
                              {t("organisms.createKeyButton.loggingSettingsHeader", {
                                defaultValue: "Logging Settings",
                              })}
                            </b>
                            <ChevronDown className={SECTION_CHEVRON_CLASS} />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-3">
                            <div className="mt-4">
                              <PremiumLoggingSettings
                                value={loggingSettings}
                                onChange={setLoggingSettings}
                                premiumUser={true}
                                disabledCallbacks={disabledCallbacks}
                                onDisabledCallbacksChange={setDisabledCallbacks}
                              />
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <SimpleTooltip
                          className="w-full"
                          content={
                            <Trans
                              i18nKey="organisms.createKeyButton.loggingSettingsEnterpriseTooltipDoc"
                              defaults="Key-level logging settings is an enterprise feature, get in touch -<doc>https://www.litellm.ai/enterprise</doc>"
                              components={{
                                doc: <a href="https://www.litellm.ai/enterprise" target="_blank" />,
                              }}
                            />
                          }
                          side="top"
                        >
                          <div style={{ position: "relative" }}>
                            <div style={{ opacity: 0.5 }}>
                              <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                                <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                                  <b>
                                    {t("organisms.createKeyButton.loggingSettingsHeader", {
                                      defaultValue: "Logging Settings",
                                    })}
                                  </b>
                                  <ChevronDown className={SECTION_CHEVRON_CLASS} />
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-4 pb-3">
                                  <div className="mt-4">
                                    <PremiumLoggingSettings
                                      value={loggingSettings}
                                      onChange={setLoggingSettings}
                                      premiumUser={false}
                                      disabledCallbacks={disabledCallbacks}
                                      onDisabledCallbacksChange={setDisabledCallbacks}
                                    />
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                            <div style={{ position: "absolute", inset: 0, cursor: "not-allowed" }} />
                          </div>
                        </SimpleTooltip>
                      )}

                      <Collapsible
                        key={`router-settings-accordion-${routerSettingsKey}`}
                        className="mt-4 mb-4 overflow-hidden rounded-lg border"
                      >
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>
                            {t("organisms.createKeyButton.routerSettingsHeader", { defaultValue: "Router Settings" })}
                          </b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <div className="mt-4 w-full">
                            <RouterSettingsAccordion
                              key={routerSettingsKey}
                              ref={routerSettingsRef}
                              accessToken={accessToken || ""}
                              value={routerSettings || undefined}
                              onChange={setRouterSettings}
                              modelData={
                                userModels.length > 0
                                  ? { data: userModels.map((model) => ({ model_name: model })) }
                                  : undefined
                              }
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{t("organisms.createKeyButton.modelAliasesHeader", { defaultValue: "Model Aliases" })}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-4">
                              {t("organisms.createKeyButton.modelAliasesDescription", {
                                defaultValue:
                                  "Create custom aliases for models that can be used in API calls. This allows you to create shortcuts for specific models.",
                              })}
                            </p>
                            <ModelAliasManager
                              accessToken={accessToken}
                              initialModelAliases={modelAliases}
                              onAliasUpdate={setModelAliases}
                              showExampleConfig={false}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <b>{t("organisms.createKeyButton.keyLifecycleHeader", { defaultValue: "Key Lifecycle" })}</b>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <div className="mt-4">
                            <MountedFormField name="duration" bare>
                              {(control) => (
                                <KeyLifecycleSettings
                                  id={control.id}
                                  value={control.value as string | undefined}
                                  onChange={control.onChange}
                                  autoRotationEnabled={autoRotationEnabled}
                                  onAutoRotationChange={setAutoRotationEnabled}
                                  rotationInterval={rotationInterval}
                                  onRotationIntervalChange={setRotationInterval}
                                  isCreateMode={true}
                                />
                              )}
                            </MountedFormField>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                      <Collapsible className="mt-4 mb-4 overflow-hidden rounded-lg border">
                        <CollapsibleTrigger className={SECTION_HEADER_CLASS}>
                          <div className="flex items-center gap-2">
                            <b>
                              {t("organisms.createKeyButton.advancedSettingsHeader", {
                                defaultValue: "Advanced Settings",
                              })}
                            </b>
                            <SimpleTooltip
                              content={
                                <Trans
                                  i18nKey="organisms.createKeyButton.advancedSettingsTooltipDoc"
                                  defaults="Learn more about advanced settings in our <doc>documentation</doc>"
                                  components={{
                                    doc: (
                                      <a
                                        href={
                                          proxyBaseUrl
                                            ? `${proxyBaseUrl}/#/key%20management/generate_key_fn_key_generate_post`
                                            : `/#/key%20management/generate_key_fn_key_generate_post`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-info hover:text-info/80"
                                      />
                                    ),
                                  }}
                                />
                              }
                            >
                              <Info className="size-4 text-muted-foreground hover:text-foreground cursor-help" />
                            </SimpleTooltip>
                          </div>
                          <ChevronDown className={SECTION_CHEVRON_CLASS} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-3">
                          <SchemaFormFields
                            schemaComponent="GenerateKeyRequest"
                            setValue={form.setValue}
                            excludedFields={[
                              "key_alias",
                              "team_id",
                              "organization_id",
                              "models",
                              "duration",
                              "metadata",
                              "tags",
                              "guardrails",
                              "max_budget",
                              "budget_duration",
                              "tpm_limit",
                              "rpm_limit",
                              ...(disableCustomApiKeys ? ["key"] : []),
                            ]}
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              <div style={{ textAlign: "right", marginTop: "10px" }}>
                <Button type="submit" disabled={isFormDisabled}>
                  {t("organisms.createKeyButton.createKeyButton", { defaultValue: "Create Key" })}
                </Button>
              </div>
            </form>
          </MountedFormProvider>
        </DialogContent>
      </Dialog>

      {/* Add the Create User Modal */}
      {isCreateUserModalVisible && (
        <Dialog open={isCreateUserModalVisible} onOpenChange={(open) => !open && setIsCreateUserModalVisible(false)}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>
                {t("organisms.createKeyButton.createUserModalTitle", { defaultValue: "Create New User" })}
              </DialogTitle>
            </DialogHeader>
            <CreateUserButton
              userID={userID}
              accessToken={accessToken}
              possibleUIRoles={possibleUIRoles}
              onUserCreated={handleUserCreated}
              isEmbedded={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {apiKey && (
        <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="grid grid-cols-1 gap-2 w-full">
              <DialogTitle className="text-lg font-medium text-foreground">
                {t("organisms.createKeyButton.saveKeyTitle", { defaultValue: "Save your Key" })}
              </DialogTitle>
              {apiKey != null ? (
                <CreatedKeyDisplay apiKey={apiKey} />
              ) : (
                <p className="text-sm">
                  {t("organisms.createKeyButton.keyBeingCreated", {
                    defaultValue: "Key being created, this might take 30s",
                  })}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CreateKey;
