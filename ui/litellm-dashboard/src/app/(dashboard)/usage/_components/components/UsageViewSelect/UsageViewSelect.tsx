import { BarChart3, Bot, Building2, Globe, LineChart, ShoppingCart, Tags, User, Users } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasCapability, type Capability } from "@/utils/capabilities";
import { all_admin_roles } from "@/utils/roles";
export type UsageOption =
  | "global"
  | "my-usage"
  | "organization"
  | "team"
  | "customer"
  | "tag"
  | "agent"
  | "user"
  | "user-agent-activity";
export interface UsageViewSelectProps {
  value: UsageOption;
  onChange: (value: UsageOption) => void;
  userRole: string | null;
  canViewTagUsage?: boolean;
  isOrgAdmin?: boolean;
  title?: string;
  description?: string;
  "data-id"?: string;
}
interface OptionConfig {
  value: UsageOption;
  label: string;
  labelKey: string;
  description: string;
  descriptionKey: string;
  icon: React.ReactNode;
  capability?: Capability;
  adminOnly?: boolean;
  showForAdmin?: string;
  showForAdminKey?: string;
  showForNonAdmin?: string;
  showForNonAdminKey?: string;
  descriptionForAdmin?: string;
  descriptionForAdminKey?: string;
  descriptionForNonAdmin?: string;
  descriptionForNonAdminKey?: string;
  badgeText?: string;
}
const OPTIONS: OptionConfig[] = [
  {
    value: "global",
    label: "Global Usage",
    labelKey: "usagePage.usageViewSelect.globalUsageLabel",
    showForAdmin: "Global Usage",
    showForAdminKey: "usagePage.usageViewSelect.globalUsageLabel",
    showForNonAdmin: "Your Usage",
    showForNonAdminKey: "usagePage.usageViewSelect.yourUsageLabel",
    description: "View usage across all resources",
    descriptionKey: "usagePage.usageViewSelect.globalUsageDesc",
    descriptionForAdmin: "View usage across all resources",
    descriptionForAdminKey: "usagePage.usageViewSelect.globalUsageDesc",
    descriptionForNonAdmin: "View your usage",
    descriptionForNonAdminKey: "usagePage.usageViewSelect.yourUsageDesc",
    icon: <Globe className="size-4" />,
  },
  {
    value: "my-usage",
    label: "Your Usage",
    labelKey: "usagePage.usageViewSelect.yourUsageLabel",
    description: "View your own usage",
    descriptionKey: "usagePage.usageViewSelect.myUsageDesc",
    icon: <User className="size-4" />,
    adminOnly: true,
  },
  {
    value: "organization",
    label: "Organization Usage",
    labelKey: "usagePage.usageViewSelect.organizationUsageLabel",
    description: "View usage across all organizations",
    descriptionKey: "usagePage.usageViewSelect.organizationUsageAdminDesc",
    icon: <Building2 className="size-4" />,
    capability: "viewOrganizationUsage",
  },
  {
    value: "team",
    label: "Team Usage",
    labelKey: "usagePage.usageViewSelect.teamUsageLabel",
    description: "View usage by team",
    descriptionKey: "usagePage.usageViewSelect.teamUsageDesc",
    icon: <Users className="size-4" />,
  },
  {
    value: "customer",
    label: "Customer Usage",
    labelKey: "usagePage.usageViewSelect.customerUsageLabel",
    description: "View usage by customer accounts",
    descriptionKey: "usagePage.usageViewSelect.customerUsageDesc",
    icon: <ShoppingCart className="size-4" />,
    adminOnly: true,
  },
  {
    value: "tag",
    label: "Tag Usage",
    labelKey: "usagePage.usageViewSelect.tagUsageLabel",
    description: "View usage grouped by tags",
    descriptionKey: "usagePage.usageViewSelect.tagUsageDesc",
    icon: <Tags className="size-4" />,
    adminOnly: true,
  },
  {
    value: "agent",
    label: "Agent Usage (A2A)",
    labelKey: "usagePage.usageViewSelect.agentUsageLabel",
    description: "View usage by AI agents",
    descriptionKey: "usagePage.usageViewSelect.agentUsageDesc",
    icon: <Bot className="size-4" />,
    capability: "viewAgentUsage",
  },
  {
    value: "user",
    label: "User Usage",
    labelKey: "usagePage.usageViewSelect.userUsageLabel",
    description: "View usage by individual users",
    descriptionKey: "usagePage.usageViewSelect.userUsageDesc",
    icon: <User className="size-4" />,
    adminOnly: true,
  },
  {
    value: "user-agent-activity",
    label: "User Agent Activity",
    labelKey: "usagePage.usageViewSelect.userAgentActivityLabel",
    description: "View detailed user agent activity logs",
    descriptionKey: "usagePage.usageViewSelect.userAgentActivityDesc",
    icon: <LineChart className="size-4" />,
    adminOnly: true,
  },
];
export const UsageViewSelect: React.FC<UsageViewSelectProps> = ({
  value,
  onChange,
  userRole,
  canViewTagUsage = false,
  isOrgAdmin = false,
  title,
  description,
  "data-id": dataId,
}) => {
  const { t } = useTranslation();
  const isAdmin = all_admin_roles.includes(userRole ?? "");
  const getFilteredOptions = () => {
    return OPTIONS.filter((option) => {
      if (option.capability) {
        return hasCapability(userRole, option.capability, isOrgAdmin);
      }
      if (option.value === "tag" && canViewTagUsage) {
        return true;
      }
      if (option.adminOnly && !isAdmin) {
        return false;
      }
      return true;
    }).map((option) => {
      let label = t(option.labelKey, { defaultValue: option.label });
      let desc = t(option.descriptionKey, { defaultValue: option.description });
      if (option.showForAdmin && option.showForNonAdmin) {
        label = t(isAdmin ? option.showForAdminKey ?? option.labelKey : option.showForNonAdminKey ?? option.labelKey, {
          defaultValue: isAdmin ? option.showForAdmin : option.showForNonAdmin,
        });
      }
      if (option.descriptionForAdmin && option.descriptionForNonAdmin) {
        desc = t(
          isAdmin
            ? option.descriptionForAdminKey ?? option.descriptionKey
            : option.descriptionForNonAdminKey ?? option.descriptionKey,
          { defaultValue: isAdmin ? option.descriptionForAdmin : option.descriptionForNonAdmin },
        );
      }
      return {
        value: option.value,
        label,
        description: desc,
        icon: option.icon,
        badgeText: option.badgeText,
      };
    });
  };
  const filteredOptions = getFilteredOptions();
  const selectedOption = filteredOptions.find((option) => option.value === value);
  return (
    <div className="w-full" data-id={dataId}>
      <div className="flex flex-wrap items-center justify-start gap-4">
        <div className="flex items-stretch gap-2 min-w-0">
          <div className="shrink-0 flex items-center">
            <BarChart3 className="size-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-0.5 leading-tight">
              {title ?? t("usagePage.usageViewSelect.title", { defaultValue: "Usage View" })}
            </h3>
            <p className="text-xs text-muted-foreground leading-tight">
              {description ??
                t("usagePage.usageViewSelect.description", { defaultValue: "Select the usage data you want to view" })}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <Select
            value={value}
            onValueChange={(next: UsageOption | null) => {
              if (next) onChange(next);
            }}
          >
            <SelectTrigger className="w-54 sm:w-64 md:w-72">
              <SelectValue>
                {selectedOption && (
                  <span className="flex items-center gap-2">
                    {selectedOption.icon}
                    <span className="text-sm">{selectedOption.label}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2 py-1">
                    <span className="shrink-0 mt-0.5">{option.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-foreground">{option.label}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{option.description}</span>
                    </span>
                    {option.badgeText && <Badge>{option.badgeText}</Badge>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
