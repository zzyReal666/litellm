import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useIsOrgAdmin from "@/app/(dashboard)/hooks/useIsOrgAdmin";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";
import { useLogout } from "@/app/(dashboard)/hooks/useLogout";
import { getProxyBaseUrl } from "@/components/networking";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
  sidebarMenuButtonVariants,
} from "@/components/shared/Sidebar";
import {
  Activity,
  BarChart3,
  Bell,
  Blocks,
  Bot,
  BookOpen,
  Building2,
  Boxes,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  FileText,
  FlaskConical,
  Folder,
  HeartPulse,
  KeyRound,
  LayoutGrid,
  Network,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PiggyBank,
  PlayCircle,
  Route,
  ScrollText,
  Search,
  Server,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  Tags,
  Terminal,
  User,
  Users,
  Wallet,
  Wrench,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cva.config";
import { rolesWithCapability } from "../utils/capabilities";
import {
  all_admin_roles,
  internalUserRoles,
  isAdminRole,
  isUserTeamAdminForAnyTeam,
  rolesAllowedToViewWriteScopedPages,
  rolesWithWriteAccess,
} from "../utils/roles";
import BetaBadge from "./BetaBadge";
import SidebarAccountMenu from "./SidebarAccountMenu/SidebarAccountMenu";
import SidebarUsageCard from "./SidebarUsageCard";
import { routeSegmentForPathname, uiHref } from "@/utils/uiHref";

const ICON = { strokeWidth: 1.75 } as const;

const LOGO_CLASS_NAME = "h-7 w-auto max-w-[150px] object-contain group-data-[collapsed=true]/sidebar:w-7";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  enabledPagesInternalUsers?: string[] | null;
  enableProjectsUI?: boolean;
  disableAgentsForInternalUsers?: boolean;
  allowAgentsForTeamAdmins?: boolean;
  disableVectorStoresForInternalUsers?: boolean;
  allowVectorStoresForTeamAdmins?: boolean;
}

interface MenuItem {
  key: string;
  page: string;
  route?: string;
  label: string | React.ReactNode;
  roles?: string[];
  children?: MenuItem[];
  icon?: React.ReactNode;
  external_url?: string;
}

interface MenuGroup {
  groupLabel: string;
  items: MenuItem[];
  roles?: string[];
}

