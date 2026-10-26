"use client";

import i18n from "@/lib/i18n";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Agent } from "@/components/agents/types";
import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell, MoneyCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

interface AgentRowActionsProps {
  agent: Agent;
  onDeleteClick: (agentId: string, agentName: string) => void;
}

function AgentRowActions({ agent, onDeleteClick }: AgentRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={i18n.t("agentsTableColumns.open-agent-actions", { defaultValue: "Open agent actions" })}
        data-testid={`agent-actions-${agent.agent_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          variant="destructive"
          data-testid="agent-action-delete"
          onClick={() => onDeleteClick(agent.agent_id, agent.agent_name)}
        >
          <Trash2 />
          {i18n.t("common.delete", { defaultValue: "Delete" })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AgentsTableColumnsDeps {
  isAdmin: boolean;
  onAgentClick: (agentId: string) => void;
  onDeleteClick: (agentId: string, agentName: string) => void;
}

export const getAgentsTableColumns = ({
  isAdmin,
  onAgentClick,
  onDeleteClick,
}: AgentsTableColumnsDeps): ColumnDef<Agent>[] => [
  {
    id: "agent_name",
    accessorKey: "agent_name",
    meta: { title: i18n.t("aiHub.agentHubTableColumns.colAgentName", { defaultValue: "Agent Name" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("aiHub.agentHubTableColumns.colAgentName", { defaultValue: "Agent Name" })} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => {
      const name = row.original.agent_name;
      return (
        <span className="block max-w-52 truncate text-sm font-medium text-foreground" title={name || undefined}>
          {name || "-"}
        </span>
      );
    },
  },
  {
    id: "agent_id",
    accessorKey: "agent_id",
    meta: { title: "Agent ID" },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("agentsTableColumns.agent-id", { defaultValue: "Agent ID" })} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.agent_id}
        titleClassName="font-mono text-xs font-normal"
        onClick={() => onAgentClick(row.original.agent_id)}
      />
    ),
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: i18n.t("organization.organizationView.spendColumnTitle", { defaultValue: "Spend (CNY)" }), numeric: true },
    header: ({ column }) => <DataTableSortHeader column={column} title={i18n.t("organization.organizationView.spendColumnTitle", { defaultValue: "Spend (CNY)" })} />,
    size: 130,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "model",
    meta: { title: i18n.t("agents.colModel", { defaultValue: "Model" }) },
    header: i18n.t("agents.colModel", { defaultValue: "Model" }),
    size: 170,
    enableSorting: false,
    cell: ({ row }) => {
      const model = row.original.litellm_params?.model;
      if (!model) {
        return <span className="text-muted-foreground">N/A</span>;
      }
      return (
        <Badge variant="outline" className="max-w-40 font-normal">
          <span className="min-w-0 truncate" title={model}>
            {model}
          </span>
        </Badge>
      );
    },
  },
  {
    id: "created_at",
    accessorFn: (agent) => {
      const timestamp = agent.created_at ? new Date(agent.created_at).getTime() : 0;
      return Number.isNaN(timestamp) ? 0 : timestamp;
    },
    meta: { title: i18n.t("agents.colCreated", { defaultValue: "Created" }) },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={i18n.t("agents.colCreated", { defaultValue: "Created" })} />
    ),
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "status",
    meta: { title: i18n.t("common.status", { defaultValue: "Status" }) },
    header: i18n.t("common.status", { defaultValue: "Status" }),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => {
      const hasKeys = (row.original.keys?.length ?? 0) > 0;
      if (row.original.jwt_auth_configured) return <StatusBadge tone="success" label={i18n.t("agents.jwtConfigured", { defaultValue: "JWT configured" })} />;
      return hasKeys ? (
        <StatusBadge tone="success" label={i18n.t("teamPage.teamInfo.activeStatus", { defaultValue: "Active" })} />
      ) : (
        <StatusBadge tone="warning" label={i18n.t("agentsPage.agentCard.statusNeedsSetup", { defaultValue: "Needs Setup" })} />
      );
    },
  },
  ...(isAdmin
    ? [
        {
          id: "actions",
          meta: { className: "text-right", headerClassName: "text-right" },
          header: () => <span className="sr-only">{i18n.t("common.actions", { defaultValue: "Actions" })}</span>,
          size: 64,
          enableSorting: false,
          enableHiding: false,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <AgentRowActions agent={row.original} onDeleteClick={onDeleteClick} />
            </div>
          ),
        } satisfies ColumnDef<Agent>,
      ]
    : []),
];
