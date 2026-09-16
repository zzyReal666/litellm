import type { TFunction } from "i18next";

export const ALL_PROXY_MODELS = "all-proxy-models";
export const NO_DEFAULT_MODELS = "no-default-models";

export interface TeamAccessGroupModelGrant {
  access_group_id: string;
  access_group_name: string;
  models: string[];
  mcp_server_ids?: string[];
  agent_ids?: string[];
}

export type TeamModelBadgeKind = "all-proxy" | "no-default" | "direct" | "access-group";

export interface TeamModelBadge {
  label: string;
  kind: TeamModelBadgeKind;
  tooltip: string;
}

export function normalizeTeamModelSelection(models: string[] | undefined): string[] {
  return models && models.length > 0 ? models : [NO_DEFAULT_MODELS];
}

export const describeGroups = (names: string[]): string =>
  names.length > 1 ? `access groups ${names.join(", ")}` : `access group ${names[0]}`;

export function computeTeamModelBadges(
  models: string[],
  accessGroupModels: string[],
  accessGroupDetails: TeamAccessGroupModelGrant[] | undefined,
  t: TFunction,
): TeamModelBadge[] {
  const grants = accessGroupDetails ?? [];
  const groupNamesFor = (model: string): string[] =>
    grants.filter((g) => g.models.includes(model)).map((g) => g.access_group_name);
  const viaGroups = (model: string): string => {
    const names = groupNamesFor(model);
    return names.length > 0
      ? describeGroups(names)
      : t("teamPage.teamModelAccess.anAccessGroup", { defaultValue: "an access group" });
  };

  const allProxy = models.length === 0 || models.includes(ALL_PROXY_MODELS);
  const directModels = allProxy ? [] : models.filter((m) => m !== NO_DEFAULT_MODELS);
  const groupModels = [...new Set(grants.length > 0 ? grants.flatMap((g) => g.models) : accessGroupModels)].filter(
    (m) => !directModels.includes(m),
  );

  const allProxyBadge: TeamModelBadge = {
    label: t("teamPage.teamInfo.allProxyModels", { defaultValue: "All proxy models" }),
    kind: "all-proxy",
    tooltip: models.includes(ALL_PROXY_MODELS)
      ? t("teamPage.teamModelAccess.allProxyFromEntry", {
          defaultValue: "Granted by the All Proxy Models entry in the team's model list",
        })
      : t("teamPage.teamModelAccess.allProxyEmptyList", {
          defaultValue: "The team's model list is empty, so it can access every model on the proxy",
        }),
  };
  const noDefaultBadge: TeamModelBadge = {
    label: t("teamPage.teamModelAccess.noDefaultModels", { defaultValue: "No default models" }),
    kind: "no-default",
    tooltip: t("teamPage.teamModelAccess.noDefaultTooltip", {
      defaultValue: "No models are granted directly. Access comes only from access groups",
    }),
  };
  const headBadge = (): TeamModelBadge[] => {
    if (allProxy) return [allProxyBadge];
    if (models.includes(NO_DEFAULT_MODELS)) return [noDefaultBadge];
    return [];
  };

  return [
    ...headBadge(),
    ...directModels.map(
      (m): TeamModelBadge => ({
        label: m,
        kind: "direct",
        tooltip:
          groupNamesFor(m).length > 0
            ? t("teamPage.teamModelAccess.grantedDirectlyAndVia", {
                source: viaGroups(m),
                defaultValue: "Granted directly in the team's model list, and also via {{source}}",
              })
            : t("teamPage.teamModelAccess.grantedDirectly", {
                defaultValue: "Granted directly in the team's model list",
              }),
      }),
    ),
    ...groupModels.map(
      (m): TeamModelBadge => ({
        label: m,
        kind: "access-group",
        tooltip: t("teamPage.teamModelAccess.grantedVia", {
          source: viaGroups(m),
          defaultValue: "Granted via {{source}}",
        }),
      }),
    ),
  ];
}
