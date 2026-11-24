import i18n from "@/lib/i18n";

const ROLE_KEYS: Readonly<Record<string, string>> = {
  proxy_admin: "ssoModals.roleProxyAdmin",
  proxy_admin_viewer: "ssoModals.roleAdminViewer",
  internal_user: "ssoModals.roleInternalUser",
  internal_user_viewer: "ssoModals.roleInternalViewer",
};

export const roleLabel = (role: string | null | undefined, fallback?: string): string => {
  if (!role) {
    return fallback ?? "-";
  }
  const key = ROLE_KEYS[role];
  return key ? i18n.t(key, { defaultValue: fallback ?? role }) : (fallback ?? role);
};
