import type { TFunction } from "i18next";

export const SENSITIVE_FIELDS = new Set(["cyberark_api_key", "client_key"]);

export const FIELD_LABELS: Record<string, string> = {
  cyberark_api_base: "Conjur Server URL",
  cyberark_account: "Account",
  cyberark_username: "Username",
  cyberark_api_key: "API Key",
  client_cert: "Client Certificate",
  client_key: "Client Key",
  ssl_verify: "SSL Verification",
  refresh_interval: "Token Refresh Interval (seconds)",
};

export const FIELD_LABEL_KEYS: Record<string, string> = {
  cyberark_api_base: "settingsPages.cyberArk.conjurServerUrlLabel",
  cyberark_account: "settingsPages.cyberArk.fieldLabels.cyberark_account",
  cyberark_username: "settingsPages.cyberArk.fieldLabels.cyberark_username",
  cyberark_api_key: "settingsPages.cyberArk.fieldLabels.cyberark_api_key",
  client_cert: "settingsPages.cyberArk.fieldLabels.client_cert",
  client_key: "settingsPages.cyberArk.fieldLabels.client_key",
  ssl_verify: "settingsPages.cyberArk.fieldLabels.ssl_verify",
  refresh_interval: "settingsPages.cyberArk.fieldLabels.refresh_interval",
};

export const fieldLabel = (name: string, t: TFunction): string =>
  t(FIELD_LABEL_KEYS[name] ?? name, { defaultValue: FIELD_LABELS[name] ?? name });
