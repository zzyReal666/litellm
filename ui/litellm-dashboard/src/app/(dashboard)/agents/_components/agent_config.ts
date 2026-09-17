/**
 * Shared configuration for agent form fields
 * Used across create, view, and update operations
 */

import type { TFunction } from "i18next";

export interface FieldConfig {
  name: string;
  labelKey: string;
  label: string;
  type: "text" | "textarea" | "url" | "switch" | "list" | "select";
  required?: boolean;
  tooltipKey?: string;
  tooltip?: string;
  placeholderKey?: string;
  placeholder?: string;
  defaultValue?: any;
  rows?: number;
  validation?: any[];
  options?: string[];
  helpTextKey?: string;
  helpText?: string;
}

export interface SectionConfig {
  key: string;
  titleKey: string;
  title: string;
  fields: FieldConfig[];
  defaultExpanded?: boolean;
}

export const translateFieldText = (
  t: TFunction,
  key: string | undefined,
  text: string | undefined,
): string | undefined => (key !== undefined && text !== undefined ? t(key, { defaultValue: text }) : text);

export const AGENT_FORM_CONFIG: {
  basic: SectionConfig;
  skills: SectionConfig;
  capabilities: SectionConfig;
  optional: SectionConfig;
  litellm: SectionConfig;
  cost: SectionConfig;
  tracing: SectionConfig;
} = {
  basic: {
    key: "basic",
    titleKey: "agentsPage.agentConfig.basicTitle",
    title: "Basic Information",
    defaultExpanded: true,
    fields: [
      {
        name: "name",
        labelKey: "agentsPage.agentConfig.displayNameLabel",
        label: "Display Name",
        type: "text",
        required: true,
        placeholderKey: "agentsPage.agentConfig.displayNamePlaceholder",
        placeholder: "e.g., Customer Support Agent",
      },
      {
        name: "description",
        labelKey: "common.description",
        label: "Description",
        type: "textarea",
        required: true,
        placeholderKey: "agentsPage.agentConfig.descriptionPlaceholder",
        placeholder: "Describe what this agent does...",
        rows: 3,
      },
      {
        name: "url",
        labelKey: "agentsPage.agentConfig.urlLabel",
        label: "URL",
        type: "url",
        required: false,
        placeholderKey: "agentsPage.agentConfig.urlPlaceholder",
        placeholder: "http://localhost:9999/",
        tooltipKey: "agentsPage.agentConfig.urlTooltip",
        tooltip: "Base URL where the agent is hosted (optional)",
      },
      {
        name: "version",
        labelKey: "agentsPage.agentConfig.versionLabel",
        label: "Version",
        type: "text",
        placeholder: "1.0.0",
        defaultValue: "1.0.0",
      },
      {
        name: "protocolVersion",
        labelKey: "agentsPage.agentConfig.protocolVersionLabel",
        label: "Protocol Version",
        type: "select",
        options: ["1.0", "0.3"],
        defaultValue: "1.0",
        tooltipKey: "agentsPage.agentConfig.protocolVersionTooltip",
        tooltip:
          "The A2A protocol version LiteLLM serves to clients for this agent. LiteLLM converts the upstream agent's responses to this version, so clients always see the version you pick here regardless of the original agent's version.",
        helpTextKey: "agentsPage.agentConfig.protocolVersionHelpText",
        helpText:
          "LiteLLM serves this version to clients and converts the upstream agent's responses to match it, regardless of the original agent's version.",
      },
    ],
  },
  skills: {
    key: "skills",
    titleKey: "agentsPage.agentConfig.skillsTitle",
    title: "Skills",
    fields: [
      {
        name: "skills",
        labelKey: "agentsPage.agentConfig.skillsTitle",
        label: "Skills",
        type: "list",
        defaultValue: [],
      },
    ],
  },
  capabilities: {
    key: "capabilities",
    titleKey: "agentsPage.agentConfig.capabilitiesTitle",
    title: "Capabilities",
    fields: [
      {
        name: "streaming",
        labelKey: "agentsPage.agentConfig.streamingLabel",
        label: "Streaming",
        type: "switch",
        defaultValue: false,
      },
      {
        name: "pushNotifications",
        labelKey: "agentsPage.agentConfig.pushNotificationsLabel",
        label: "Push Notifications",
        type: "switch",
      },
      {
        name: "stateTransitionHistory",
        labelKey: "agentsPage.agentConfig.stateTransitionHistoryLabel",
        label: "State Transition History",
        type: "switch",
      },
    ],
  },
  optional: {
    key: "optional",
    titleKey: "agentsPage.agentConfig.optionalTitle",
    title: "Optional Settings",
    fields: [
      {
        name: "iconUrl",
        labelKey: "agentsPage.agentConfig.iconUrlLabel",
        label: "Icon URL",
        type: "url",
        placeholder: "https://example.com/icon.png",
      },
      {
        name: "documentationUrl",
        labelKey: "agentsPage.agentConfig.documentationUrlLabel",
        label: "Documentation URL",
        type: "url",
        placeholder: "https://docs.example.com",
      },
      {
        name: "supportsAuthenticatedExtendedCard",
        labelKey: "agentsPage.agentConfig.supportsAuthCardLabel",
        label: "Supports Authenticated Extended Card",
        type: "switch",
      },
    ],
  },
  litellm: {
    key: "litellm",
    titleKey: "agentsPage.agentConfig.litellmTitle",
    title: "LiteLLM Parameters",
    fields: [
      {
        name: "model",
        labelKey: "agentsPage.agentConfig.modelOptionalLabel",
        label: "Model (Optional)",
        type: "text",
      },
      {
        name: "make_public",
        labelKey: "agentsPage.agentConfig.makePublicLabel",
        label: "Make Public",
        type: "switch",
      },
    ],
  },
  cost: {
    key: "cost",
    titleKey: "agentsPage.agentConfig.costTitle",
    title: "Cost Configuration",
    fields: [
      {
        name: "cost_per_query",
        labelKey: "agentsPage.agentConfig.costPerQueryLabel",
        label: "Cost Per Query ($)",
        type: "text",
        placeholder: "0.0",
        tooltipKey: "agentsPage.agentConfig.costPerQueryTooltip",
        tooltip: "Fixed cost per query",
      },
      {
        name: "input_cost_per_token",
        labelKey: "agentsPage.agentConfig.inputCostPerTokenLabel",
        label: "Input Cost Per Token ($)",
        type: "text",
        placeholder: "0.000001",
        tooltipKey: "agentsPage.agentConfig.inputCostPerTokenTooltip",
        tooltip: "Cost per input token",
      },
      {
        name: "output_cost_per_token",
        labelKey: "agentsPage.agentConfig.outputCostPerTokenLabel",
        label: "Output Cost Per Token ($)",
        type: "text",
        placeholder: "0.000002",
        tooltipKey: "agentsPage.agentConfig.outputCostPerTokenTooltip",
        tooltip: "Cost per output token",
      },
    ],
  },
  tracing: {
    key: "tracing",
    titleKey: "agentsPage.agentConfig.tracingTitle",
    title: "Tracing",
    fields: [
      {
        name: "enable_tracing",
        labelKey: "agentsPage.agentConfig.enableTracingLabel",
        label: "Enable Tracing",
        type: "switch",
        defaultValue: false,
        tooltipKey: "agentsPage.agentConfig.enableTracingTooltip",
        tooltip: "Enable request tracing for this agent",
      },
    ],
  },
};

