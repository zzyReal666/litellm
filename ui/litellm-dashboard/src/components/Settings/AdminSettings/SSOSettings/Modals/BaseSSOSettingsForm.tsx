"use client";

import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { FormProvider, useFormContext, useWatch, type UseFormReturn } from "react-hook-form";
import { z } from "zod/v4";
import { ssoProviderLogoMap, ssoProviderDisplayNames } from "../constants";
import { Logo } from "@/components/molecules/logo/Logo";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/lib/forms/useZodForm";

export interface SSOSettingsFormValues {
  sso_provider?: string;
  google_client_id?: string;
  google_client_secret?: string;
  microsoft_client_id?: string;
  microsoft_client_secret?: string;
  microsoft_tenant?: string;
  generic_client_id?: string;
  generic_client_secret?: string;
  generic_authorization_endpoint?: string;
  generic_token_endpoint?: string;
  generic_userinfo_endpoint?: string;
  generic_scope?: string;
  saml_idp_metadata_url?: string;
  saml_idp_metadata_xml?: string;
  saml_sp_entity_id?: string;
  saml_allow_unsolicited?: boolean;
  user_email?: string;
  proxy_base_url?: string;
  use_role_mappings?: boolean;
  group_claim?: string;
  default_role?: string;
  proxy_admin_teams?: string;
  admin_viewer_teams?: string;
  internal_user_teams?: string;
  internal_viewer_teams?: string;
  use_team_mappings?: boolean;
  team_ids_jwt_field?: string;
}

export interface BaseSSOSettingsFormProps {
  form: UseFormReturn<SSOSettingsFormValues>;
  onFormSubmit: (formValues: SSOSettingsFormValues) => Promise<void>;
}

export interface SSOProviderConfig {
  envVarMap: Record<string, string>;
  fields: Array<{
    key: string;
    defaultValue: string;
    name: keyof SSOSettingsFormValues;
    placeholder?: string;
    placeholderKey?: string;
    required?: boolean;
    type?: "password" | "textarea" | "checkbox";
  }>;
}

