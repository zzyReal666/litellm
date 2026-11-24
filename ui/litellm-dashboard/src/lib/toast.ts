import type { ReactNode } from "react";
import { toast as sonner } from "sonner";
import i18n from "@/lib/i18n";
import { ApiError, deriveErrorMessage, unwrapProxyErrorMessage } from "@/lib/http/client";

export type ToastKind = "success" | "info" | "warning" | "error";

export type ToastOptions = {
  readonly description?: ReactNode;
  readonly durationMs?: number;
};

type ErrorFacts = {
  readonly status: number | undefined;
  readonly proxyType: string | undefined;
  readonly text: string;
};

const DEFAULT_DURATION_MS: Readonly<Record<ToastKind, number>> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 6000,
};

interface ToastTitle {
  readonly key: string;
  readonly fallback: string;
}

const PROXY_TYPE_TITLES: Readonly<Record<string, ToastTitle>> = {
  budget_exceeded: { key: "toast.titles.budgetExceeded", fallback: "Budget Exceeded" },
  no_db_connection: { key: "toast.titles.noDbConnection", fallback: "Service Unavailable" },
  expired_key: { key: "toast.titles.authenticationError", fallback: "Authentication Error" },
  token_not_found_in_db: { key: "toast.titles.authenticationError", fallback: "Authentication Error" },
  team_member_permission_error: { key: "toast.titles.accessDenied", fallback: "Access Denied" },
  not_found_error: { key: "toast.titles.notFound", fallback: "Not Found" },
  validation_error: { key: "toast.titles.validationError", fallback: "Validation Error" },
  bad_request_error: { key: "toast.titles.requestError", fallback: "Request Error" },
  team_member_already_in_team: { key: "toast.titles.alreadyExists", fallback: "Already Exists" },
};

const STATUS_TITLES: Readonly<Record<number, ToastTitle>> = {
  400: { key: "toast.titles.requestError", fallback: "Request Error" },
  401: { key: "toast.titles.authenticationError", fallback: "Authentication Error" },
  403: { key: "toast.titles.accessDenied", fallback: "Access Denied" },
  404: { key: "toast.titles.notFound", fallback: "Not Found" },
  409: { key: "toast.titles.alreadyExists", fallback: "Already Exists" },
  422: { key: "toast.titles.validationError", fallback: "Validation Error" },
  429: { key: "toast.titles.rateLimitExceeded", fallback: "Rate Limit Exceeded" },
  503: { key: "toast.titles.serviceUnavailable", fallback: "Service Unavailable" },
};

const ACCESS_DENIED_TITLE = { key: "toast.titles.accessDenied", fallback: "Access Denied" } as const;
const ERROR_TITLE = { key: "toast.titles.error", fallback: "Error" } as const;
const SERVER_ERROR_TITLE = { key: "toast.titles.serverError", fallback: "Server Error" } as const;
const REQUEST_ERROR_TITLE = { key: "toast.titles.requestError", fallback: "Request Error" } as const;

const WARNING_TITLE_KEYS: ReadonlySet<string> = new Set(["toast.titles.budgetExceeded", "toast.titles.rateLimitExceeded"]);

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined;

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const toStatus = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  return undefined;
};

const proxyEnvelope = (payload: unknown): Record<string, unknown> | undefined => {
  const record = asRecord(payload);
  return asRecord(record?.error) ?? record;
};

const proxyTypeOf = (payload: unknown): string | undefined => {
  const type = proxyEnvelope(payload)?.type;
  return typeof type === "string" ? type : undefined;
};

const EMBEDDED_JSON = /\{[\s\S]*\}/;

const describeText = (text: string): ErrorFacts => {
  const embedded = text.match(EMBEDDED_JSON)?.[0];
  const parsed = embedded === undefined ? undefined : parseJson(embedded);
  if (embedded === undefined || asRecord(parsed) === undefined) {
    return { status: undefined, proxyType: undefined, text: unwrapProxyErrorMessage(text) };
  }
  return {
    status: toStatus(proxyEnvelope(parsed)?.code),
    proxyType: proxyTypeOf(parsed),
    text: text.replace(embedded, unwrapProxyErrorMessage(deriveErrorMessage(parsed))).trim(),
  };
};

const describeError = (input: unknown): ErrorFacts => {
  if (input instanceof ApiError) {
    return { status: input.status, proxyType: proxyTypeOf(input.body), text: unwrapProxyErrorMessage(input.message) };
  }
  if (input instanceof Error || typeof input === "string") {
    return describeText(input instanceof Error ? input.message : input);
  }
  const record = asRecord(input) ?? {};
  const response = asRecord(record.response);
  const payload = asRecord(response?.data) ?? record;
  return {
    status:
      toStatus(response?.status) ??
      toStatus(record.status_code) ??
      toStatus(record.code) ??
      toStatus(proxyEnvelope(payload)?.code),
    proxyType: proxyTypeOf(payload),
    text: unwrapProxyErrorMessage(deriveErrorMessage(payload)),
  };
};

const titleForStatus = (status: number): ToastTitle => {
  const known = STATUS_TITLES[status];
  if (known !== undefined) return known;
  if (status >= 500) return SERVER_ERROR_TITLE;
  if (status >= 400) return REQUEST_ERROR_TITLE;
  return ERROR_TITLE;
};

const titleFor = ({ status, proxyType }: ErrorFacts): ToastTitle => {
  if (proxyType?.endsWith("_access_denied")) return ACCESS_DENIED_TITLE;
  const byType = proxyType === undefined ? undefined : PROXY_TYPE_TITLES[proxyType];
  if (byType !== undefined) return byType;
  return status === undefined ? ERROR_TITLE : titleForStatus(status);
};

const show = (kind: ToastKind, message: ReactNode, options?: ToastOptions): void => {
  sonner[kind](message, {
    description: options?.description,
    duration: options?.durationMs ?? DEFAULT_DURATION_MS[kind],
  });
};

export const toast = {
  success: (message: ReactNode, options?: ToastOptions): void => show("success", message, options),
  info: (message: ReactNode, options?: ToastOptions): void => show("info", message, options),
  warning: (message: ReactNode, options?: ToastOptions): void => show("warning", message, options),
  error: (message: ReactNode, options?: ToastOptions): void => show("error", message, options),
  fromError: (input: unknown, options?: ToastOptions): void => {
    const facts = describeError(input);
    const title = titleFor(facts);
    show(WARNING_TITLE_KEYS.has(title.key) ? "warning" : "error", i18n.t(title.key, { defaultValue: title.fallback }), {
      description: facts.text,
      ...options,
    });
  },
  dismiss: (): void => {
    sonner.dismiss();
  },
} as const;
