import i18n from "@/lib/i18n";

interface PolicyClause {
  readonly pattern: RegExp;
  readonly key: string;
  readonly defaultValue: string;
}

const POLICY_HEADER = "password does not meet the required policy";

const CLAUSES: readonly PolicyClause[] = [
  {
    pattern: /be at least (\d+) characters? long/i,
    key: "passwordPolicy.clauses.minLength",
    defaultValue: "at least {{count}} characters long",
  },
  {
    pattern: /include an uppercase letter/i,
    key: "passwordPolicy.clauses.uppercase",
    defaultValue: "an uppercase letter",
  },
  {
    pattern: /include a lowercase letter/i,
    key: "passwordPolicy.clauses.lowercase",
    defaultValue: "a lowercase letter",
  },
  {
    pattern: /include a number/i,
    key: "passwordPolicy.clauses.number",
    defaultValue: "a number",
  },
  {
    pattern: /include a special character/i,
    key: "passwordPolicy.clauses.specialCharacter",
    defaultValue: "a special character",
  },
];

const SEPARATOR: Readonly<Record<string, string>> = { "zh-CN": "、", en: ", " };

const translateClause = (clause: string): string => {
  for (const entry of CLAUSES) {
    const match = clause.match(entry.pattern);
    if (match === null) {
      continue;
    }
    const count = match[1];
    if (count === undefined) {
      return i18n.t(entry.key, { defaultValue: entry.defaultValue });
    }
    return i18n.t(entry.key, { defaultValue: entry.defaultValue, count });
  }
  return clause;
};

const policyDetails = (raw: string): string => {
  const marker = raw.toLowerCase().indexOf("must ");
  if (marker < 0) {
    return "";
  }
  const clauses = raw
    .slice(marker + "must ".length)
    .replace(/\.\s*$/, "")
    .split(/,\s*/)
    .map((clause) => clause.trim())
    .filter((clause) => clause !== "")
    .map(translateClause);
  const separator = SEPARATOR[i18n.language] ?? SEPARATOR.en;
  return clauses.join(separator);
};

export const localizePasswordError = (raw: string): string => {
  const lower = raw.toLowerCase();
  if (lower.includes(POLICY_HEADER)) {
    const details = policyDetails(raw);
    const prefix = i18n.t("passwordPolicy.policyViolated", {
      defaultValue: "The new password does not meet the password policy",
    });
    return details === "" ? prefix : `${prefix}：${details}`;
  }
  if (lower.includes("no password set")) {
    return i18n.t("changePassword.noPasswordSet", {
      defaultValue: "This account has no password set, so there is no password to change.",
    });
  }
  if (lower.includes("must be different from the current password")) {
    return i18n.t("changePassword.newPasswordSameAsCurrent", {
      defaultValue: "New password must be different from the current password.",
    });
  }
  if (lower.includes("current password")) {
    return i18n.t("changePassword.currentPasswordIncorrect", { defaultValue: "Current password is incorrect." });
  }
  if (lower.includes("known data breaches") || lower.includes("breached")) {
    return i18n.t("changePassword.passwordBreached", {
      defaultValue: "This password appears in known data breaches and cannot be used. Please choose a different password.",
    });
  }
  return raw;
};
