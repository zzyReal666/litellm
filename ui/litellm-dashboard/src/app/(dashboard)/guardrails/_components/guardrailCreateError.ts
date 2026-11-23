import { ApiError } from "@/lib/http/client";

export type GuardrailCreateSuggestion =
  | "required"
  | "tooLong"
  | "invalidUrl"
  | "invalidJson"
  | "invalidValue"
  | "duplicate"
  | "generic";

export interface GuardrailCreateProblem {
  fieldLabel: string;
  reason: string;
  suggestion: GuardrailCreateSuggestion;
  formField: string | null;
}

export interface GuardrailCreateErrorReport {
  problems: GuardrailCreateProblem[];
  message: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface FieldDescriptor {
  key: string;
  formField: string | null;
}

const FIELD_DESCRIPTORS: Record<string, FieldDescriptor> = {
  guardrail_name: { key: "guardrailName", formField: "guardrail_name" },
  mode: { key: "mode", formField: "mode" },
  guardrail: { key: "provider", formField: "provider" },
  provider: { key: "provider", formField: "provider" },
  default_on: { key: "defaultOn", formField: "default_on" },
  api_base: { key: "apiBase", formField: "api_base" },
  api_key: { key: "apiKey", formField: "api_key" },
  api_version: { key: "apiVersion", formField: "api_version" },
  litellm_params: { key: "litellmParams", formField: null },
};

const FIELD_LABELS: Record<string, string> = {
  guardrailName: "Guardrail name",
  mode: "Mode",
  provider: "Provider",
  defaultOn: "Default on",
  apiBase: "API base",
  apiKey: "API key",
  apiVersion: "API version",
  litellmParams: "Guardrail parameters",
  field: "Field",
};

const SUGGESTION_LABELS: Record<GuardrailCreateSuggestion, string> = {
  required: "fill in this field before submitting",
  tooLong: "shorten the value to fit the maximum length",
  invalidUrl: "enter a valid URL starting with http:// or https://",
  invalidJson: "check the JSON syntax and try again",
  invalidValue: "pick one of the supported values",
  duplicate: "choose a unique name",
  generic: "correct this field and try again",
};

const suggestionFor = (type: string, reason: string): GuardrailCreateSuggestion => {
  const haystack = `${type} ${reason}`.toLowerCase();
  if (haystack.includes("missing") || haystack.includes("field required")) return "required";
  if (haystack.includes("too_long") || haystack.includes("max_length") || haystack.includes("maximum length")) {
    return "tooLong";
  }
  if (haystack.includes("url")) return "invalidUrl";
  if (haystack.includes("json")) return "invalidJson";
  if (haystack.includes("literal") || haystack.includes("enum") || haystack.includes("must be one of")) {
    return "invalidValue";
  }
  if (haystack.includes("already exists") || haystack.includes("duplicate") || haystack.includes("unique")) {
    return "duplicate";
  }
  return "generic";
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const parseBody = (error: unknown): unknown => {
  if (error instanceof ApiError) return error.body;
  if (error instanceof Error) {
    try {
      return JSON.parse(error.message);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const fieldPathOf = (loc: unknown): string[] => {
  if (!Array.isArray(loc)) return [];
  const segments = loc.filter((segment): segment is string => typeof segment === "string");
  return segments.filter((segment) => segment !== "body" && segment !== "query");
};

const humanizeSegment = (segment: string): string =>
  segment.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());

const problemFromDetail = (detail: unknown, t: Translate): GuardrailCreateProblem | null => {
  const record = asRecord(detail);
  if (!record) return null;
  const reason = typeof record.msg === "string" ? record.msg : "";
  if (reason === "") return null;
  const path = fieldPathOf(record.loc);
  const lastSegment = path.at(-1) ?? "";
  const descriptor = FIELD_DESCRIPTORS[lastSegment];
  const fieldKey = descriptor?.key ?? "field";
  const fallbackLabel = descriptor ? FIELD_LABELS[fieldKey] : humanizeSegment(lastSegment) || FIELD_LABELS.field;
  return {
    fieldLabel: t(`guardrails.addGuardrailForm.errorField.${fieldKey}`, { defaultValue: fallbackLabel }),
    reason,
    suggestion: suggestionFor(typeof record.type === "string" ? record.type : "", reason),
    formField: descriptor?.formField ?? null,
  };
};

const suggestionText = (suggestion: GuardrailCreateSuggestion, t: Translate): string =>
  t(`guardrails.addGuardrailForm.errorSuggestion.${suggestion}`, {
    defaultValue: SUGGESTION_LABELS[suggestion],
  });

const fallbackReason = (error: unknown): string => {
  const body = asRecord(parseBody(error));
  if (body) {
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  }
  if (error instanceof Error && error.message !== "") return error.message;
  return "";
};

export const buildGuardrailCreateErrorReport = (error: unknown, t: Translate): GuardrailCreateErrorReport => {
  const body = asRecord(parseBody(error));
  const details = body && Array.isArray(body.detail) ? body.detail : [];
  const problems = details
    .map((detail) => problemFromDetail(detail, t))
    .filter((problem): problem is GuardrailCreateProblem => problem !== null);

  if (problems.length > 0) {
    const rendered = problems
      .map((problem) =>
        t("guardrails.addGuardrailForm.createErrorDetail", {
          defaultValue: "{{field}}: {{reason}}. Suggestion: {{suggestion}}",
          field: problem.fieldLabel,
          reason: problem.reason,
          suggestion: suggestionText(problem.suggestion, t),
        }),
      )
      .join("; ");
    return {
      problems,
      message: t("guardrails.addGuardrailForm.createErrorSummary", {
        defaultValue: "Failed to create guardrail. {{details}}",
        details: rendered,
      }),
    };
  }

  const reason = fallbackReason(error);
  return {
    problems: [],
    message:
      reason === ""
        ? t("guardrails.addGuardrailForm.createErrorUnknown", {
            defaultValue: "Failed to create guardrail. Check the network and the form fields, then try again",
          })
        : t("guardrails.addGuardrailForm.createErrorGeneric", {
            defaultValue: "Failed to create guardrail: {{reason}}. Check the form fields and try again",
            reason,
          }),
  };
};