// Menu groups organized by category - defined outside component for export.
// Shape (key/page/label/roles/children) is consumed by page_utils.ts; only the
// icons changed to lucide as part of the sidebar redesign.
const menuGroups: MenuGroup[] = [
  {
    groupLabel: "AI GATEWAY",
    items: [
      { key: "api-keys", page: "api-keys", label: "Virtual Keys", icon: <KeyRound {...ICON} /> },
      {
        key: "llm-playground",
        page: "llm-playground",
        route: "playground",
        label: "Playground",
        icon: <PlayCircle {...ICON} />,
        roles: rolesWithWriteAccess,
      },
      {
        key: "models",
        page: "models",
        route: "models-and-endpoints",
        label: "Models + Endpoints",
        icon: <Network {...ICON} />,
        roles: rolesAllowedToViewWriteScopedPages,
      },
      {
        key: "agentic",
        page: "agentic",
        label: "Agentic",
        icon: <Bot {...ICON} />,
        children: [
          {
            key: "agents",
            page: "agents",
            label: "Agents",
            icon: <Bot {...ICON} />,
            roles: rolesAllowedToViewWriteScopedPages,
          },
          {
            key: "workflows",
            page: "workflows",
            label: "Workflow Runs",
            icon: <Workflow {...ICON} />,
            roles: rolesWithCapability("viewWorkflowRuns"),
          },
          {
            key: "memory",
            page: "memory",
            label: "Memory",
            icon: <Database {...ICON} />,
            roles: rolesWithCapability("viewMemory"),
          },
        ],
      },
      { key: "mcp-servers", page: "mcp-servers", label: "MCP Servers", icon: <Server {...ICON} /> },
      { key: "skills", page: "skills", label: "Skills", icon: <Blocks {...ICON} />, roles: all_admin_roles },
      { key: "guardrails", page: "guardrails", label: "Guardrails", icon: <Shield {...ICON} /> },
      {
        key: "policies",
        page: "policies",
        label: "Policies",
        icon: <ScrollText {...ICON} />,
        roles: rolesWithCapability("viewPolicies"),
      },
      {
        key: "tools",
        page: "tools",
        label: "Tools",
        icon: <Wrench {...ICON} />,
        children: [
          { key: "search-tools", page: "search-tools", label: "Search Tools", icon: <Search {...ICON} /> },
          { key: "vector-stores", page: "vector-stores", label: "Vector Stores", icon: <Database {...ICON} /> },
          {
            key: "tool-policies",
            page: "tool-policies",
            label: "Tool Policies",
            icon: <ShieldCheck {...ICON} />,
            roles: rolesWithCapability("viewToolPolicies"),
          },
        ],
      },
    ],
  },
  {
    groupLabel: "OBSERVABILITY",
    items: [
      {
        key: "new_usage",
        page: "new_usage",
        route: "usage",
        icon: <BarChart3 {...ICON} />,
        roles: [...all_admin_roles, ...internalUserRoles],
        label: "Usage",
      },
      {
        key: "cost-optimization",
        page: "cost-optimization",
        icon: <PiggyBank {...ICON} />,
        roles: [...all_admin_roles, ...internalUserRoles],
        label: "Cost Optimization",
      },
      { key: "logs", page: "logs", label: "Logs", icon: <Activity {...ICON} /> },
      {
        key: "guardrails-monitor",
        page: "guardrails-monitor",
        label: "Guardrails Monitor",
        icon: <HeartPulse {...ICON} />,
        roles: rolesWithCapability("viewGuardrailUsage"),
      },
    ],
  },
  {
    groupLabel: "ACCESS CONTROL",
    items: [
      { key: "teams", page: "teams", label: "Teams", icon: <Users {...ICON} /> },
      {
        key: "projects",
        page: "projects",
        label: (
          <span className="flex items-center gap-2">
            Projects <BetaBadge />
          </span>
        ),
        icon: <Folder {...ICON} />,
        roles: all_admin_roles,
      },
      { key: "users", page: "users", label: "Internal Users", icon: <User {...ICON} />, roles: all_admin_roles },
      {
        key: "organizations",
        page: "organizations",
        label: "Organizations",
        icon: <Building2 {...ICON} />,
        roles: all_admin_roles,
      },
      {
        key: "access-groups",
        page: "access-groups",
        label: "Access Groups",
        icon: <Boxes {...ICON} />,
        roles: all_admin_roles,
      },
      { key: "budgets", page: "budgets", label: "Budgets", icon: <Wallet {...ICON} />, roles: all_admin_roles },
    ],
  },
  {
    groupLabel: "DEVELOPER TOOLS",
    items: [
      { key: "api_ref", page: "api_ref", route: "api-reference", label: "API Reference", icon: <Code2 {...ICON} /> },
      { key: "model-hub-table", page: "model-hub-table", label: "AI Hub", icon: <LayoutGrid {...ICON} /> },
      {
        key: "learning-resources",
        page: "learning-resources",
        label: "Learning Resources",
        icon: <BookOpen {...ICON} />,
        external_url: "https://models.litellm.ai/cookbook",
      },
      {
        key: "caching",
        page: "caching",
        label: "Response Cache",
        icon: <Database {...ICON} />,
        roles: all_admin_roles,
      },
      {
        key: "experimental",
        page: "experimental",
        label: "Experimental",
        icon: <FlaskConical {...ICON} />,
        children: [
          {
            key: "prompts",
            page: "prompts",
            label: "Prompts",
            icon: <FileText {...ICON} />,
            roles: rolesWithCapability("viewPrompts"),
          },
          {
            key: "transform-request",
            page: "transform-request",
            label: "API Playground",
            icon: <Terminal {...ICON} />,
            roles: [...all_admin_roles, ...internalUserRoles],
          },
          {
            key: "tag-management",
            page: "tag-management",
            label: "Tag Management",
            icon: <Tags {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "4",
            page: "usage",
            route: "old-usage",
            label: "Old Usage",
            icon: <BarChart3 {...ICON} />,
            roles: rolesWithCapability("viewGlobalSpend"),
          },
        ],
      },
    ],
  },
  {
    groupLabel: "SETTINGS",
    roles: all_admin_roles,
    items: [
      {
        key: "settings",
        page: "settings",
        label: "Settings",
        icon: <SettingsIcon {...ICON} />,
        roles: all_admin_roles,
        children: [
          {
            key: "router-settings",
            page: "router-settings",
            label: "Router Settings",
            icon: <Route {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "logging-and-alerts",
            page: "logging-and-alerts",
            label: "Logging & Alerts",
            icon: <Bell {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "admin-panel",
            page: "admin-panel",
            label: "Admin Settings",
            icon: <SettingsIcon {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "cost-tracking",
            page: "cost-tracking",
            label: "Cost Tracking",
            icon: <BarChart3 {...ICON} />,
            roles: all_admin_roles,
          },
          { key: "ui-theme", page: "ui-theme", label: "UI Theme", icon: <Palette {...ICON} />, roles: all_admin_roles },
        ],
      },
    ],
  },
];

const HOME_ROUTE = "api-keys";

const routeOf = (item: MenuItem): string => item.route ?? item.page;

const routeForPathname = (pathname: string): string => routeSegmentForPathname(pathname) || HOME_ROUTE;

const findParentKey = (route: string): string | null => {
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (item.children?.some((c) => routeOf(c) === route)) return item.key;
    }
  }
  return null;
};

const findMenuItemKey = (route: string): string => {
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (routeOf(item) === route) return item.key;
      const child = item.children?.find((c) => routeOf(c) === route);
      if (child) return child.key;
    }
  }
  return HOME_ROUTE;
};