export const ssoProviderConfigs: Record<string, SSOProviderConfig> = {
  google: {
    envVarMap: {
      google_client_id: "GOOGLE_CLIENT_ID",
      google_client_secret: "GOOGLE_CLIENT_SECRET",
    },
    fields: [
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.googleClientId",
        defaultValue: "Google Client ID",
        name: "google_client_id",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.googleClientSecret",
        defaultValue: "Google Client Secret",
        name: "google_client_secret",
      },
    ],
  },
  microsoft: {
    envVarMap: {
      microsoft_client_id: "MICROSOFT_CLIENT_ID",
      microsoft_client_secret: "MICROSOFT_CLIENT_SECRET",
      microsoft_tenant: "MICROSOFT_TENANT",
    },
    fields: [
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.microsoftClientId",
        defaultValue: "Microsoft Client ID",
        name: "microsoft_client_id",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.microsoftClientSecret",
        defaultValue: "Microsoft Client Secret",
        name: "microsoft_client_secret",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.microsoftTenant",
        defaultValue: "Microsoft Tenant",
        name: "microsoft_tenant",
      },
    ],
  },
  okta: {
    envVarMap: {
      generic_client_id: "GENERIC_CLIENT_ID",
      generic_client_secret: "GENERIC_CLIENT_SECRET",
      generic_authorization_endpoint: "GENERIC_AUTHORIZATION_ENDPOINT",
      generic_token_endpoint: "GENERIC_TOKEN_ENDPOINT",
      generic_userinfo_endpoint: "GENERIC_USERINFO_ENDPOINT",
      generic_scope: "GENERIC_SCOPE",
    },
    fields: [
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.genericClientId",
        defaultValue: "Generic Client ID",
        name: "generic_client_id",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.genericClientSecret",
        defaultValue: "Generic Client Secret",
        name: "generic_client_secret",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.authorizationEndpoint",
        defaultValue: "Authorization Endpoint",
        name: "generic_authorization_endpoint",
        placeholder: "https://your-domain/authorize",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.tokenEndpoint",
        defaultValue: "Token Endpoint",
        name: "generic_token_endpoint",
        placeholder: "https://your-domain/token",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.userinfoEndpoint",
        defaultValue: "Userinfo Endpoint",
        name: "generic_userinfo_endpoint",
        placeholder: "https://your-domain/userinfo",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.scopes",
        defaultValue: "Scopes",
        name: "generic_scope",
        placeholder: "openid email profile",
        required: false,
      },
    ],
  },
  generic: {
    envVarMap: {
      generic_client_id: "GENERIC_CLIENT_ID",
      generic_client_secret: "GENERIC_CLIENT_SECRET",
      generic_authorization_endpoint: "GENERIC_AUTHORIZATION_ENDPOINT",
      generic_token_endpoint: "GENERIC_TOKEN_ENDPOINT",
      generic_userinfo_endpoint: "GENERIC_USERINFO_ENDPOINT",
      generic_scope: "GENERIC_SCOPE",
    },
    fields: [
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.genericClientId",
        defaultValue: "Generic Client ID",
        name: "generic_client_id",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.genericClientSecret",
        defaultValue: "Generic Client Secret",
        name: "generic_client_secret",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.authorizationEndpoint",
        defaultValue: "Authorization Endpoint",
        name: "generic_authorization_endpoint",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.tokenEndpoint",
        defaultValue: "Token Endpoint",
        name: "generic_token_endpoint",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.userinfoEndpoint",
        defaultValue: "Userinfo Endpoint",
        name: "generic_userinfo_endpoint",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.scopes",
        defaultValue: "Scopes",
        name: "generic_scope",
        placeholder: "openid email profile",
        required: false,
      },
    ],
  },
  saml: {
    envVarMap: {
      saml_idp_metadata_url: "SAML_IDP_METADATA_URL",
      saml_idp_metadata_xml: "SAML_IDP_METADATA_XML",
      saml_sp_entity_id: "SAML_SP_ENTITY_ID",
      saml_allow_unsolicited: "SAML_ALLOW_UNSOLICITED",
    },
    fields: [
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.idpMetadataUrl",
        defaultValue: "IdP Metadata URL",
        name: "saml_idp_metadata_url",
        required: false,
        placeholder: "https://idp.example.com/metadata (use this or the metadata XML below)",
        placeholderKey: "settingsPages.baseSSOSettingsForm.placeholders.idpMetadataUrl",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.idpMetadataXml",
        defaultValue: "IdP Metadata XML",
        name: "saml_idp_metadata_xml",
        required: false,
        type: "textarea",
        placeholder: "Paste the IdP metadata XML here if you do not have a metadata URL",
        placeholderKey: "settingsPages.baseSSOSettingsForm.placeholders.idpMetadataXml",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.spEntityId",
        defaultValue: "SP Entity ID",
        name: "saml_sp_entity_id",
        required: false,
        placeholder: "Defaults to <proxy base url>/sso/saml/metadata",
        placeholderKey: "settingsPages.baseSSOSettingsForm.placeholders.spEntityId",
      },
      {
        key: "settingsPages.baseSSOSettingsForm.fieldLabels.allowUnsolicited",
        defaultValue: "Allow IdP-initiated (unsolicited) responses",
        name: "saml_allow_unsolicited",
        required: false,
        type: "checkbox",
      },
    ],
  },
};

const ROLE_MAPPING_TEAM_FIELDS = [
  "proxy_admin_teams",
  "admin_viewer_teams",
  "internal_user_teams",
  "internal_viewer_teams",
] as const;

const supportsMappings = (provider: string | undefined): boolean => provider === "okta" || provider === "generic";

const providerFieldNames = (provider: string | undefined): readonly string[] =>
  provider ? ssoProviderConfigs[provider]?.fields.map((field) => field.name) ?? [] : [];

export type SSOFormVariant = "sso-settings" | "admin-panel";

export const mountedSSOFieldNames = (values: SSOSettingsFormValues, variant: SSOFormVariant): readonly string[] => {
  const provider = values.sso_provider;
  const showMappingToggles = supportsMappings(provider);
  const roleFieldsVisible =
    variant === "sso-settings"
      ? Boolean(values.use_role_mappings) && showMappingToggles
      : Boolean(values.use_role_mappings);
  const teamFieldsVisible = variant === "sso-settings" && Boolean(values.use_team_mappings) && showMappingToggles;

  return [
    "sso_provider",
    ...providerFieldNames(provider),
    "user_email",
    "proxy_base_url",
    ...(showMappingToggles ? ["use_role_mappings"] : []),
    ...(roleFieldsVisible ? ["group_claim", "default_role", ...ROLE_MAPPING_TEAM_FIELDS] : []),
    ...(variant === "sso-settings" && showMappingToggles ? ["use_team_mappings"] : []),
    ...(teamFieldsVisible ? ["team_ids_jwt_field"] : []),
  ];
};

export const pickMountedSSOValues = (values: SSOSettingsFormValues, variant: SSOFormVariant): SSOSettingsFormValues =>
  Object.fromEntries(
    mountedSSOFieldNames(values, variant).map((name) => [name, values[name as keyof SSOSettingsFormValues]]),
  );

