export type ConnectionIssueKind = "auth" | "notFound" | "timeout" | "rateLimit" | "network" | "unknown";

export interface ConnectionAdvice {
  readonly kind: ConnectionIssueKind;
  readonly titleKey: string;
  readonly suggestionKeys: readonly string[];
}

const ADVICE: Readonly<Record<ConnectionIssueKind, Omit<ConnectionAdvice, "kind">>> = {
  auth: {
    titleKey: "addModel.modelConnectionTest.troubleshooting.authTitle",
    suggestionKeys: [
      "addModel.modelConnectionTest.troubleshooting.authCheckKey",
      "addModel.modelConnectionTest.troubleshooting.authCheckProvider",
      "addModel.modelConnectionTest.troubleshooting.authCheckPermission",
    ],
  },
  notFound: {
    titleKey: "addModel.modelConnectionTest.troubleshooting.notFoundTitle",
    suggestionKeys: [
      "addModel.modelConnectionTest.troubleshooting.notFoundCheckApiBase",
      "addModel.modelConnectionTest.troubleshooting.notFoundCheckModel",
      "addModel.modelConnectionTest.troubleshooting.notFoundCheckProvider",
    ],
  },
  timeout: {
    titleKey: "addModel.modelConnectionTest.troubleshooting.timeoutTitle",
    suggestionKeys: [
      "addModel.modelConnectionTest.troubleshooting.timeoutCheckNetwork",
      "addModel.modelConnectionTest.troubleshooting.timeoutCheckProxy",
      "addModel.modelConnectionTest.troubleshooting.timeoutCheckLimit",
    ],
  },
  rateLimit: {
    titleKey: "addModel.modelConnectionTest.troubleshooting.rateLimitTitle",
    suggestionKeys: [
      "addModel.modelConnectionTest.troubleshooting.rateLimitWait",
      "addModel.modelConnectionTest.troubleshooting.rateLimitCheckQuota",
      "addModel.modelConnectionTest.troubleshooting.rateLimitCheckLimits",
    ],
  },
  network: {
    titleKey: "addModel.modelConnectionTest.troubleshooting.networkTitle",
    suggestionKeys: [
      "addModel.modelConnectionTest.troubleshooting.networkCheckUrl",
      "addModel.modelConnectionTest.troubleshooting.networkCheckProxy",
      "addModel.modelConnectionTest.troubleshooting.networkCheckDns",
    ],
  },
  unknown: {
    titleKey: "addModel.modelConnectionTest.troubleshooting.unknownTitle",
    suggestionKeys: [
      "addModel.modelConnectionTest.troubleshooting.unknownCheckDetails",
      "addModel.modelConnectionTest.troubleshooting.unknownCheckParams",
      "addModel.modelConnectionTest.troubleshooting.unknownCheckCredential",
    ],
  },
};

export const classifyConnectionIssue = (message: string): ConnectionIssueKind => {
  if (/429|rate.?limit|too many requests|quota/i.test(message)) return "rateLimit";
  if (/401|403|unauthor|invalid\s*(api[\s_-]*)?key|authentication|permission denied/i.test(message)) return "auth";
  if (/404|not found|does not exist|no such model|model.*not.*found/i.test(message)) return "notFound";
  if (/timeout|timed out|etimedout|deadline exceeded/i.test(message)) return "timeout";
  if (/enotfound|econnrefused|network|connection refused|getaddrinfo|ssl|certificate/i.test(message)) return "network";
  return "unknown";
};

export const connectionAdvice = (message: string): ConnectionAdvice => {
  const kind = classifyConnectionIssue(message);
  return { kind, ...ADVICE[kind] };
};