import type { EntityType } from "@/components/EntityUsageExport/types";

export const ENTITY_NAME_KEYS: Record<EntityType, readonly [string, string]> = {
  tag: ["usagePage.entityUsage.entityTag", "usagePage.entityUsage.entityTagLower"],
  team: ["usagePage.entityUsage.entityTeam", "usagePage.entityUsage.entityTeamLower"],
  organization: ["usagePage.entityUsage.entityOrganization", "usagePage.entityUsage.entityOrganizationLower"],
  customer: ["usagePage.entityUsage.entityCustomer", "usagePage.entityUsage.entityCustomerLower"],
  agent: ["usagePage.entityUsage.entityAgent", "usagePage.entityUsage.entityAgentLower"],
  user: ["usagePage.entityUsage.entityUser", "usagePage.entityUsage.entityUserLower"],
};