export const SKILL_FIELD_CONFIG = {
  id: {
    name: "id",
    labelKey: "agentsPage.agentConfig.skillIdLabel",
    label: "Skill ID",
    required: true,
    placeholderKey: "agentsPage.agentConfig.skillIdPlaceholder",
    placeholder: "e.g., hello_world",
  },
  name: {
    name: "name",
    labelKey: "agentsPage.agentConfig.skillNameLabel",
    label: "Skill Name",
    required: true,
    placeholderKey: "agentsPage.agentConfig.skillNamePlaceholder",
    placeholder: "e.g., Returns hello world",
  },
  description: {
    name: "description",
    labelKey: "common.description",
    label: "Description",
    required: true,
    placeholderKey: "agentsPage.agentConfig.skillDescriptionPlaceholder",
    placeholder: "What this skill does",
    rows: 2,
  },
  tags: {
    name: "tags",
    labelKey: "agentsPage.agentConfig.skillTagsLabel",
    label: "Tags",
    required: true,
    placeholderKey: "agentsPage.agentConfig.skillTagsPlaceholder",
    placeholder: "Type a tag and press Enter",
  },
  examples: {
    name: "examples",
    labelKey: "agentsPage.agentConfig.skillExamplesLabel",
    label: "Examples",
    placeholderKey: "agentsPage.agentConfig.skillExamplesPlaceholder",
    placeholder: "Type an example and press Enter",
  },
};

/**
 * Get default form values from configuration
 */
export const getDefaultFormValues = () => {
  const defaults: any = {
    defaultInputModes: ["text"],
    defaultOutputModes: ["text"],
  };

  Object.values(AGENT_FORM_CONFIG).forEach((section) => {
    section.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
  });

  return defaults;
};

/**
 * Build agent data from form values according to AgentConfig spec
 */
