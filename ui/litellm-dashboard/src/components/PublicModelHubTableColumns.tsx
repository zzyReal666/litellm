"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TFunction } from "i18next";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, IdentityCell, StatusBadge, type StatusTone } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { getProviderLogoAndName } from "@/components/provider_info_helpers";
import { PUBLIC_MODEL_HUB_SORTABLE_FIELDS } from "@/components/publicModelHub/publicModelHubFilters";

export interface ModelGroupInfo {
  model_group: string;
  providers: string[];
  max_input_tokens?: number;
  max_output_tokens?: number;
  input_cost_per_token?: number;
  output_cost_per_token?: number;
  mode?: string;
  tpm?: number;
  rpm?: number;
  supports_parallel_function_calling: boolean;
  supports_vision: boolean;
  supports_function_calling: boolean;
  supported_openai_params?: string[];
  health_status?: string;
  health_response_time?: number;
  health_checked_at?: string;
  description?: string;
  [key: string]: any;
}

export interface AgentCard {
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities?: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
  }>;
  iconUrl?: string;
  provider?: {
    organization: string;
    url: string;
  };
  documentationUrl?: string;
  [key: string]: any;
}

export interface MCPServerData {
  server_id: string;
  name: string;
  alias?: string | null;
  server_name: string;
  transport: string;
  spec_path?: string | null;
  auth_type: string;
  mcp_info: {
    server_name: string;
    description?: string;
    mcp_server_cost_info?: any;
  };
  [key: string]: any;
}

const formatCapabilityName = (key: string) =>
  key
    .replace(/^supports_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatCost = (cost: number) => `$${(cost * 1_000_000).toFixed(4)}`;

const translate = (t: TFunction | undefined, key: string, defaultValue: string): string =>
  t === undefined ? defaultValue : t(key, { defaultValue });

const formatTokens = (tokens: number | undefined, t: TFunction | undefined) => {
  if (!tokens) return translate(t, "publicModelHub.na", "N/A");
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return tokens.toString();
};

const formatLimits = (rpm: number | undefined, tpm: number | undefined, t: TFunction | undefined) => {
  const limits = [...(rpm ? [`RPM: ${rpm.toLocaleString()}`] : []), ...(tpm ? [`TPM: ${tpm.toLocaleString()}`] : [])];
  return limits.length > 0 ? limits.join(", ") : translate(t, "publicModelHub.na", "N/A");
};

const getModeIcon = (mode: string) => {
  switch (mode?.toLowerCase()) {
    case "chat":
      return "💬";
    case "rerank":
      return "🔄";
    case "embedding":
      return "📄";
    default:
      return "🤖";
  }
};

const HEALTH_TONES: Record<string, StatusTone> = {
  healthy: "success",
  unhealthy: "error",
};

function ProviderChips({ providers }: { providers: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {providers.map((provider) => {
        const { logo } = getProviderLogoAndName(provider);
        return (
          <span key={provider} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
            {logo && (
              <img
                src={logo}
                alt={provider}
                className="size-3 shrink-0 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="capitalize">{provider}</span>
          </span>
        );
      })}
    </div>
  );
}

function OverflowChips({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <Badge variant="secondary">{items[0]}</Badge>
      {items.length > 1 && (
        <CellTooltip
          content={
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item} className="text-xs">
                  • {item}
                </div>
              ))}
            </div>
          }
          trigger={<span className="cursor-default text-xs text-muted-foreground">+{items.length - 1}</span>}
        />
      )}
    </div>
  );
}

interface PublicModelHubColumnsDeps {
  onModelClick: (model: ModelGroupInfo) => void;
  t?: TFunction;
}