export const submitMountedSSOValues =
  (
    form: UseFormReturn<SSOSettingsFormValues>,
    variant: SSOFormVariant,
    onFormSubmit: (formValues: SSOSettingsFormValues) => Promise<void> | void,
  ) =>
  () =>
    void form.handleSubmit((values) => onFormSubmit(pickMountedSSOValues(values, variant)))();

const REQUIRED_MESSAGES: Record<string, { key: string; defaultValue: string }> = {
  sso_provider: {
    key: "settingsPages.baseSSOSettingsForm.ssoProviderRequired",
    defaultValue: "Please select an SSO provider",
  },
  user_email: {
    key: "settingsPages.baseSSOSettingsForm.proxyAdminEmailRequired",
    defaultValue: "Please enter the email of the proxy admin",
  },
  proxy_base_url: {
    key: "settingsPages.baseSSOSettingsForm.proxyBaseUrlRequired",
    defaultValue: "Please enter the proxy base url",
  },
  group_claim: {
    key: "settingsPages.baseSSOSettingsForm.groupClaimRequired",
    defaultValue: "Please enter the group claim",
  },
  team_ids_jwt_field: {
    key: "settingsPages.baseSSOSettingsForm.teamIdsJwtFieldRequired",
    defaultValue: "Please enter the team IDs JWT field",
  },
};

const isBlank = (value: unknown): boolean => value === undefined || value === null || value === "";

export const buildSSOSettingsSchema = (variant: SSOFormVariant, t: TFunction) =>
  z.custom<SSOSettingsFormValues>().superRefine((values, ctx) => {
    const mounted = new Set(mountedSSOFieldNames(values, variant));

    const requireField = (name: string) => {
      if (mounted.has(name) && isBlank(values[name as keyof SSOSettingsFormValues])) {
        const message = REQUIRED_MESSAGES[name];
        ctx.addIssue({ code: "custom", path: [name], message: t(message.key, { defaultValue: message.defaultValue }) });
      }
    };

    requireField("sso_provider");
    requireField("user_email");
    requireField("group_claim");
    requireField("team_ids_jwt_field");

    const providerConfig = values.sso_provider ? ssoProviderConfigs[values.sso_provider] : undefined;
    providerConfig?.fields.forEach((field) => {
      if (field.required === false) return;
      if (!isBlank(values[field.name])) return;
      ctx.addIssue({
        code: "custom",
        path: [field.name],
        message: t("settingsPages.baseSSOSettingsForm.fieldRequired", {
          defaultValue: "Please enter the {{label}}",
          label: t(field.key, { defaultValue: field.defaultValue }).toLowerCase(),
        }),
      });
    });

    const proxyBaseUrl = values.proxy_base_url;
    if (isBlank(proxyBaseUrl)) {
      const message = REQUIRED_MESSAGES.proxy_base_url;
      ctx.addIssue({
        code: "custom",
        path: ["proxy_base_url"],
        message: t(message.key, { defaultValue: message.defaultValue }),
      });
      return;
    }
    if (!/^https?:\/\/.+/.test(proxyBaseUrl as string)) {
      ctx.addIssue({
        code: "custom",
        path: ["proxy_base_url"],
        message: t("settingsPages.baseSSOSettingsForm.proxyBaseUrlInvalidScheme", {
          defaultValue: "URL must start with http:// or https://",
        }),
      });
      return;
    }
    if ((proxyBaseUrl as string).endsWith("/")) {
      ctx.addIssue({
        code: "custom",
        path: ["proxy_base_url"],
        message: t("settingsPages.baseSSOSettingsForm.proxyBaseUrlTrailingSlash", {
          defaultValue: "URL must not end with a trailing slash",
        }),
      });
    }
  });

export const emptySSOSettingsFormValues: SSOSettingsFormValues = {
  sso_provider: "",
  google_client_id: "",
  google_client_secret: "",
  microsoft_client_id: "",
  microsoft_client_secret: "",
  microsoft_tenant: "",
  generic_client_id: "",
  generic_client_secret: "",
  generic_authorization_endpoint: "",
  generic_token_endpoint: "",
  generic_userinfo_endpoint: "",
  user_email: "",
  proxy_base_url: "",
  default_role: "internal_user",
};

export const useSSOSettingsForm = (
  variant: SSOFormVariant,
  values?: SSOSettingsFormValues,
): UseFormReturn<SSOSettingsFormValues> => {
  const { t } = useTranslation();

  return useZodForm(buildSSOSettingsSchema(variant, t), {
    mode: "onChange",
    defaultValues: emptySSOSettingsFormValues,
    ...(values ? { values } : {}),
  });
};

