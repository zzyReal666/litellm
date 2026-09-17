import type { TFunction } from "i18next";

export interface GuardrailPreset {
  provider: string;
  categoryName?: string;
  guardrailNameSuggestion: string;
  mode: string;
  defaultOn: boolean;
}

export const getGuardrailPresets = (t: TFunction): Record<string, GuardrailPreset> => ({
  // ── LiteLLM Content Filter: Content Categories ──
  cf_denied_financial: {
    provider: "LitellmContentFilter",
    categoryName: "denied_financial_advice",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfDeniedFinancial.name", {
      defaultValue: "Denied Financial Advice",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_denied_legal: {
    provider: "LitellmContentFilter",
    categoryName: "denied_legal_advice",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfDeniedLegal.name", {
      defaultValue: "Denied Legal Advice",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_denied_medical: {
    provider: "LitellmContentFilter",
    categoryName: "denied_medical_advice",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfDeniedMedical.name", {
      defaultValue: "Denied Medical Advice",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_denied_insults: {
    provider: "LitellmContentFilter",
    categoryName: "denied_insults",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfDeniedInsults.name", {
      defaultValue: "Insults & Personal Attacks",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_harmful_violence: {
    provider: "LitellmContentFilter",
    categoryName: "harmful_violence",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfHarmfulViolence.name", {
      defaultValue: "Harmful Violence",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_harmful_self_harm: {
    provider: "LitellmContentFilter",
    categoryName: "harmful_self_harm",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfHarmfulSelfHarm.name", {
      defaultValue: "Harmful Self-Harm",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_harmful_child_safety: {
    provider: "LitellmContentFilter",
    categoryName: "harmful_child_safety",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfHarmfulChildSafety.name", {
      defaultValue: "Harmful Child Safety",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_harmful_illegal_weapons: {
    provider: "LitellmContentFilter",
    categoryName: "harmful_illegal_weapons",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfHarmfulIllegalWeapons.name", {
      defaultValue: "Harmful Illegal Weapons",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_bias_gender: {
    provider: "LitellmContentFilter",
    categoryName: "bias_gender",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfBiasGender.name", { defaultValue: "Bias: Gender" }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_bias_racial: {
    provider: "LitellmContentFilter",
    categoryName: "bias_racial",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfBiasRacial.name", { defaultValue: "Bias: Racial" }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_bias_religious: {
    provider: "LitellmContentFilter",
    categoryName: "bias_religious",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfBiasReligious.name", {
      defaultValue: "Bias: Religious",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_bias_sexual_orientation: {
    provider: "LitellmContentFilter",
    categoryName: "bias_sexual_orientation",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfBiasSexualOrientation.name", {
      defaultValue: "Bias: Sexual Orientation",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_jailbreak: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_jailbreak",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfPromptInjectionJailbreak.name", {
      defaultValue: "Prompt Injection: Jailbreak",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_data_exfil: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_data_exfiltration",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfPromptInjectionDataExfil.name", {
      defaultValue: "Prompt Injection: Data Exfiltration",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_sql: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_sql",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfPromptInjectionSql.name", {
      defaultValue: "Prompt Injection: SQL",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_malicious_code: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_malicious_code",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfPromptInjectionMaliciousCode.name", {
      defaultValue: "Prompt Injection: Malicious Code",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_prompt_injection_system_prompt: {
    provider: "LitellmContentFilter",
    categoryName: "prompt_injection_system_prompt",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfPromptInjectionSystemPrompt.name", {
      defaultValue: "Prompt Injection: System Prompt",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_toxic_abuse: {
    provider: "LitellmContentFilter",
    categoryName: "harm_toxic_abuse",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfToxicAbuse.name", {
      defaultValue: "Toxic & Abusive Language",
    }),
    mode: "pre_call",
    defaultOn: false,
  },

  // ── LiteLLM Content Filter: Patterns & Keywords (no category) ──
  cf_patterns: {
    provider: "LitellmContentFilter",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfPatterns.name", { defaultValue: "Pattern Matching" }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_keywords: {
    provider: "LitellmContentFilter",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfKeywords.name", { defaultValue: "Keyword Blocking" }),
    mode: "pre_call",
    defaultOn: false,
  },
  block_code_execution: {
    provider: "BlockCodeExecution",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.blockCodeExecution.name", {
      defaultValue: "Block Code Execution",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  cf_competitor_intent: {
    provider: "LitellmContentFilter",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.cfCompetitorIntent.name", {
      defaultValue: "Competitor Name Blocking",
    }),
    mode: "pre_call",
    defaultOn: false,
  },

  // ── Partner Guardrails ──
  presidio: {
    provider: "PresidioPII",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.presidio.name", { defaultValue: "Presidio PII" }),
    mode: "pre_call",
    defaultOn: false,
  },
  bedrock: {
    provider: "Bedrock",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.bedrock.name", { defaultValue: "Bedrock Guardrail" }),
    mode: "pre_call",
    defaultOn: false,
  },
  lakera: {
    provider: "Lakera",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.lakera.name", { defaultValue: "Lakera" }),
    mode: "pre_call",
    defaultOn: false,
  },
  openai_moderation: {
    provider: "OpenaiModeration",
    guardrailNameSuggestion: t("guardrails.guardrailGardenPresets.openaiModerationName", {
      defaultValue: "OpenAI Moderation",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  google_model_armor: {
    provider: "ModelArmor",
    guardrailNameSuggestion: t("guardrails.guardrailGardenPresets.googleModelArmorName", {
      defaultValue: "Google Cloud Model Armor",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  guardrails_ai: {
    provider: "GuardrailsAi",
    guardrailNameSuggestion: t("guardrails.guardrailGardenPresets.guardrailsAiName", {
      defaultValue: "Guardrails AI",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  zscaler: {
    provider: "ZscalerAiGuard",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.zscaler.name", { defaultValue: "Zscaler AI Guard" }),
    mode: "pre_call",
    defaultOn: false,
  },
  panw: {
    provider: "PanwPrismaAirs",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.panw.name", { defaultValue: "PANW Prisma AIRS" }),
    mode: "pre_call",
    defaultOn: false,
  },
  cisco_ai_defense: {
    provider: "CiscoAiDefense",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.ciscoAiDefense.name", {
      defaultValue: "Cisco AI Defense",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  noma: {
    provider: "Noma",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.noma.name", { defaultValue: "Noma Security" }),
    mode: "pre_call",
    defaultOn: false,
  },
  aporia: {
    provider: "AporiaAi",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.aporia.name", { defaultValue: "Aporia AI" }),
    mode: "pre_call",
    defaultOn: false,
  },
  aim: {
    provider: "Aim",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.aim.name", { defaultValue: "AIM Guardrail" }),
    mode: "pre_call",
    defaultOn: false,
  },
  cato_networks: {
    provider: "Cato Networks",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.catoNetworks.name", {
      defaultValue: "Cato Networks Guardrail",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  prompt_security: {
    provider: "PromptSecurity",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.promptSecurity.name", {
      defaultValue: "Prompt Security",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  lasso: {
    provider: "Lasso",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.lasso.name", { defaultValue: "Lasso Guardrail" }),
    mode: "pre_call",
    defaultOn: false,
  },
  pangea: {
    provider: "Pangea",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.pangea.name", { defaultValue: "Pangea Guardrail" }),
    mode: "pre_call",
    defaultOn: false,
  },
  enkryptai: {
    provider: "Enkryptai",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.enkryptai.name", { defaultValue: "EnkryptAI" }),
    mode: "pre_call",
    defaultOn: false,
  },
  javelin: {
    provider: "Javelin",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.javelin.name", { defaultValue: "Javelin Guardrails" }),
    mode: "pre_call",
    defaultOn: false,
  },
  pillar: {
    provider: "Pillar",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.pillar.name", { defaultValue: "Pillar Guardrail" }),
    mode: "pre_call",
    defaultOn: false,
  },
  akto: {
    provider: "Akto",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.akto.name", { defaultValue: "Akto Guardrail" }),
    mode: "pre_call",
    defaultOn: false,
  },
  promptguard: {
    provider: "Promptguard",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.promptguard.name", { defaultValue: "PromptGuard" }),
    mode: "pre_call",
    defaultOn: false,
  },
  xecguard: {
    provider: "Xecguard",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.xecguard.name", { defaultValue: "XecGuard" }),
    mode: "pre_call",
    defaultOn: false,
  },
  deepkeep: {
    provider: "Deepkeep",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.deepkeep.name", {
      defaultValue: "DeepKeep AI Firewall",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  repelloai: {
    provider: "Repelloai",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.repelloai.name", { defaultValue: "RepelloAI Argus" }),
    mode: "pre_call",
    defaultOn: false,
  },
  straiker: {
    provider: "Straiker",
    guardrailNameSuggestion: t("guardrails.guardrailGardenPresets.straikerName", {
      defaultValue: "Straiker Guardrail",
    }),
    mode: "pre_call",
    defaultOn: false,
  },
  alice: {
    provider: "Alice",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.alice.name", { defaultValue: "Alice" }),
    mode: "pre_call",
    defaultOn: false,
  },
  conduct: {
    provider: "Conduct",
    guardrailNameSuggestion: t("guardrails.guardrailGardenCards.conduct.name", { defaultValue: "Conduct Guard" }),
    mode: "pre_call",
    defaultOn: false,
  },
});