export const getPublicModelHubColumns = ({
  onModelClick,
  t,
}: PublicModelHubColumnsDeps): ColumnDef<ModelGroupInfo>[] => {
  const columns: ColumnDef<ModelGroupInfo>[] = [
    {
      id: "model_group",
      accessorKey: "model_group",
      meta: { title: translate(t, "publicModelHub.colModelName", "Model Name") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colModelName", "Model Name")} />
      ),
      size: 200,
      sortingFn: "alphanumeric",
      cell: ({ row }) => (
        <IdentityCell
          title={row.original.model_group}
          titleClassName="font-mono text-xs font-normal"
          className="max-w-72"
          onClick={() => onModelClick(row.original)}
        />
      ),
    },
    {
      id: "providers",
      accessorKey: "providers",
      meta: { title: translate(t, "publicModelHub.colProviders", "Providers") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colProviders", "Providers")} />
      ),
      size: 150,
      sortingFn: (rowA, rowB) =>
        (rowA.original.providers ?? []).join(", ").localeCompare((rowB.original.providers ?? []).join(", ")),
      cell: ({ row }) => <ProviderChips providers={row.original.providers ?? []} />,
    },
    {
      id: "mode",
      accessorKey: "mode",
      meta: { title: translate(t, "publicModelHub.colMode", "Mode") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colMode", "Mode")} />
      ),
      size: 110,
      sortingFn: "alphanumeric",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 text-sm">
          <span>{getModeIcon(row.original.mode || "")}</span>
          <span>{row.original.mode || translate(t, "publicModelHub.modeChat", "Chat")}</span>
        </span>
      ),
    },
    {
      id: "max_input_tokens",
      accessorKey: "max_input_tokens",
      meta: { title: translate(t, "publicModelHub.colMaxInput", "Max Input") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colMaxInput", "Max Input")} />
      ),
      size: 100,
      cell: ({ row }) => <span className="text-sm">{formatTokens(row.original.max_input_tokens, t)}</span>,
    },
    {
      id: "max_output_tokens",
      accessorKey: "max_output_tokens",
      meta: { title: translate(t, "publicModelHub.colMaxOutput", "Max Output") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colMaxOutput", "Max Output")} />
      ),
      size: 100,
      cell: ({ row }) => <span className="text-sm">{formatTokens(row.original.max_output_tokens, t)}</span>,
    },
    {
      id: "input_cost_per_token",
      accessorKey: "input_cost_per_token",
      meta: { title: translate(t, "publicModelHub.colInputCost", "Input $/1M") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colInputCost", "Input $/1M")} />
      ),
      size: 110,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.input_cost_per_token
            ? formatCost(row.original.input_cost_per_token)
            : translate(t, "publicModelHub.free", "Free")}
        </span>
      ),
    },
    {
      id: "output_cost_per_token",
      accessorKey: "output_cost_per_token",
      meta: { title: translate(t, "publicModelHub.colOutputCost", "Output $/1M") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colOutputCost", "Output $/1M")} />
      ),
      size: 110,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.output_cost_per_token
            ? formatCost(row.original.output_cost_per_token)
            : translate(t, "publicModelHub.free", "Free")}
        </span>
      ),
    },
    {
      id: "features",
      meta: { title: translate(t, "publicModelHub.colFeatures", "Features") },
      header: translate(t, "publicModelHub.colFeatures", "Features"),
      size: 140,
      cell: ({ row }) => {
        const features = Object.entries(row.original)
          .filter(([key, value]) => key.startsWith("supports_") && value === true)
          .map(([key]) => formatCapabilityName(key));
        return <OverflowChips items={features} />;
      },
    },
    {
      id: "health_status",
      accessorKey: "health_status",
      meta: { title: translate(t, "publicModelHub.colHealthStatus", "Health Status") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colHealthStatus", "Health Status")} />
      ),
      size: 130,
      cell: ({ row }) => {
        const model = row.original;
        const responseTimeLabel = model.health_response_time
          ? `Response Time: ${Number(model.health_response_time).toFixed(2)}ms`
          : translate(t, "publicModelHub.na", "N/A");
        const lastCheckedLabel = model.health_checked_at
          ? `Last Checked: ${new Date(model.health_checked_at).toLocaleString()}`
          : translate(t, "publicModelHub.na", "N/A");
        return (
          <CellTooltip
            content={
              <>
                <div>{responseTimeLabel}</div>
                <div>{lastCheckedLabel}</div>
              </>
            }
            trigger={
              <span className="capitalize">
                <StatusBadge
                  tone={HEALTH_TONES[model.health_status ?? ""] || "neutral"}
                  label={model.health_status ?? translate(t, "publicModelHub.unknownStatus", "Unknown")}
                />
              </span>
            }
          />
        );
      },
    },
    {
      id: "rpm",
      accessorKey: "rpm",
      meta: { title: translate(t, "publicModelHub.colLimits", "Limits") },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colLimits", "Limits")} />
      ),
      size: 150,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatLimits(row.original.rpm, row.original.tpm, t)}</span>
      ),
    },
  ];
  return columns.map((column) => ({
    ...column,
    enableSorting: PUBLIC_MODEL_HUB_SORTABLE_FIELDS.includes(String(column.id)),
  }));
};