const SSOProviderField = ({ field }: { field: SSOProviderConfig["fields"][number] }) => {
  const { t } = useTranslation();
  const { control } = useFormContext<SSOSettingsFormValues>();
  const label = t(field.key, { defaultValue: field.defaultValue });

  if (field.type === "checkbox") {
    return (
      <FormField control={control} name={field.name} label={label} orientation="horizontal">
        {({ value, onChange, onBlur, id, ...rest }) => (
          <Checkbox
            id={id}
            checked={Boolean(value)}
            onCheckedChange={onChange}
            onBlur={onBlur}
            aria-invalid={rest["aria-invalid"]}
            aria-describedby={rest["aria-describedby"]}
          />
        )}
      </FormField>
    );
  }

  const placeholder =
    field.placeholderKey && field.placeholder
      ? t(field.placeholderKey, { defaultValue: field.placeholder })
      : field.placeholder;

  return (
    <FormField control={control} name={field.name} label={label}>
      {({ ref, value, ...rest }) => {
        const shared = { placeholder, value: (value as string) ?? "", ...rest };
        if (field.type === "textarea") return <Textarea ref={ref} rows={4} {...shared} />;
        if (field.type === "password" || field.name.includes("client")) return <PasswordInput ref={ref} {...shared} />;
        return <Input ref={ref} {...shared} />;
      }}
    </FormField>
  );
};

export const renderProviderFields = (provider: string) => {
  const config = ssoProviderConfigs[provider];
  if (!config) return null;

  return config.fields.map((field) => <SSOProviderField key={field.name} field={field} />);
};

export const SSOProviderSelectField = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField
      control={control}
      name="sso_provider"
      label={t("settingsPages.baseSSOSettingsForm.ssoProviderLabel", { defaultValue: "SSO Provider" })}
    >
      {({ value, onChange, onBlur, id, ...rest }) => (
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger
            id={id}
            onBlur={onBlur}
            aria-invalid={rest["aria-invalid"]}
            aria-describedby={rest["aria-describedby"]}
            className="w-full"
          >
            <SelectValue>{(provider: string) => (provider ? providerOptionLabel(provider) : "")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ssoProviderLogoMap).map(([optionValue, logo]) => (
              <SelectItem key={optionValue} value={optionValue}>
                <span className="flex items-center py-1">
                  {logo && (
                    <Logo
                      src={logo}
                      label={ssoProviderDisplayNames[optionValue] || optionValue}
                      className="h-6 w-6 mr-3 object-contain"
                    />
                  )}
                  <span>{providerOptionLabel(optionValue)}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
};

export const ProxyAdminEmailField = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField
      control={control}
      name="user_email"
      label={t("settingsPages.baseSSOSettingsForm.proxyAdminEmailLabel", { defaultValue: "Proxy Admin Email" })}
    >
      {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
    </FormField>
  );
};

export const ProxyBaseUrlField = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField
      control={control}
      name="proxy_base_url"
      label={t("settingsPages.baseSSOSettingsForm.proxyBaseUrlLabel", { defaultValue: "Proxy Base URL" })}
    >
      {({ ref, value, onChange, ...rest }) => (
        <Input
          ref={ref}
          placeholder="https://example.com"
          value={(value as string) ?? ""}
          onChange={(event) => onChange(event.target.value.trim())}
          {...rest}
        />
      )}
    </FormField>
  );
};

export const MappingToggleField = ({
  name,
  label,
}: {
  name: "use_role_mappings" | "use_team_mappings";
  label: string;
}) => {
  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField control={control} name={name} label={label} orientation="horizontal">
      {({ value, onChange, onBlur, id, ...rest }) => (
        <Checkbox
          id={id}
          checked={Boolean(value)}
          onCheckedChange={onChange}
          onBlur={onBlur}
          aria-invalid={rest["aria-invalid"]}
          aria-describedby={rest["aria-describedby"]}
        />
      )}
    </FormField>
  );
};

export const GroupClaimField = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField
      control={control}
      name="group_claim"
      label={t("settingsPages.baseSSOSettingsForm.groupClaimLabel", { defaultValue: "Group Claim" })}
    >
      {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
    </FormField>
  );
};

const DEFAULT_ROLE_OPTIONS: ReadonlyArray<{ value: string; key: string; defaultValue: string }> = [
  {
    value: "internal_user_viewer",
    key: "settingsPages.baseSSOSettingsForm.roleInternalViewer",
    defaultValue: "Internal Viewer",
  },
  {
    value: "internal_user",
    key: "settingsPages.baseSSOSettingsForm.roleInternalUser",
    defaultValue: "Internal User",
  },
  {
    value: "proxy_admin_viewer",
    key: "settingsPages.baseSSOSettingsForm.roleAdminViewer",
    defaultValue: "Admin Viewer",
  },
  {
    value: "proxy_admin",
    key: "settingsPages.baseSSOSettingsForm.roleProxyAdmin",
    defaultValue: "Proxy Admin",
  },
];

