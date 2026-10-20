"use client";

import { MCPServer } from "@/components/mcp_tools/types";

export interface RequiredFieldDef {
  key: string;
  labelKey: string;
  label: string;
  descriptionKey: string;
  description: string;
  check: (server: MCPServer) => boolean;
}

export interface FieldGroup {
  labelKey: string;
  label: string;
  fields: RequiredFieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    labelKey: "mcpTools.mcpStandardsSettings.groupDocumentation",
    label: "Documentation",
    fields: [
      {
        key: "description",
        labelKey: "mcpTools.mcpStandardsSettings.fieldDescriptionLabel",
        label: "Description",
        descriptionKey: "mcpTools.mcpStandardsSettings.fieldDescriptionDesc",
        description: "Must have a non-empty description",
        check: (s) => !!s.description?.trim(),
      },
      {
        key: "alias",
        labelKey: "mcpTools.mcpStandardsSettings.fieldAliasLabel",
        label: "Alias",
        descriptionKey: "mcpTools.mcpStandardsSettings.fieldAliasDesc",
        description: "Must have a display alias",
        check: (s) => !!s.alias?.trim(),
      },
    ],
  },
  {
    labelKey: "mcpTools.mcpStandardsSettings.groupSource",
    label: "Source",
    fields: [
      {
        key: "source_url",
        labelKey: "mcpTools.mcpStandardsSettings.fieldSourceUrlLabel",
        label: "GitHub / Source URL",
        descriptionKey: "mcpTools.mcpStandardsSettings.fieldSourceUrlDesc",
        description: "Must link to a source repository",
        check: (s) => !!s.source_url?.trim(),
      },
    ],
  },
  {
    labelKey: "mcpTools.mcpStandardsSettings.groupConnection",
    label: "Connection",
    fields: [
      {
        key: "url",
        labelKey: "mcpTools.mcpStandardsSettings.fieldServerUrlLabel",
        label: "Server URL",
        descriptionKey: "mcpTools.mcpStandardsSettings.fieldServerUrlDesc",
        description: "Must have a URL configured",
        check: (s) => !!s.url?.trim(),
      },
    ],
  },
  {
    labelKey: "mcpTools.mcpStandardsSettings.groupSecurity",
    label: "Security",
    fields: [
      {
        key: "auth_type",
        labelKey: "mcpTools.mcpStandardsSettings.fieldAuthLabel",
        label: "Auth configured",
        descriptionKey: "mcpTools.mcpStandardsSettings.fieldAuthDesc",
        description: "Must use authentication (not 'none')",
        check: (s) => !!s.auth_type && s.auth_type !== "none",
      },
    ],
  },
];

export const MCP_REQUIRED_FIELD_DEFS: RequiredFieldDef[] = FIELD_GROUPS.flatMap((g) => g.fields);

export const SETTINGS_KEY = "mcp_required_fields";
