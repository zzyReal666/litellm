import { buildLoginUrlWithReturn, getLoginUrl } from "@/utils/returnUrlUtils";

const CONSOLE_PATH = "/ui/";

export const consoleLoginUrl = (proxyBaseUrl: string | null | undefined): string => {
  const baseUrl = proxyBaseUrl ?? "";
  return buildLoginUrlWithReturn(getLoginUrl(baseUrl), `${baseUrl}${CONSOLE_PATH}`);
};