const providerOptionLabel = (value: string) =>
  ssoProviderDisplayNames[value] || value.charAt(0).toUpperCase() + value.slice(1) + " SSO";

export const RoleMappingTeamFields = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<SSOSettingsFormValues>();
  const roleLabel = (option: (typeof DEFAULT_ROLE_OPTIONS)[number]) =>
    t(option.key, { defaultValue: option.defaultValue });

  return (
    <>
      <FormField
        control={control}
        name="default_role"
        label={t("settingsPages.baseSSOSettingsForm.defaultRoleLabel", { defaultValue: "Default Role" })}
      >
        {({ value, onChange, onBlur, id, ...rest }) => (
          <Select value={(value as string) ?? ""} onValueChange={onChange}>
            <SelectTrigger
              id={id}
              onBlur={onBlur}
              aria-invalid={rest["aria-invalid"]}
              aria-describedby={rest["aria-describedby"]}
              className="w-full"
            >
              <SelectValue>
                {(role: string) => {
                  const option = DEFAULT_ROLE_OPTIONS.find((candidate) => candidate.value === role);
                  return option ? roleLabel(option) : role;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {roleLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField
        control={control}
        name="proxy_admin_teams"
        label={t("settingsPages.baseSSOSettingsForm.proxyAdminTeamsLabel", { defaultValue: "Proxy Admin Teams" })}
      >
        {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
      </FormField>

      <FormField
        control={control}
        name="admin_viewer_teams"
        label={t("settingsPages.baseSSOSettingsForm.adminViewerTeamsLabel", { defaultValue: "Admin Viewer Teams" })}
      >
        {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
      </FormField>

      <FormField
        control={control}
        name="internal_user_teams"
        label={t("settingsPages.baseSSOSettingsForm.internalUserTeamsLabel", { defaultValue: "Internal User Teams" })}
      >
        {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
      </FormField>

      <FormField
        control={control}
        name="internal_viewer_teams"
        label={t("settingsPages.baseSSOSettingsForm.internalViewerTeamsLabel", {
          defaultValue: "Internal Viewer Teams",
        })}
      >
        {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
      </FormField>
    </>
  );
};

export const TeamIdsJwtFieldField = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<SSOSettingsFormValues>();

  return (
    <FormField
      control={control}
      name="team_ids_jwt_field"
      label={t("settingsPages.baseSSOSettingsForm.teamIdsJwtFieldLabel", { defaultValue: "Team IDs JWT Field" })}
    >
      {({ ref, value, ...rest }) => <Input ref={ref} value={(value as string) ?? ""} {...rest} />}
    </FormField>
  );
};

const BaseSSOSettingsForm: React.FC<BaseSSOSettingsFormProps> = ({ form, onFormSubmit }) => {
  const { t } = useTranslation();
  const provider = useWatch({ control: form.control, name: "sso_provider" });
  const useRoleMappings = useWatch({ control: form.control, name: "use_role_mappings" });
  const useTeamMappings = useWatch({ control: form.control, name: "use_team_mappings" });
  const showMappingToggles = supportsMappings(provider);

  return (
    <div>
      <FormProvider {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitMountedSSOValues(form, "sso-settings", onFormSubmit)();
          }}
        >
          <FieldGroup>
            <SSOProviderSelectField />
            {provider ? renderProviderFields(provider) : null}
            <ProxyAdminEmailField />
            <ProxyBaseUrlField />
            {showMappingToggles && (
              <MappingToggleField
                name="use_role_mappings"
                label={t("settingsPages.baseSSOSettingsForm.useRoleMappingsLabel", {
                  defaultValue: "Use Role Mappings",
                })}
              />
            )}
            {useRoleMappings && showMappingToggles && (
              <>
                <GroupClaimField />
                <RoleMappingTeamFields />
              </>
            )}
            {showMappingToggles && (
              <MappingToggleField
                name="use_team_mappings"
                label={t("settingsPages.baseSSOSettingsForm.useTeamMappingsLabel", {
                  defaultValue: "Use Team Mappings",
                })}
              />
            )}
            {useTeamMappings && showMappingToggles && <TeamIdsJwtFieldField />}
          </FieldGroup>
        </form>
      </FormProvider>
    </div>
  );
};

export default BaseSSOSettingsForm;
