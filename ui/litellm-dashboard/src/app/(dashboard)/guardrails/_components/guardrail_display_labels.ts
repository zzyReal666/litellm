import i18n from "@/lib/i18n";

type LabelEntry = Readonly<{ key: string; defaultValue: string }>;

const MODE_LABELS: Readonly<Record<string, LabelEntry>> = {
  pre_call: { key: "guardrails.modes.preCall", defaultValue: "Before LLM call" },
  during_call: { key: "guardrails.modes.duringCall", defaultValue: "During LLM call" },
  post_call: { key: "guardrails.modes.postCall", defaultValue: "After LLM call" },
  logging_only: { key: "guardrails.modes.loggingOnly", defaultValue: "Logging only" },
  pre_mcp_call: { key: "guardrails.modes.preMcpCall", defaultValue: "Before MCP tool call" },
  during_mcp_call: { key: "guardrails.modes.duringMcpCall", defaultValue: "During MCP tool call" },
  post_mcp_call: { key: "guardrails.modes.postMcpCall", defaultValue: "After MCP tool call" },
};

type Translate = (key: string, options?: { defaultValue?: string }) => string;

export const guardrailModeLabel = (mode: string, translate: Translate = i18n.t.bind(i18n)): string => {
  const entry = MODE_LABELS[mode];
  return entry === undefined ? mode : translate(entry.key, { defaultValue: entry.defaultValue });
};

const VALUE_LABELS: Readonly<Record<string, LabelEntry>> = {
  allow: { key: "guardrails.providerParams.options.allow", defaultValue: "Allow" },
  deny: { key: "guardrails.providerParams.options.deny", defaultValue: "Deny" },
  block: { key: "guardrails.providerParams.options.block", defaultValue: "Block" },
  mask: { key: "guardrails.providerParams.options.mask", defaultValue: "Mask" },
  monitor: { key: "guardrails.providerParams.options.monitor", defaultValue: "Monitor" },
  rewrite: { key: "guardrails.providerParams.options.rewrite", defaultValue: "Rewrite" },
  block_only: { key: "guardrails.providerParams.options.blockOnly", defaultValue: "Block only" },
  inherit: { key: "guardrails.providerParams.options.inherit", defaultValue: "Use global default" },
  warn: { key: "guardrails.providerParams.options.warn", defaultValue: "Warn" },
  end_session: { key: "guardrails.providerParams.options.endSession", defaultValue: "End session" },
  input: { key: "guardrails.providerParams.options.input", defaultValue: "Input" },
  output: { key: "guardrails.providerParams.options.output", defaultValue: "Output" },
  both: { key: "guardrails.providerParams.options.both", defaultValue: "Both" },
  log: { key: "guardrails.providerParams.options.log", defaultValue: "Log only" },
  fail_open: { key: "guardrails.providerParams.options.failOpen", defaultValue: "Allow (no compression)" },
  fail_closed: { key: "guardrails.providerParams.options.failClosed", defaultValue: "Block (raise error)" },
  hate: { key: "guardrails.providerParams.options.hate", defaultValue: "Hate" },
  selfharm: { key: "guardrails.providerParams.options.selfHarm", defaultValue: "Self-harm" },
  sexual: { key: "guardrails.providerParams.options.sexual", defaultValue: "Sexual" },
  violence: { key: "guardrails.providerParams.options.violence", defaultValue: "Violence" },
};

export const guardrailValueLabel = (value: string): string => {
  const entry = VALUE_LABELS[value] ?? VALUE_LABELS[value.toLowerCase()];
  return entry === undefined ? value : i18n.t(entry.key, { defaultValue: entry.defaultValue });
};

const isChineseLanguage = (): boolean => i18n.language.toLowerCase().startsWith("zh");

export const providerParamFieldLabel = (fieldKey: string): string => {
  const key = `guardrails.providerParams.fields.${fieldKey}`;
  return i18n.exists(key) ? i18n.t(key) : fieldKey;
};

export const providerParamOptionLabel = (option: string): string => guardrailValueLabel(option);

export const providerParamDescription = (
  providerKey: string | null,
  fieldKey: string,
  englishDescription: string | undefined,
): string | undefined => {
  if (providerKey !== null) {
    const key = `guardrails.providerParams.descriptions.${providerKey}.${fieldKey}`;
    if (i18n.exists(key)) return i18n.t(key, { defaultValue: englishDescription });
  }
  return untranslatedDescription(englishDescription);
};

export const untranslatedDescription = (englishDescription: string | undefined): string | undefined => {
  if (englishDescription === undefined || englishDescription === "") return undefined;
  return isChineseLanguage() ? undefined : englishDescription;
};