interface PublicAgentHubColumnsDeps {
  onAgentClick: (agent: AgentCard) => void;
  t?: TFunction;
}

export const getPublicAgentHubColumns = ({ onAgentClick, t }: PublicAgentHubColumnsDeps): ColumnDef<AgentCard>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: { title: translate(t, "publicModelHub.colAgentName", "Agent Name") },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colAgentName", "Agent Name")} />
    ),
    size: 200,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.name}
        titleClassName="font-mono text-xs font-normal"
        className="max-w-72"
        onClick={() => onAgentClick(row.original)}
      />
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    meta: { title: translate(t, "guardrails.keywordTable.colDescription", "Description") },
    header: translate(t, "guardrails.keywordTable.colDescription", "Description"),
    size: 260,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-sm" title={row.original.description || undefined}>
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    id: "version",
    accessorKey: "version",
    meta: { title: translate(t, "publicModelHub.colVersion", "Version") },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={translate(t, "publicModelHub.colVersion", "Version")} />
    ),
    size: 90,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => <span className="text-sm">{row.original.version}</span>,
  },
  {
    id: "provider",
    meta: { title: translate(t, "publicModelHub.colProvider", "Provider") },
    header: translate(t, "publicModelHub.colProvider", "Provider"),
    size: 130,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.provider ? (
        <span className="text-sm font-medium">{row.original.provider.organization}</span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      ),
  },
  {
    id: "skills",
    meta: { title: translate(t, "publicModelHub.colSkills", "Skills") },
    header: translate(t, "publicModelHub.colSkills", "Skills"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <OverflowChips items={(row.original.skills || []).map((skill) => skill.name)} />,
  },
  {
    id: "capabilities",
    meta: { title: translate(t, "publicModelHub.colCapabilities", "Capabilities") },
    header: translate(t, "publicModelHub.colCapabilities", "Capabilities"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => {
      const capabilityList = Object.entries(row.original.capabilities || {})
        .filter(([, value]) => value === true)
        .map(([key]) => key);
      if (capabilityList.length === 0) {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {capabilityList.map((capability) => (
            <Badge key={capability} variant="outline" className="capitalize">
              {capability}
            </Badge>
          ))}
        </div>
      );
    },
  },
];

interface PublicMCPHubColumnsDeps {
  onServerClick: (server: MCPServerData) => void;
  t?: TFunction;
}

export const getPublicMCPHubColumns = ({ onServerClick, t }: PublicMCPHubColumnsDeps): ColumnDef<MCPServerData>[] => [
  {
    id: "server_name",
    accessorKey: "server_name",
    meta: { title: translate(t, "mcpHubTableColumns.colServerName", "Server Name") },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={translate(t, "mcpHubTableColumns.colServerName", "Server Name")} />
    ),
    size: 180,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.server_name}
        titleClassName="font-mono text-xs font-normal"
        className="max-w-72"
        onClick={() => onServerClick(row.original)}
      />
    ),
  },
  {
    id: "description",
    meta: { title: translate(t, "guardrails.keywordTable.colDescription", "Description") },
    header: translate(t, "guardrails.keywordTable.colDescription", "Description"),
    size: 260,
    enableSorting: false,
    cell: ({ row }) => {
      const description = String(row.original.mcp_info?.description ?? "-");
      return (
        <span className="block max-w-72 truncate text-sm" title={description}>
          {description}
        </span>
      );
    },
  },
  {
    id: "transport",
    accessorKey: "transport",
    meta: { title: translate(t, "mcpHubTableColumns.colTransport", "Transport") },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={translate(t, "mcpHubTableColumns.colTransport", "Transport")} />
    ),
    size: 110,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono font-normal uppercase">
        {row.original.transport}
      </Badge>
    ),
  },
  {
    id: "auth_type",
    accessorKey: "auth_type",
    meta: { title: translate(t, "mcpHubTableColumns.colAuthType", "Auth Type") },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={translate(t, "mcpHubTableColumns.colAuthType", "Auth Type")} />
    ),
    size: 110,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <StatusBadge tone={row.original.auth_type === "none" ? "neutral" : "success"} label={row.original.auth_type} />
    ),
  },
];
