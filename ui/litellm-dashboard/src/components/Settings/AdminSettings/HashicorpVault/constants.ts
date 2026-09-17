import type { TFunction } from "i18next";

export const SENSITIVE_FIELDS = new Set(["vault_token", "approle_secret_id", "client_key"]);

export const FIELD_LABELS: Record<string, string> = {
  vault_addr: "Vault Address",
  vault_namespace: "Namespace",
  vault_mount_name: "KV Mount Name",
  vault_path_prefix: "Path Prefix",
  vault_token: "Token",
  approle_role_id: "Role ID",
  approle_secret_id: "Secret ID",
  approle_mount_path: "Mount Path",
  client_cert: "Client Certificate",
  client_key: "Client Key",
  vault_cert_role: "Certificate Role",
};

export const FIELD_LABEL_KEYS: Record<string, string> = {
  vault_addr: "settingsPages.hashicorpVault.vaultAddressLabel",
  vault_namespace: "settingsPages.hashicorpVault.fieldLabels.vault_namespace",
  vault_mount_name: "settingsPages.hashicorpVault.fieldLabels.vault_mount_name",
  vault_path_prefix: "settingsPages.hashicorpVault.fieldLabels.vault_path_prefix",
  vault_token: "settingsPages.hashicorpVault.fieldLabels.vault_token",
  approle_role_id: "settingsPages.hashicorpVault.fieldLabels.approle_role_id",
  approle_secret_id: "settingsPages.hashicorpVault.fieldLabels.approle_secret_id",
  approle_mount_path: "settingsPages.hashicorpVault.fieldLabels.approle_mount_path",
  client_cert: "settingsPages.hashicorpVault.fieldLabels.client_cert",
  client_key: "settingsPages.hashicorpVault.fieldLabels.client_key",
  vault_cert_role: "settingsPages.hashicorpVault.fieldLabels.vault_cert_role",
};

export const fieldLabel = (name: string, t: TFunction): string =>
  t(FIELD_LABEL_KEYS[name] ?? name, { defaultValue: FIELD_LABELS[name] ?? name });
