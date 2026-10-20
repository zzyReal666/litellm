"use client";

import { ColumnDef } from "@tanstack/react-table";
import { TFunction } from "i18next";
import { LayersIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ProjectResponse } from "@/app/(dashboard)/hooks/projects/useProjects";
import { DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, DateCell, IdentityCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function ProjectTeamCell({
  project,
  teamAliasMap,
  isTeamsLoading,
}: {
  project: ProjectResponse;
  teamAliasMap: Map<string, string>;
  isTeamsLoading: boolean;
}) {
  if (!project.team_id) return <span className="text-sm">—</span>;
  const alias = teamAliasMap.get(project.team_id);
  if (alias) {
    return (
      <span className="block max-w-60 truncate text-sm" title={alias}>
        {alias}
      </span>
    );
  }
  if (isTeamsLoading) return <Skeleton className="h-3.5 w-24" />;
  return (
    <span className="block max-w-60 truncate font-mono text-xs" title={project.team_id}>
      {project.team_id}
    </span>
  );
}

function ProjectModelsCell({ project }: { project: ProjectResponse }) {
  const { t } = useTranslation();
  const models = project.models ?? [];
  return (
    <CellTooltip
      content={
        models.length > 0 ? models.join(", ") : t("projects.projectsPage.noModels", { defaultValue: "No models" })
      }
      trigger={
        <Badge variant="outline" className="cursor-default gap-1.5 font-normal">
          <LayersIcon className="size-3.5" />
          {models.length}
        </Badge>
      }
    />
  );
}

interface ProjectsTableColumnsDeps {
  onProjectClick: (projectId: string) => void;
  teamAliasMap: Map<string, string>;
  isTeamsLoading: boolean;
  t: TFunction;
}

export const getProjectsTableColumns = ({
  onProjectClick,
  teamAliasMap,
  isTeamsLoading,
  t,
}: ProjectsTableColumnsDeps): ColumnDef<ProjectResponse>[] => [
  {
    id: "project_id",
    accessorKey: "project_id",
    meta: { title: t("guardrails.labelId", { defaultValue: "ID" }) },
    header: t("guardrails.labelId", { defaultValue: "ID" }),
    size: 190,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.project_id}
        titleClassName="font-mono text-xs font-normal"
        onClick={() => onProjectClick(row.original.project_id)}
      />
    ),
  },
  {
    id: "project_alias",
    accessorFn: (row) => row.project_alias ?? "",
    meta: { title: t("common.name", { defaultValue: "Name" }) },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("common.name", { defaultValue: "Name" })} />,
    size: 200,
    enableSorting: true,
    cell: ({ row }) => (
      <span className="block max-w-60 truncate text-sm font-medium" title={row.original.project_alias ?? undefined}>
        {row.original.project_alias ?? "—"}
      </span>
    ),
  },
  {
    id: "team",
    accessorFn: (row) => teamAliasMap.get(row.team_id ?? "") ?? "",
    meta: { title: t("projects.projectsPage.colTeam", { defaultValue: "Team" }) },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={t("projects.projectsPage.colTeam", { defaultValue: "Team" })} />
    ),
    size: 180,
    enableSorting: true,
    cell: ({ row }) => (
      <ProjectTeamCell project={row.original} teamAliasMap={teamAliasMap} isTeamsLoading={isTeamsLoading} />
    ),
  },
  {
    id: "models",
    meta: { title: t("projects.projectsPage.colModels", { defaultValue: "Models" }), skeleton: "badge" },
    header: t("projects.projectsPage.colModels", { defaultValue: "Models" }),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <ProjectModelsCell project={row.original} />,
  },
  {
    id: "status",
    accessorKey: "blocked",
    meta: { title: t("common.status", { defaultValue: "Status" }), skeleton: "badge" },
    header: t("common.status", { defaultValue: "Status" }),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge
        tone={row.original.blocked ? "error" : "success"}
        label={
          row.original.blocked
            ? t("projects.projectsPage.statusBlocked", { defaultValue: "Blocked" })
            : t("common.active", { defaultValue: "Active" })
        }
      />
    ),
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    sortingFn: "datetime",
    meta: { title: t("oldTeams.columns.created", { defaultValue: "Created" }) },
    header: ({ column }) => (
      <DataTableSortHeader column={column} title={t("oldTeams.columns.created", { defaultValue: "Created" })} />
    ),
    size: 140,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    meta: { title: t("memoryView.memoryView.colUpdated", { defaultValue: "Updated" }) },
    header: t("memoryView.memoryView.colUpdated", { defaultValue: "Updated" }),
    size: 140,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} precision="date" />,
  },
];
