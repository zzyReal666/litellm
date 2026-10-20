import type { TFunction } from "i18next";
import { guardrailLogoMap } from "./guardrail_info_helpers";

export interface GuardrailCardInfo {
  id: string;
  name: string;
  description: string;
  category: "litellm" | "partner";
  subcategory?: string;
  logo: string;
  tags: string[];
  eval?: {
    f1: number;
    precision: number;
    recall: number;
    testCases: number;
    latency: string;
  };
  providerKey?: string;
}

const litellmContentFilterLogo = guardrailLogoMap["LiteLLM Content Filter"];

export const getLitellmContentFilterCards = (t: TFunction): GuardrailCardInfo[] => [
  {
    id: "cf_denied_financial",
    name: t("guardrails.guardrailGardenCards.cfDeniedFinancial.name", {
      defaultValue: "Denied Financial Advice",
    }),
    description: t("guardrails.guardrailGardenCards.cfDeniedFinancial.desc", {
      defaultValue:
        "Detects requests for personalized financial advice, investment recommendations, or financial planning.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.topicBlocker", { defaultValue: "Topic Blocker" }),
    ],
    eval: {
      f1: 100.0,
      precision: 100.0,
      recall: 100.0,
      testCases: 207,
      latency: "<0.1ms",
    },
  },
  {
    id: "cf_denied_insults",
    name: t("guardrails.guardrailGardenCards.cfDeniedInsults.name", { defaultValue: "Insults & Personal Attacks" }),
    description: t("guardrails.guardrailGardenCards.cfDeniedInsults.desc", {
      defaultValue:
        "Detects insults, name-calling, and personal attacks directed at the chatbot, staff, or other people.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.topicBlocker", { defaultValue: "Topic Blocker" }),
    ],
    eval: {
      f1: 100.0,
      precision: 100.0,
      recall: 100.0,
      testCases: 299,
      latency: "<0.1ms",
    },
  },
  {
    id: "cf_denied_legal",
    name: t("guardrails.guardrailGardenCards.cfDeniedLegal.name", { defaultValue: "Denied Legal Advice" }),
    description: t("guardrails.guardrailGardenCards.cfDeniedLegal.desc", {
      defaultValue: "Detects requests for unauthorized legal advice, case analysis, or legal recommendations.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.topicBlocker", { defaultValue: "Topic Blocker" }),
    ],
  },
  {
    id: "cf_denied_medical",
    name: t("guardrails.guardrailGardenCards.cfDeniedMedical.name", { defaultValue: "Denied Medical Advice" }),
    description: t("guardrails.guardrailGardenCards.cfDeniedMedical.desc", {
      defaultValue: "Detects requests for medical diagnosis, treatment recommendations, or health advice.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.topicBlocker", { defaultValue: "Topic Blocker" }),
    ],
  },
  {
    id: "cf_harmful_violence",
    name: t("guardrails.guardrailGardenCards.cfHarmfulViolence.name", { defaultValue: "Harmful Violence" }),
    description: t("guardrails.guardrailGardenCards.cfHarmfulViolence.desc", {
      defaultValue: "Detects content related to violence, criminal planning, attacks, and violent threats.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.safety", { defaultValue: "Safety" }),
    ],
  },
  {
    id: "cf_harmful_self_harm",
    name: t("guardrails.guardrailGardenCards.cfHarmfulSelfHarm.name", { defaultValue: "Harmful Self-Harm" }),
    description: t("guardrails.guardrailGardenCards.cfHarmfulSelfHarm.desc", {
      defaultValue: "Detects content related to self-harm, suicide, and dangerous self-destructive behavior.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.safety", { defaultValue: "Safety" }),
    ],
  },
  {
    id: "cf_harmful_child_safety",
    name: t("guardrails.guardrailGardenCards.cfHarmfulChildSafety.name", { defaultValue: "Harmful Child Safety" }),
    description: t("guardrails.guardrailGardenCards.cfHarmfulChildSafety.desc", {
      defaultValue: "Detects content that could endanger child safety or exploit minors.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.safety", { defaultValue: "Safety" }),
    ],
  },
  {
    id: "cf_harmful_illegal_weapons",
    name: t("guardrails.guardrailGardenCards.cfHarmfulIllegalWeapons.name", {
      defaultValue: "Harmful Illegal Weapons",
    }),
    description: t("guardrails.guardrailGardenCards.cfHarmfulIllegalWeapons.desc", {
      defaultValue: "Detects content related to illegal weapons manufacturing, distribution, or acquisition.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.safety", { defaultValue: "Safety" }),
    ],
  },
  {
    id: "cf_bias_gender",
    name: t("guardrails.guardrailGardenCards.cfBiasGender.name", { defaultValue: "Bias: Gender" }),
    description: t("guardrails.guardrailGardenCards.cfBiasGender.desc", {
      defaultValue: "Detects gender-based discrimination, stereotypes, and biased language.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.bias", { defaultValue: "Bias" }),
    ],
  },
  {
    id: "cf_bias_racial",
    name: t("guardrails.guardrailGardenCards.cfBiasRacial.name", { defaultValue: "Bias: Racial" }),
    description: t("guardrails.guardrailGardenCards.cfBiasRacial.desc", {
      defaultValue: "Detects racial discrimination, stereotypes, and racially biased content.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.bias", { defaultValue: "Bias" }),
    ],
  },
  {
    id: "cf_bias_religious",
    name: t("guardrails.guardrailGardenCards.cfBiasReligious.name", { defaultValue: "Bias: Religious" }),
    description: t("guardrails.guardrailGardenCards.cfBiasReligious.desc", {
      defaultValue: "Detects religious discrimination, intolerance, and religiously biased content.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.bias", { defaultValue: "Bias" }),
    ],
  },
  {
    id: "cf_bias_sexual_orientation",
    name: t("guardrails.guardrailGardenCards.cfBiasSexualOrientation.name", {
      defaultValue: "Bias: Sexual Orientation",
    }),
    description: t("guardrails.guardrailGardenCards.cfBiasSexualOrientation.desc", {
      defaultValue: "Detects discrimination based on sexual orientation and related biased content.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.bias", { defaultValue: "Bias" }),
    ],
  },
  {
    id: "cf_prompt_injection_jailbreak",
    name: t("guardrails.guardrailGardenCards.cfPromptInjectionJailbreak.name", {
      defaultValue: "Prompt Injection: Jailbreak",
    }),
    description: t("guardrails.guardrailGardenCards.cfPromptInjectionJailbreak.desc", {
      defaultValue: "Detects jailbreak attempts designed to bypass AI safety guidelines and restrictions.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
    ],
  },
  {
    id: "cf_prompt_injection_data_exfil",
    name: t("guardrails.guardrailGardenCards.cfPromptInjectionDataExfil.name", {
      defaultValue: "Prompt Injection: Data Exfiltration",
    }),
    description: t("guardrails.guardrailGardenCards.cfPromptInjectionDataExfil.desc", {
      defaultValue: "Detects attempts to extract sensitive data through prompt manipulation.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
    ],
  },
  {
    id: "cf_prompt_injection_sql",
    name: t("guardrails.guardrailGardenCards.cfPromptInjectionSql.name", { defaultValue: "Prompt Injection: SQL" }),
    description: t("guardrails.guardrailGardenCards.cfPromptInjectionSql.desc", {
      defaultValue: "Detects SQL injection attempts embedded in prompts.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
    ],
  },
  {
    id: "cf_prompt_injection_malicious_code",
    name: t("guardrails.guardrailGardenCards.cfPromptInjectionMaliciousCode.name", {
      defaultValue: "Prompt Injection: Malicious Code",
    }),
    description: t("guardrails.guardrailGardenCards.cfPromptInjectionMaliciousCode.desc", {
      defaultValue: "Detects attempts to inject malicious code through prompts.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
    ],
  },
  {
    id: "cf_prompt_injection_system_prompt",
    name: t("guardrails.guardrailGardenCards.cfPromptInjectionSystemPrompt.name", {
      defaultValue: "Prompt Injection: System Prompt",
    }),
    description: t("guardrails.guardrailGardenCards.cfPromptInjectionSystemPrompt.desc", {
      defaultValue: "Detects attempts to extract or override system prompts.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
    ],
  },
  {
    id: "cf_toxic_abuse",
    name: t("guardrails.guardrailGardenCards.cfToxicAbuse.name", { defaultValue: "Toxic & Abusive Language" }),
    description: t("guardrails.guardrailGardenCards.cfToxicAbuse.desc", {
      defaultValue: "Detects toxic, abusive, and hateful language across multiple languages (EN, AU, DE, ES, FR).",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.toxicity", { defaultValue: "Toxicity" }),
    ],
  },
  {
    id: "cf_patterns",
    name: t("guardrails.guardrailGardenCards.cfPatterns.name", { defaultValue: "Pattern Matching" }),
    description: t("guardrails.guardrailGardenCards.cfPatterns.desc", {
      defaultValue:
        "Detect and block sensitive data patterns like SSNs, credit card numbers, API keys, and custom regex patterns.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.patterns", { defaultValue: "Patterns" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.pii", { defaultValue: "PII" }),
      t("guardrails.guardrailGardenCards.tags.regex", { defaultValue: "Regex" }),
      t("guardrails.guardrailGardenCards.tags.dataProtection", { defaultValue: "Data Protection" }),
    ],
  },
  {
    id: "cf_keywords",
    name: t("guardrails.guardrailGardenCards.cfKeywords.name", { defaultValue: "Keyword Blocking" }),
    description: t("guardrails.guardrailGardenCards.cfKeywords.desc", {
      defaultValue:
        "Block or mask content containing specific keywords or phrases. Upload custom word lists or add individual terms.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.keywords", { defaultValue: "Keywords" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.keywords", { defaultValue: "Keywords" }),
      t("guardrails.guardrailGardenCards.tags.blocklist", { defaultValue: "Blocklist" }),
    ],
  },
  {
    id: "block_code_execution",
    name: t("guardrails.guardrailGardenCards.blockCodeExecution.name", { defaultValue: "Block Code Execution" }),
    description: t("guardrails.guardrailGardenCards.blockCodeExecution.desc", {
      defaultValue:
        "Detects markdown fenced code blocks in requests and responses. Block or mask executable code (e.g. Python, JavaScript, Bash) by language with configurable confidence.",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.codeSafety", { defaultValue: "Code Safety" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.code", { defaultValue: "Code" }),
      t("guardrails.guardrailGardenCards.tags.safety", { defaultValue: "Safety" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
    ],
  },
  {
    id: "cf_competitor_intent",
    name: t("guardrails.guardrailGardenCards.cfCompetitorIntent.name", { defaultValue: "Competitor Name Blocking" }),
    description: t("guardrails.guardrailGardenCards.cfCompetitorIntent.desc", {
      defaultValue:
        "Block or reframe competitor comparison and ranking intent. Detect when users ask to compare or recommend competitors (airline or generic competitor lists).",
    }),
    category: "litellm",
    subcategory: t("guardrails.guardrailGardenCards.subcategory.contentCategory", { defaultValue: "Content Category" }),
    logo: litellmContentFilterLogo,
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentCategory", { defaultValue: "Content Category" }),
      t("guardrails.guardrailGardenCards.tags.competitor", { defaultValue: "Competitor" }),
      t("guardrails.guardrailGardenCards.tags.topicBlocker", { defaultValue: "Topic Blocker" }),
    ],
  },
];

export const getPartnerGuardrailCards = (t: TFunction): GuardrailCardInfo[] => [
  {
    id: "presidio",
    name: t("guardrails.guardrailGardenCards.presidio.name", { defaultValue: "Presidio PII" }),
    description: t("guardrails.guardrailGardenCards.presidio.desc", {
      defaultValue:
        "Microsoft Presidio for PII detection and anonymization. Supports 30+ entity types with configurable actions.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Presidio PII"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.pii", { defaultValue: "PII" }),
      t("guardrails.guardrailGardenCards.tags.microsoft", { defaultValue: "Microsoft" }),
    ],
    providerKey: "PresidioPII",
  },
  {
    id: "bedrock",
    name: t("guardrails.guardrailGardenCards.bedrock.name", { defaultValue: "Bedrock Guardrail" }),
    description: t("guardrails.guardrailGardenCards.bedrock.desc", {
      defaultValue:
        "AWS Bedrock Guardrails for content filtering, topic avoidance, and sensitive information detection.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Bedrock Guardrail"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.aws", { defaultValue: "AWS" }),
      t("guardrails.guardrailGardenCards.tags.contentSafety", { defaultValue: "Content Safety" }),
    ],
    providerKey: "Bedrock",
  },
  {
    id: "lakera",
    name: t("guardrails.guardrailGardenCards.lakera.name", { defaultValue: "Lakera" }),
    description: t("guardrails.guardrailGardenCards.lakera.desc", {
      defaultValue: "AI security platform protecting against prompt injections, data leakage, and harmful content.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Lakera"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
    ],
    providerKey: "Lakera",
  },
  {
    id: "openai_moderation",
    name: t("guardrails.guardrailGardenCards.openaiModeration.name", { defaultValue: "OpenAI Moderation" }),
    description: t("guardrails.guardrailGardenCards.openaiModeration.desc", {
      defaultValue: "OpenAI's content moderation API for detecting harmful content across multiple categories.",
    }),
    category: "partner",
    logo: guardrailLogoMap["OpenAI Moderation"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentModeration", { defaultValue: "Content Moderation" }),
      t("guardrails.guardrailGardenCards.tags.openai", { defaultValue: "OpenAI" }),
    ],
  },
  {
    id: "google_model_armor",
    name: t("guardrails.guardrailGardenCards.googleModelArmor.name", { defaultValue: "Google Cloud Model Armor" }),
    description: t("guardrails.guardrailGardenCards.googleModelArmor.desc", {
      defaultValue: "Google Cloud's model protection service for safe and responsible AI deployments.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Google Cloud Model Armor"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.googleCloud", { defaultValue: "Google Cloud" }),
      t("guardrails.guardrailGardenCards.tags.safety", { defaultValue: "Safety" }),
    ],
  },
  {
    id: "guardrails_ai",
    name: t("guardrails.guardrailGardenCards.guardrailsAi.name", { defaultValue: "Guardrails AI" }),
    description: t("guardrails.guardrailGardenCards.guardrailsAi.desc", {
      defaultValue: "Open-source framework for adding structural, type, and quality guarantees to LLM outputs.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Guardrails AI"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.openSource", { defaultValue: "Open Source" }),
      t("guardrails.guardrailGardenCards.tags.validation", { defaultValue: "Validation" }),
    ],
  },
  {
    id: "zscaler",
    name: t("guardrails.guardrailGardenCards.zscaler.name", { defaultValue: "Zscaler AI Guard" }),
    description: t("guardrails.guardrailGardenCards.zscaler.desc", {
      defaultValue: "Enterprise AI security from Zscaler for monitoring and protecting AI/ML workloads.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Zscaler AI Guard"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.enterprise", { defaultValue: "Enterprise" }),
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
    ],
  },
  {
    id: "panw",
    name: t("guardrails.guardrailGardenCards.panw.name", { defaultValue: "PANW Prisma AIRS" }),
    description: t("guardrails.guardrailGardenCards.panw.desc", {
      defaultValue: "Palo Alto Networks Prisma AI Runtime Security for securing AI applications in production.",
    }),
    category: "partner",
    logo: guardrailLogoMap["PANW Prisma AIRS"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.enterprise", { defaultValue: "Enterprise" }),
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
    ],
  },
  {
    id: "cisco_ai_defense",
    name: t("guardrails.guardrailGardenCards.ciscoAiDefense.name", { defaultValue: "Cisco AI Defense" }),
    description: t("guardrails.guardrailGardenCards.ciscoAiDefense.desc", {
      defaultValue:
        "Cisco AI Defense Inspection API for runtime protection: prompt injection, PII/PCI/PHI, harassment, hate speech, profanity, violence, and code detection.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Cisco AI Defense"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.enterprise", { defaultValue: "Enterprise" }),
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
      t("guardrails.guardrailGardenCards.tags.pii", { defaultValue: "PII" }),
    ],
    providerKey: "CiscoAiDefense",
  },
  {
    id: "noma",
    name: t("guardrails.guardrailGardenCards.noma.name", { defaultValue: "Noma Security" }),
    description: t("guardrails.guardrailGardenCards.noma.desc", {
      defaultValue: "AI security platform for detecting and preventing AI-specific threats and vulnerabilities.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Noma Security"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.threatDetection", { defaultValue: "Threat Detection" }),
    ],
  },
  {
    id: "aporia",
    name: t("guardrails.guardrailGardenCards.aporia.name", { defaultValue: "Aporia AI" }),
    description: t("guardrails.guardrailGardenCards.aporia.desc", {
      defaultValue: "Real-time AI guardrails for hallucination detection, topic control, and policy enforcement.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Aporia AI"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.hallucination", { defaultValue: "Hallucination" }),
      t("guardrails.guardrailGardenCards.tags.policy", { defaultValue: "Policy" }),
    ],
  },
  {
    id: "aim",
    name: t("guardrails.guardrailGardenCards.aim.name", { defaultValue: "AIM Guardrail" }),
    description: t("guardrails.guardrailGardenCards.aim.desc", {
      defaultValue: "AIM Security guardrails for comprehensive AI threat detection and mitigation.",
    }),
    category: "partner",
    logo: guardrailLogoMap["AIM Guardrail"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.threatDetection", { defaultValue: "Threat Detection" }),
    ],
  },
  {
    id: "cato_networks",
    name: t("guardrails.guardrailGardenCards.catoNetworks.name", { defaultValue: "Cato Networks Guardrail" }),
    description: t("guardrails.guardrailGardenCards.catoNetworks.desc", {
      defaultValue: "Cato Networks guardrails for comprehensive AI threat detection and mitigation.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Cato Networks Guardrail"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.threatDetection", { defaultValue: "Threat Detection" }),
    ],
  },
  {
    id: "prompt_security",
    name: t("guardrails.guardrailGardenCards.promptSecurity.name", { defaultValue: "Prompt Security" }),
    description: t("guardrails.guardrailGardenCards.promptSecurity.desc", {
      defaultValue: "Protect against prompt injection attacks, data leakage, and other LLM security threats.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Prompt Security"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
    ],
  },
  {
    id: "lasso",
    name: t("guardrails.guardrailGardenCards.lasso.name", { defaultValue: "Lasso Guardrail" }),
    description: t("guardrails.guardrailGardenCards.lasso.desc", {
      defaultValue: "Content moderation and safety guardrails for responsible AI deployments.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Lasso Guardrail"],
    tags: [t("guardrails.guardrailGardenCards.tags.contentModeration", { defaultValue: "Content Moderation" })],
  },
  {
    id: "pangea",
    name: t("guardrails.guardrailGardenCards.pangea.name", { defaultValue: "Pangea Guardrail" }),
    description: t("guardrails.guardrailGardenCards.pangea.desc", {
      defaultValue: "Pangea's AI guardrails for secure, compliant, and trustworthy AI applications.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Pangea Guardrail"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.compliance", { defaultValue: "Compliance" }),
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
    ],
  },
  {
    id: "enkryptai",
    name: t("guardrails.guardrailGardenCards.enkryptai.name", { defaultValue: "EnkryptAI" }),
    description: t("guardrails.guardrailGardenCards.enkryptai.desc", {
      defaultValue: "AI security and governance platform for enterprise AI safety and compliance.",
    }),
    category: "partner",
    logo: guardrailLogoMap["EnkryptAI"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.enterprise", { defaultValue: "Enterprise" }),
      t("guardrails.guardrailGardenCards.tags.governance", { defaultValue: "Governance" }),
    ],
  },
  {
    id: "javelin",
    name: t("guardrails.guardrailGardenCards.javelin.name", { defaultValue: "Javelin Guardrails" }),
    description: t("guardrails.guardrailGardenCards.javelin.desc", {
      defaultValue: "AI gateway with built-in guardrails for secure and compliant AI operations.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Javelin Guardrails"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.gateway", { defaultValue: "Gateway" }),
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
    ],
  },
  {
    id: "pillar",
    name: t("guardrails.guardrailGardenCards.pillar.name", { defaultValue: "Pillar Guardrail" }),
    description: t("guardrails.guardrailGardenCards.pillar.desc", {
      defaultValue: "AI safety platform for monitoring, testing, and securing AI systems.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Pillar Guardrail"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.monitoring", { defaultValue: "Monitoring" }),
      t("guardrails.guardrailGardenCards.tags.safety", { defaultValue: "Safety" }),
    ],
  },
  {
    id: "akto",
    name: t("guardrails.guardrailGardenCards.akto.name", { defaultValue: "Akto Guardrail" }),
    description: t("guardrails.guardrailGardenCards.akto.desc", {
      defaultValue:
        "AI security platform from Akto.io with automatic monitoring and guardrails for AI/ML applications.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Akto"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.safety", { defaultValue: "Safety" }),
      t("guardrails.guardrailGardenCards.tags.monitoring", { defaultValue: "Monitoring" }),
    ],
  },
  {
    id: "promptguard",
    name: t("guardrails.guardrailGardenCards.promptguard.name", { defaultValue: "PromptGuard" }),
    description: t("guardrails.guardrailGardenCards.promptguard.desc", {
      defaultValue:
        "AI security gateway with prompt injection detection, PII redaction, topic filtering, entity blocklists, and hallucination detection. Self-hostable with drop-in proxy integration.",
    }),
    category: "partner",
    logo: guardrailLogoMap["PromptGuard"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
      t("guardrails.guardrailGardenCards.tags.pii", { defaultValue: "PII" }),
    ],
    providerKey: "Promptguard",
    eval: {
      f1: 94.9,
      precision: 100.0,
      recall: 90.4,
      testCases: 5384,
      latency: "~150ms",
    },
  },
  {
    id: "xecguard",
    name: t("guardrails.guardrailGardenCards.xecguard.name", { defaultValue: "XecGuard" }),
    description: t("guardrails.guardrailGardenCards.xecguard.desc", {
      defaultValue:
        "CyCraft XecGuard AI security gateway. Multi-policy scanning (prompt injection, harmful content, PII, system-prompt enforcement) plus RAG context grounding.",
    }),
    category: "partner",
    logo: guardrailLogoMap["XecGuard"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.policy", { defaultValue: "Policy" }),
      t("guardrails.guardrailGardenCards.tags.grounding", { defaultValue: "Grounding" }),
      t("guardrails.guardrailGardenCards.tags.rag", { defaultValue: "RAG" }),
    ],
    providerKey: "Xecguard",
  },
  {
    id: "deepkeep",
    name: t("guardrails.guardrailGardenCards.deepkeep.name", { defaultValue: "DeepKeep AI Firewall" }),
    description: t("guardrails.guardrailGardenCards.deepkeep.desc", {
      defaultValue:
        "DeepKeep AI Firewall for comprehensive LLM security — prompt injection detection, PII protection, content moderation, and policy enforcement with configurable guardrail pipelines.",
    }),
    category: "partner",
    logo: guardrailLogoMap["DeepKeep AI Firewall"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
      t("guardrails.guardrailGardenCards.tags.pii", { defaultValue: "PII" }),
      t("guardrails.guardrailGardenCards.tags.firewall", { defaultValue: "Firewall" }),
    ],
    providerKey: "Deepkeep",
  },
  {
    id: "repelloai",
    name: t("guardrails.guardrailGardenCards.repelloai.name", { defaultValue: "RepelloAI Argus" }),
    description: t("guardrails.guardrailGardenCards.repelloai.desc", {
      defaultValue:
        "RepelloAI Argus scans prompts and responses against policies configured per asset in the Repello dashboard.",
    }),
    category: "partner",
    logo: guardrailLogoMap["RepelloAI Argus"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.policy", { defaultValue: "Policy" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
    ],
    providerKey: "Repelloai",
  },
  {
    id: "straiker",
    name: t("guardrails.guardrailGardenCards.straiker.name", { defaultValue: "Straiker" }),
    description: t("guardrails.guardrailGardenCards.straiker.desc", {
      defaultValue:
        "Defend AI Agentic Guardrails: Indirect/Direct Prompt Injection, Tool Misuse, Malicious MCP and Skills",
    }),
    category: "partner",
    logo: guardrailLogoMap["Straiker"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.agentic", { defaultValue: "Agentic" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
      t("guardrails.guardrailGardenCards.tags.toolMisuse", { defaultValue: "Tool Misuse" }),
      t("guardrails.guardrailGardenCards.tags.mcp", { defaultValue: "MCP" }),
      t("guardrails.guardrailGardenCards.tags.skills", { defaultValue: "Skills" }),
    ],
    providerKey: "Straiker",
  },
  {
    id: "alice",
    name: t("guardrails.guardrailGardenCards.alice.name", { defaultValue: "Alice" }),
    description: t("guardrails.guardrailGardenCards.alice.desc", {
      defaultValue:
        "Policy-based guardrails for prompts and model responses, evaluated per application so one proxy can enforce a different policy set per team or product.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Alice"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.contentModeration", { defaultValue: "Content Moderation" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
      t("guardrails.guardrailGardenCards.tags.pii", { defaultValue: "PII" }),
      t("guardrails.guardrailGardenCards.tags.policy", { defaultValue: "Policy" }),
    ],
    providerKey: "Alice",
  },
  {
    id: "conduct",
    name: t("guardrails.guardrailGardenCards.conduct.name", { defaultValue: "Conduct Guard" }),
    description: t("guardrails.guardrailGardenCards.conduct.desc", {
      defaultValue:
        "Conduct Guard evaluates prompts against workspace rules before the model call: prompt injection, PII, and custom policies, with block, warning, and approval verdicts.",
    }),
    category: "partner",
    logo: guardrailLogoMap["Conduct Guard"],
    tags: [
      t("guardrails.guardrailGardenCards.tags.security", { defaultValue: "Security" }),
      t("guardrails.guardrailGardenCards.tags.promptInjection", { defaultValue: "Prompt Injection" }),
      t("guardrails.guardrailGardenCards.tags.pii", { defaultValue: "PII" }),
      t("guardrails.guardrailGardenCards.tags.policy", { defaultValue: "Policy" }),
    ],
    providerKey: "Conduct",
  },
];

export const getAllCards = (t: TFunction): GuardrailCardInfo[] => [
  ...getLitellmContentFilterCards(t),
  ...getPartnerGuardrailCards(t),
];
