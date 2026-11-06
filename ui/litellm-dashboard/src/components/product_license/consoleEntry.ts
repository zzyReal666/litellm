import { buildLoginUrlWithReturn, getLoginUrl } from "@/utils/returnUrlUtils";

const CONSOLE_PATH = "/ui/";

export const FORCE_LOGIN_PARAM = "force_login";

export const consoleLoginUrl = (proxyBaseUrl: string | null | undefined): string => {
  const baseUrl = proxyBaseUrl ?? "";
  const loginUrl = buildLoginUrlWithReturn(getLoginUrl(baseUrl), `${baseUrl}${CONSOLE_PATH}`);
  const separator = loginUrl.includes("?") ? "&" : "?";
  return `${loginUrl}${separator}${FORCE_LOGIN_PARAM}=1`;
};