const SECTION_DISPLAY: Record<string, string> = {
  "AI GATEWAY": "AI Gateway",
  OBSERVABILITY: "Observability",
  "ACCESS CONTROL": "Access Control",
  "DEVELOPER TOOLS": "Developer Tools",
  SETTINGS: "Settings",
};

const prettify = (key: string): string =>
  key
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const labelText = (item: MenuItem, fallback?: string): string =>
  typeof item.label === "string" ? item.label : fallback ?? prettify(item.key);

const NAV_LABEL_KEYS: Record<string, string> = {
  "api-keys": "nav.virtualKeys",
  "llm-playground": "nav.playground",
  models: "nav.modelsEndpoints",
  agentic: "nav.agentic",
  agents: "nav.agents",
  workflows: "nav.workflowRuns",
  memory: "nav.memory",
  "mcp-servers": "nav.mcpServers",
  skills: "nav.skills",
  guardrails: "nav.guardrails",
  policies: "nav.policies",
  tools: "nav.tools",
  "search-tools": "nav.searchTools",
  "vector-stores": "nav.vectorStores",
  "tool-policies": "nav.toolPolicies",
  new_usage: "nav.usage",
  "cost-optimization": "nav.costOptimization",
  logs: "nav.logs",
  "guardrails-monitor": "nav.guardrailsMonitor",
  teams: "nav.teams",
  projects: "nav.projects",
  users: "nav.internalUsers",
  organizations: "nav.organizations",
  "access-groups": "nav.accessGroups",
  budgets: "nav.budgets",
  api_ref: "nav.apiReference",
  "model-hub-table": "nav.aiHub",
  "learning-resources": "nav.learningResources",
  caching: "nav.caching",
  experimental: "nav.experimental",
  prompts: "nav.prompts",
  "transform-request": "nav.apiPlayground",
  "tag-management": "nav.tagManagement",
  "4": "nav.oldUsage",
  settings: "nav.settings",
  "router-settings": "nav.routerSettings",
  "logging-and-alerts": "nav.loggingAlerts",
  "admin-panel": "nav.adminSettings",
  "cost-tracking": "nav.costTracking",
  "ui-theme": "nav.uiTheme",
};

const NAV_GROUP_LABEL_KEYS: Record<string, string> = {
  "AI GATEWAY": "nav.groups.aiGateway",
  OBSERVABILITY: "nav.groups.observability",
  "ACCESS CONTROL": "nav.groups.accessControl",
  "DEVELOPER TOOLS": "nav.groups.developerTools",
  SETTINGS: "nav.groups.settings",
};

// Items whose label carries inline markup (the beta badge) keep their own React
// node, so the tooltip text comes from this plain-text lookup instead.
const LABEL_FALLBACKS: Record<string, string> = {
  "cost-optimization": "Cost Optimization",
};

const itemLabel = (item: MenuItem, t?: TFunction): string => {
  const fallback = labelText(item, LABEL_FALLBACKS[item.key]);
  const key = NAV_LABEL_KEYS[item.key];
  return key && t ? t(key, { defaultValue: fallback }) : fallback;
};

const groupLabel = (group: MenuGroup, t?: TFunction): string => {
  const fallback = SECTION_DISPLAY[group.groupLabel] ?? group.groupLabel;
  const key = NAV_GROUP_LABEL_KEYS[group.groupLabel];
  return key && t ? t(key, { defaultValue: fallback }) : fallback;
};

const sidebarGroupLabel = (label: string, t: TFunction): string => {
  const key = NAV_GROUP_LABEL_KEYS[label];
  return key ? t(key, { defaultValue: label }) : label;
};

