"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TFunction } from "i18next";
import { Copy, Info, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/table_cells";
import { IdentityCell } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

export interface AgentHubData {
  agent_id?: string;
  protocolVersion: string;
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities?: {
    streaming?: boolean;
    [key: string]: any;
  };
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  skills?: Array<{
    id: string;
    name: string;
    description: string;
    tags?: string[];
    examples?: string[];
  }>;
  supportsAuthenticatedExtendedCard?: boolean;
  is_public?: boolean;
  [key: string]: any;
}

interface AgentHubRowActionsProps {
  agent: AgentHubData;
  onAgentClick: (agent: AgentHubData) => void;
}

function AgentHubRowActions({ agent, onAgentClick }: AgentHubRowActionsProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("aiHub.agentHubTableColumns.openAgentActions", { defaultValue: "Open agent actions" })}
        data-testid={`agent-hub-actions-${agent.agent_id || agent.name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem data-testid="agent-hub-action-details" onClick={() => onAgentClick(agent)}>
          <Info />
          {t("vectorStoreManagement.documentsTable.viewDetails", { defaultValue: "View details" })}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="agent-hub-action-copy"
          onClick={() =>
            void copyToClipboard(
              agent.name,
              t("aiHub.agentHubTableColumns.agentNameCopied", { defaultValue: "Agent name copied" }),
            )
          }
        >
          <Copy />
          {t("aiHub.agentHubTableColumns.copyAgentName", { defaultValue: "Copy agent name" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AgentHubTableColumnsDeps {
  onAgentClick: (agent: AgentHubData) => void;
  t: TFunction;
}

export const getAgentHubTableColumns = ({ onAgentClick, t }: AgentHubTableColumnsDeps): ColumnDef<AgentHubData>[] => [
  {
    id: "name",
    accessorKey: "name",
    meta: { title: t("aiHub.agentHubTableColumns.colAgentName", { defaultValue: "Agent Name" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("aiHub.agentHubTableColumns.colAgentName", { defaultValue: "Agent Name" })}
      />
    ),
    size: 200,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <IdentityCell title={row.original.name} className="max-w-72" onClick={() => onAgentClick(row.original)} />
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    meta: {
      title: t("common.description", { defaultValue: "Description" }),
      className: "hidden md:table-cell",
    },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={t("common.description", { defaultValue: "Description" })} />
    ),
    size: 240,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-xs" title={row.original.description || undefined}>
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    id: "version",
    accessorKey: "version",
    meta: {
      title: t("aiHub.agentHubTableColumns.colVersion", { defaultValue: "Version" }),
      skeleton: "badge",
      className: "hidden lg:table-cell",
    },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("aiHub.agentHubTableColumns.colVersion", { defaultValue: "Version" })}
      />
    ),
    size: 100,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono font-normal">
        v{row.original.version}
      </Badge>
    ),
  },
  {
    id: "protocolVersion",
    accessorKey: "protocolVersion",
    meta: {
      title: t("aiHub.agentHubTableColumns.colProtocol", { defaultValue: "Protocol" }),
      className: "hidden lg:table-cell",
    },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("aiHub.agentHubTableColumns.colProtocol", { defaultValue: "Protocol" })}
      />
    ),
    size: 100,
    enableSorting: true,
    sortingFn: "alphanumeric",
    cell: ({ row }) => <span className="text-xs">{row.original.protocolVersion || "-"}</span>,
  },
  {
    id: "skills",
    meta: { title: t("aiHub.agentHubTableColumns.colSkills", { defaultValue: "Skills" }), skeleton: "chips" },
    header: t("aiHub.agentHubTableColumns.colSkills", { defaultValue: "Skills" }),
    size: 180,
    enableSorting: false,
    cell: ({ row }) => {
      const skills = row.original.skills || [];
      return (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">
            {t("aiHub.agentHubTableColumns.skillCount", { count: skills.length, defaultValue: "{{count}} skills" })}
          </span>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 2).map((skill) => (
                <Badge key={skill.id} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
              {skills.length > 2 && <span className="text-xs text-muted-foreground">+{skills.length - 2}</span>}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "capabilities",
    meta: {
      title: t("aiHub.agentHubTableColumns.colCapabilities", { defaultValue: "Capabilities" }),
      skeleton: "chips",
    },
    header: t("aiHub.agentHubTableColumns.colCapabilities", { defaultValue: "Capabilities" }),
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
            <Badge key={capability} variant="outline">
              {capability}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "io_modes",
    meta: {
      title: t("aiHub.agentHubTableColumns.colIOModes", { defaultValue: "I/O Modes" }),
      skeleton: "twoLine",
      className: "hidden xl:table-cell",
    },
    header: t("aiHub.agentHubTableColumns.colIOModes", { defaultValue: "I/O Modes" }),
    size: 150,
    enableSorting: false,
    cell: ({ row }) => {
      const inputModes = row.original.defaultInputModes || [];
      const outputModes = row.original.defaultOutputModes || [];
      return (
        <div className="flex flex-col gap-0.5 text-xs">
          <span>
            <span className="font-medium">{t("aiHub.agentHubTableColumns.ioIn", { defaultValue: "In:" })}</span>{" "}
            {inputModes.join(", ") || "-"}
          </span>
          <span>
            <span className="font-medium">{t("aiHub.agentHubTableColumns.ioOut", { defaultValue: "Out:" })}</span>{" "}
            {outputModes.join(", ") || "-"}
          </span>
        </div>
      );
    },
  },
  {
    id: "is_public",
    accessorKey: "is_public",
    meta: {
      title: t("aiHub.agentHubTableColumns.colPublic", { defaultValue: "Public" }),
      skeleton: "badge",
      className: "hidden md:table-cell",
    },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={t("aiHub.agentHubTableColumns.colPublic", { defaultValue: "Public" })}
      />
    ),
    size: 100,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const publicA = rowA.original.is_public === true ? 1 : 0;
      const publicB = rowB.original.is_public === true ? 1 : 0;
      return publicA - publicB;
    },
    cell: ({ row }) => {
      const isPublic = row.original.is_public === true;
      return (
        <StatusBadge
          tone={isPublic ? "success" : "neutral"}
          label={isPublic ? t("common.yes", { defaultValue: "Yes" }) : t("common.no", { defaultValue: "No" })}
        />
      );
    },
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => <span className="sr-only">{t("common.actions", { defaultValue: "Actions" })}</span>,
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <AgentHubRowActions agent={row.original} onAgentClick={onAgentClick} />
      </div>
    ),
  },
];
