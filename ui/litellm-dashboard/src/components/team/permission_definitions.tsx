import type { TFunction } from "i18next";

export interface PermissionInfo {
  method: string;
  endpoint: string;
  description: string;
  route: string;
}

/**
 * Map of permission endpoint patterns to their descriptions
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "/key/generate": "Member can generate a virtual key for this team",
  "/key/service-account/generate":
    "Member can generate a service account key (not belonging to any user) for this team",
  "/key/update": "Member can update a virtual key belonging to this team",
  "/key/delete": "Member can delete a virtual key belonging to this team",
  "/key/info": "Member can get info about a virtual key belonging to this team",
  "/key/regenerate": "Member can regenerate a virtual key belonging to this team",
  "/key/{key_id}/regenerate": "Member can regenerate a virtual key belonging to this team",
  "/key/list": "Member can list virtual keys belonging to this team",
  "/key/block": "Member can block a virtual key belonging to this team",
  "/key/unblock": "Member can unblock a virtual key belonging to this team",
  "/key/access_group_assignment": "Member can assign access groups to virtual keys for this team",
  "/team/daily/activity": "Member can view all team usage data (not just their own)",
  "/spend/logs": "Member can view spend logs for the entire team (not just their own)",
};

const PERMISSION_DESCRIPTION_KEYS: Record<string, string> = {
  "/key/generate": "teamPage.memberPermissions.permDescKeyGenerate",
  "/key/service-account/generate": "teamPage.memberPermissions.permDescKeyServiceAccountGenerate",
  "/key/update": "teamPage.memberPermissions.permDescKeyUpdate",
  "/key/delete": "teamPage.memberPermissions.permDescKeyDelete",
  "/key/info": "teamPage.memberPermissions.permDescKeyInfo",
  "/key/regenerate": "teamPage.memberPermissions.permDescKeyRegenerate",
  "/key/{key_id}/regenerate": "teamPage.memberPermissions.permDescKeyIdRegenerate",
  "/key/list": "teamPage.memberPermissions.permDescKeyList",
  "/key/block": "teamPage.memberPermissions.permDescKeyBlock",
  "/key/unblock": "teamPage.memberPermissions.permDescKeyUnblock",
  "/key/access_group_assignment": "teamPage.memberPermissions.permDescKeyAccessGroupAssignment",
  "/team/daily/activity": "teamPage.memberPermissions.permDescTeamDailyActivity",
  "/spend/logs": "teamPage.memberPermissions.permDescSpendLogs",
};

/**
 * Determines the HTTP method for a given permission endpoint
 */
export const getMethodForEndpoint = (endpoint: string): string => {
  if (
    endpoint.includes("/info") ||
    endpoint.includes("/list") ||
    endpoint.includes("/activity") ||
    endpoint === "/spend/logs"
  ) {
    return "GET";
  }
  return "POST";
};

/**
 * Parses a permission string into a structured PermissionInfo object
 */
export const getPermissionInfo = (permission: string, t: TFunction): PermissionInfo => {
  const method = getMethodForEndpoint(permission);
  const endpoint = permission;

  // Find exact match or fallback to default description
  let description = PERMISSION_DESCRIPTIONS[permission];
  let descriptionKey = PERMISSION_DESCRIPTION_KEYS[permission];

  // If no exact match, try to find a partial match based on patterns
  if (!description) {
    for (const [pattern, desc] of Object.entries(PERMISSION_DESCRIPTIONS)) {
      if (permission.includes(pattern)) {
        description = desc;
        descriptionKey = PERMISSION_DESCRIPTION_KEYS[pattern];
        break;
      }
    }
  }

  // Fallback if no match found
  if (!description) {
    return {
      method,
      endpoint,
      description: t("teamPage.memberPermissions.permDescFallback", {
        endpoint,
        defaultValue: `Access ${endpoint}`,
      }),
      route: permission,
    };
  }

  return {
    method,
    endpoint,
    description: t(descriptionKey, { defaultValue: description }),
    route: permission,
  };
};