export const buildAgentDataFromForm = (values: any, existingAgent?: any) => {
  const agentData: any = {
    agent_name: values.agent_name,
    agent_card_params: {
      protocolVersion: values.protocolVersion || "1.0",
      name: values.name || values.agent_name,
      description: values.description || "",
      url: values.url || "",
      version: values.version || "1.0.0",
      defaultInputModes: existingAgent?.agent_card_params?.defaultInputModes || ["text"],
      defaultOutputModes: existingAgent?.agent_card_params?.defaultOutputModes || ["text"],
      capabilities: {
        streaming: values.streaming === true,
        ...(values.pushNotifications !== undefined && { pushNotifications: values.pushNotifications }),
        ...(values.stateTransitionHistory !== undefined && { stateTransitionHistory: values.stateTransitionHistory }),
      },
      skills: values.skills || [],
      ...(values.iconUrl && { iconUrl: values.iconUrl }),
      ...(values.documentationUrl && { documentationUrl: values.documentationUrl }),
      ...(values.supportsAuthenticatedExtendedCard !== undefined && {
        supportsAuthenticatedExtendedCard: values.supportsAuthenticatedExtendedCard,
      }),
    },
  };

  const params: Record<string, any> = {};

  if (values.model) params.model = values.model;
  if (values.make_public !== undefined) params.make_public = values.make_public;
  if (values.cost_per_query) params.cost_per_query = parseFloat(values.cost_per_query);
  if (values.input_cost_per_token) params.input_cost_per_token = parseFloat(values.input_cost_per_token);
  if (values.output_cost_per_token) params.output_cost_per_token = parseFloat(values.output_cost_per_token);

  if (Object.keys(params).length > 0) {
    agentData.litellm_params = params;
  }

  if (values.tpm_limit != null) agentData.tpm_limit = values.tpm_limit;
  if (values.rpm_limit != null) agentData.rpm_limit = values.rpm_limit;
  if (values.session_tpm_limit != null) agentData.session_tpm_limit = values.session_tpm_limit;
  if (values.session_rpm_limit != null) agentData.session_rpm_limit = values.session_rpm_limit;
  // static_headers: convert [{header, value}, ...] → {header: value, ...}
  if (Array.isArray(values.static_headers) && values.static_headers.length > 0) {
    const staticHeaders: Record<string, string> = {};
    values.static_headers.forEach((entry: { header?: string; value?: string }) => {
      const key = entry?.header?.trim();
      if (key) staticHeaders[key] = entry?.value ?? "";
    });
    if (Object.keys(staticHeaders).length > 0) {
      agentData.static_headers = staticHeaders;
    }
  }

  // extra_headers: already an array of strings from Select tags
  if (Array.isArray(values.extra_headers) && values.extra_headers.length > 0) {
    agentData.extra_headers = values.extra_headers;
  }

  return agentData;
};

export const parseMcpPermissionsForForm = (agent: any) => ({
  allowed_mcp_servers_and_groups: {
    servers: agent.object_permission?.mcp_servers ?? [],
    accessGroups: agent.object_permission?.mcp_access_groups ?? [],
    toolsets: agent.object_permission?.mcp_toolsets ?? [],
  },
  mcp_tool_permissions: agent.object_permission?.mcp_tool_permissions ?? {},
});

/**
 * Always includes every MCP key (empty when cleared) so removals persist;
 * the proxy merges object_permission per key, leaving non-MCP grants untouched.
 */
export const buildMcpObjectPermission = (values: any) => ({
  mcp_servers: values.allowed_mcp_servers_and_groups?.servers ?? [],
  mcp_access_groups: values.allowed_mcp_servers_and_groups?.accessGroups ?? [],
  mcp_toolsets: values.allowed_mcp_servers_and_groups?.toolsets ?? [],
  mcp_tool_permissions: values.mcp_tool_permissions ?? {},
});

/**
 * Parse agent data for form fields
 */
export const parseAgentForForm = (agent: any) => {
  const skills =
    agent.agent_card_params?.skills?.map((skill: any) => ({
      ...skill,
      tags: skill.tags,
      examples: skill.examples || [],
    })) || [];

  return {
    agent_name: agent.agent_name,
    name: agent.agent_card_params?.name,
    description: agent.agent_card_params?.description,
    url: agent.agent_card_params?.url,
    version: agent.agent_card_params?.version,
    protocolVersion: agent.agent_card_params?.protocolVersion,
    streaming: agent.agent_card_params?.capabilities?.streaming,
    pushNotifications: agent.agent_card_params?.capabilities?.pushNotifications,
    stateTransitionHistory: agent.agent_card_params?.capabilities?.stateTransitionHistory,
    skills: skills,
    iconUrl: agent.agent_card_params?.iconUrl,
    documentationUrl: agent.agent_card_params?.documentationUrl,
    supportsAuthenticatedExtendedCard: agent.agent_card_params?.supportsAuthenticatedExtendedCard,
    model: agent.litellm_params?.model,
    make_public: agent.litellm_params?.make_public,
    cost_per_query: agent.litellm_params?.cost_per_query,
    input_cost_per_token: agent.litellm_params?.input_cost_per_token,
    output_cost_per_token: agent.litellm_params?.output_cost_per_token,
    tpm_limit: agent.tpm_limit,
    rpm_limit: agent.rpm_limit,
    session_tpm_limit: agent.session_tpm_limit,
    session_rpm_limit: agent.session_rpm_limit,
    // static_headers: {key: value} → [{header, value}, ...]
    static_headers: agent.static_headers
      ? Object.entries(agent.static_headers as Record<string, string>).map(([header, value]) => ({
          header,
          value,
        }))
      : [],
    // extra_headers: already an array of strings
    extra_headers: agent.extra_headers ?? [],
    ...parseMcpPermissionsForForm(agent),
  };
};