// Breadcrumb ("Section" / "Page") for the top bar, derived from the same nav config.
export const getBreadcrumb = (pathname: string, t?: TFunction): { section: string | null; title: string } => {
  const route = routeForPathname(pathname);
  for (const group of menuGroups) {
    for (const item of group.items) {
      const section = groupLabel(group, t);
      if (routeOf(item) === route) return { section, title: itemLabel(item, t) };
      const child = item.children?.find((c) => routeOf(c) === route);
      if (child) return { section, title: itemLabel(child, t) };
    }
  }
  return { section: null, title: prettify(route) };
};

const Sidebar_: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapsed,
  enabledPagesInternalUsers,
  enableProjectsUI,
  disableAgentsForInternalUsers,
  allowAgentsForTeamAdmins,
  disableVectorStoresForInternalUsers,
  allowVectorStoresForTeamAdmins,
}) => {
  const { t } = useTranslation();
  const { userId, accessToken, userRole, isViewOnly } = useAuthorized();
  const isOrgAdmin = useIsOrgAdmin();
  const { data: teams } = useTeams();
  const { logoUrl, logoUrlDark } = useTheme();
  const [erroredDarkLogo, setErroredDarkLogo] = useState<string | null>(null);
  const { data: healthData } = useHealthReadinessDetails(accessToken);
  const logout = useLogout(accessToken);

  const baseUrl = getProxyBaseUrl();
  const version = healthData?.litellm_version;
  const currentRoute = routeForPathname(usePathname());
  const selectedKey = findMenuItemKey(currentRoute);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const parent = findParentKey(currentRoute);
    return new Set(parent ? [parent] : []);
  });

  // Keep the active page's parent group expanded as the user navigates, using the
  // "adjust state during render" pattern rather than an effect (avoids a
  // setState-in-effect render cascade).
  const [prevRoute, setPrevRoute] = useState(currentRoute);
  if (currentRoute !== prevRoute) {
    setPrevRoute(currentRoute);
    const parent = findParentKey(currentRoute);
    if (parent && !openGroups.has(parent)) {
      setOpenGroups((prev) => new Set(prev).add(parent));
    }
  }

  const isTeamAdmin = useMemo(() => isUserTeamAdminForAnyTeam(teams ?? null, userId ?? ""), [teams, userId]);

  const filterItemsByRole = (items: MenuItem[]): MenuItem[] => {
    const isAdmin = isAdminRole(userRole);
    return items
      .map((item) => ({ ...item, children: item.children ? filterItemsByRole(item.children) : undefined }))
      .filter((item) => {
        // A parent whose children were all filtered out renders as a leaf link
        // to its own page id, which is not a real route. Drop it instead.
        if (item.children && item.children.length === 0) return false;
        if (item.key === "llm-playground" && isViewOnly) return false;
        if (item.key === "organizations" || item.key === "users") {
          const hasRoleAccess = !item.roles || item.roles.includes(userRole) || isOrgAdmin;
          if (!hasRoleAccess) return false;
          if (!isAdmin && enabledPagesInternalUsers != null) return enabledPagesInternalUsers.includes(item.page);
          return true;
        }
        if (item.key === "projects" && !enableProjectsUI) return false;
        if (
          !isAdmin &&
          item.key === "agents" &&
          disableAgentsForInternalUsers &&
          !(allowAgentsForTeamAdmins && isTeamAdmin)
        )
          return false;
        if (
          !isAdmin &&
          item.key === "vector-stores" &&
          disableVectorStoresForInternalUsers &&
          !(allowVectorStoresForTeamAdmins && isTeamAdmin)
        )
          return false;
        if (item.roles && !item.roles.includes(userRole)) return false;
        if (!isAdmin && enabledPagesInternalUsers != null) {
          if (item.children && item.children.length > 0) {
            const hasVisibleChildren = item.children.some((child) => enabledPagesInternalUsers.includes(child.page));
            if (hasVisibleChildren) return true;
          }
          return enabledPagesInternalUsers.includes(item.page);
        }
        return true;
      });
  };

  const visibleGroups = menuGroups
    .filter((group) => !group.roles || group.roles.includes(userRole))
    .map((group) => ({ groupLabel: group.groupLabel, items: filterItemsByRole(group.items) }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (key: string) => {
    if (collapsed) {
      onToggleCollapsed?.();
      setOpenGroups((prev) => new Set(prev).add(key));
      return;
    }
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderLeaf = (item: MenuItem, isChild: boolean) => {
    const active = selectedKey === item.key;
    const size = isChild ? "sub" : "default";
    const label = (
      <span className="flex flex-1 items-center gap-2 truncate group-data-[collapsed=true]/sidebar:hidden">
        {itemLabel(item, t)}
        {item.key === "cost-optimization" ? <BetaBadge /> : null}
      </span>
    );

    if (item.external_url) {
      return (
        <a
          key={item.key}
          href={item.external_url}
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? itemLabel(item, t) : undefined}
          data-active={active || undefined}
          className={cn(sidebarMenuButtonVariants({ isActive: active, size }))}
        >
          {item.icon}
          {label}
          <ExternalLink className="size-3.5 shrink-0 opacity-70 group-data-[collapsed=true]/sidebar:hidden" />
        </a>
      );
    }

    return (
      <Link
        key={item.key}
        href={uiHref(routeOf(item))}
        title={collapsed ? itemLabel(item, t) : undefined}
        data-active={active || undefined}
        className={cn(sidebarMenuButtonVariants({ isActive: active, size }))}
      >
        {item.icon}
        {label}
      </Link>
    );
  };

  const renderItem = (item: MenuItem) => {
    const isGroup = !!item.children && item.children.length > 0;
    if (!isGroup) {
      return <SidebarMenuItem key={item.key}>{renderLeaf(item, false)}</SidebarMenuItem>;
    }

    const active = selectedKey === item.key;
    const open = openGroups.has(item.key);
    return (
      <SidebarMenuItem key={item.key}>
        <SidebarMenuButton
          isActive={active}
          aria-expanded={open}
          onClick={() => toggleGroup(item.key)}
          title={collapsed ? itemLabel(item, t) : undefined}
        >
          {item.icon}
          <span className="flex flex-1 items-center gap-2 truncate group-data-[collapsed=true]/sidebar:hidden">
            {itemLabel(item, t)}
            {item.key === "cost-optimization" ? <BetaBadge /> : null}
          </span>
          <ChevronRight
            className={cn(
              "size-4 shrink-0 transition-transform group-data-[collapsed=true]/sidebar:hidden",
              open && "rotate-90",
            )}
          />
        </SidebarMenuButton>
        {open && (
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuItem key={child.key}>{renderLeaf(child, true)}</SidebarMenuItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  };

  const logoSrc = logoUrl || `${baseUrl}/get_image`;
  const reachableDarkLogo = logoUrlDark === erroredDarkLogo ? null : logoUrlDark;
  const darkLogoSrc = reachableDarkLogo || logoUrl || `${baseUrl}/get_image?theme=dark`;

  return (
    <Sidebar collapsed={collapsed}>
      <SidebarHeader className="h-14 border-b border-border group-data-[collapsed=true]/sidebar:h-auto">
        <div className="flex items-center justify-between gap-2 group-data-[collapsed=true]/sidebar:flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={uiHref("")}
              className="flex min-w-0 items-center"
              aria-label={t("navbar.liteLLMHome", { defaultValue: "LiteLLM home" })}
            >
              <img
                src={logoSrc}
                alt={t("navbar.logoAlt", { defaultValue: "LiteLLM Brand" })}
                className={cn(LOGO_CLASS_NAME, "dark:hidden")}
              />
              <img
                src={darkLogoSrc}
                alt=""
                aria-hidden
                onError={() => setErroredDarkLogo(logoUrlDark)}
                className={cn(LOGO_CLASS_NAME, "hidden dark:block")}
              />
            </Link>
            {version && (
              <Badge
                variant="outline"
                render={<a href="https://docs.litellm.ai/release_notes" target="_blank" rel="noopener noreferrer" />}
                className="px-1.5 py-0 font-mono text-[10px] font-medium text-muted-foreground group-data-[collapsed=true]/sidebar:hidden"
              >
                v{version}
              </Badge>
            )}
          </div>
          {onToggleCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapsed}
              aria-label={
                collapsed
                  ? t("navbar.expandSidebar", { defaultValue: "Expand sidebar" })
                  : t("navbar.collapseSidebar", { defaultValue: "Collapse sidebar" })
              }
              className="flex-none text-muted-foreground"
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          )}
        </div>
      </SidebarHeader>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-0.5 px-3 pb-3">
          {visibleGroups.map((group, gi) => (
            <SidebarGroup key={group.groupLabel}>
              {gi > 0 && <SidebarSeparator className="hidden group-data-[collapsed=true]/sidebar:block" />}
              <SidebarGroupLabel>{sidebarGroupLabel(group.groupLabel, t)}</SidebarGroupLabel>
              <SidebarMenu>{group.items.map((item) => renderItem(item))}</SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
      </ScrollArea>

      <SidebarFooter>
        {isAdminRole(userRole) && (
          <SidebarUsageCard
            accessToken={accessToken}
            collapsed={collapsed}
            onExpandRail={() => onToggleCollapsed?.()}
          />
        )}
        <SidebarAccountMenu onLogout={logout} collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
};

export default Sidebar_;

export { menuGroups };
