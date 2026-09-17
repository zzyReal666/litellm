"use client";

import { Copy, Edit, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useSSOSettings, type SSOSettingsValues } from "@/app/(dashboard)/hooks/sso/useSSOSettings";
import { Logo } from "@/components/molecules/logo/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copyToClipboard } from "@/utils/dataUtils";

import AddSSOSettingsModal from "./Modals/AddSSOSettingsModal";
import DeleteSSOSettingsModal from "./Modals/DeleteSSOSettingsModal";
import EditSSOSettingsModal from "./Modals/EditSSOSettingsModal";
import RedactableField from "./RedactableField";
import RoleMappings from "./RoleMappings";
import SSOSettingsEmptyPlaceholder from "./SSOSettingsEmptyPlaceholder";
import SSOSettingsLoadingSkeleton from "./SSOSettingsLoadingSkeleton";
import { ssoProviderDisplayNames, ssoProviderLogoMap } from "./constants";
import { detectSSOProvider } from "./utils";

function NotConfigured() {
  const { t } = useTranslation();

  return (
    <span className="text-muted-foreground italic">
      {t("settingsPages.sSOSettings.notConfigured", { defaultValue: "Not configured" })}
    </span>
  );
}

function DetailRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      <dt className="bg-muted/50 px-4 py-3 text-sm font-medium text-foreground">{label}</dt>
      <dd className="min-w-0 px-4 py-3 text-sm text-foreground sm:col-span-2">{children}</dd>
    </div>
  );
}

function EndpointValue({ value }: { value?: string | null }) {
  const { t } = useTranslation();

  if (!value) return <span className="font-mono text-muted-foreground">-</span>;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate font-mono text-sm text-muted-foreground">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t("settingsPages.sSOSettings.copyValue", { defaultValue: "Copy value" })}
        onClick={() =>
          void copyToClipboard(
            value,
            t("addModel.modelConnectionTest.copiedToClipboard", { defaultValue: "Copied to clipboard" }),
          )
        }
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}

export default function SSOSettings() {
  const { t } = useTranslation();
  const { data: ssoSettings, refetch, isLoading } = useSSOSettings();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const isSSOConfigured = [
    ssoSettings?.values.google_client_id,
    ssoSettings?.values.microsoft_client_id,
    ssoSettings?.values.generic_client_id,
    ssoSettings?.values.saml_idp_metadata_url,
    ssoSettings?.values.saml_idp_metadata_xml,
  ].some(Boolean);
  const selectedProvider = ssoSettings?.values ? detectSSOProvider(ssoSettings.values) : null;
  const isRoleMappingsEnabled = Boolean(ssoSettings?.values.role_mappings);
  const isTeamMappingsEnabled = Boolean(ssoSettings?.values.team_mappings);

  const renderSimpleValue = (value?: string | null) => value || <NotConfigured />;
  const renderTeamMappingsField = (values: SSOSettingsValues) =>
    values.team_mappings?.team_ids_jwt_field ? (
      <Badge variant="secondary">{values.team_mappings.team_ids_jwt_field}</Badge>
    ) : (
      <NotConfigured />
    );

  const providerConfigs = {
    google: {
      providerText: ssoProviderDisplayNames.google,
      fields: [
        {
          label: t("settingsPages.sSOSettings.clientId", { defaultValue: "Client ID" }),
          render: (values: SSOSettingsValues) => <RedactableField value={values.google_client_id} />,
        },
        {
          label: t("settingsPages.sSOSettings.clientSecret", { defaultValue: "Client Secret" }),
          render: (values: SSOSettingsValues) => <RedactableField value={values.google_client_secret} />,
        },
        {
          label: t("settingsPages.sSOSettings.proxyBaseUrl", { defaultValue: "Proxy Base URL" }),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
    microsoft: {
      providerText: ssoProviderDisplayNames.microsoft,
      fields: [
        {
          label: t("settingsPages.sSOSettings.clientId", { defaultValue: "Client ID" }),
          render: (values: SSOSettingsValues) => <RedactableField value={values.microsoft_client_id} />,
        },
        {
          label: t("settingsPages.sSOSettings.clientSecret", { defaultValue: "Client Secret" }),
          render: (values: SSOSettingsValues) => <RedactableField value={values.microsoft_client_secret} />,
        },
        {
          label: t("settingsPages.sSOSettings.tenant", { defaultValue: "Tenant" }),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.microsoft_tenant),
        },
        {
          label: t("settingsPages.sSOSettings.proxyBaseUrl", { defaultValue: "Proxy Base URL" }),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
    okta: {
      providerText: ssoProviderDisplayNames.okta,
      fields: [
        {
          label: t("settingsPages.sSOSettings.clientId", { defaultValue: "Client ID" }),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_id} />,
        },
        {
          label: t("settingsPages.sSOSettings.clientSecret", { defaultValue: "Client Secret" }),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_secret} />,
        },
        {
          label: t("settingsPages.sSOSettings.authorizationEndpoint", { defaultValue: "Authorization Endpoint" }),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_authorization_endpoint} />,
        },
        {
          label: t("settingsPages.sSOSettings.tokenEndpoint", { defaultValue: "Token Endpoint" }),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_token_endpoint} />,
        },
        {
          label: t("settingsPages.sSOSettings.userInfoEndpoint", { defaultValue: "User Info Endpoint" }),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_userinfo_endpoint} />,
        },
        {
          label: t("settingsPages.sSOSettings.scopes", { defaultValue: "Scopes" }),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.generic_scope),
        },
        {
          label: t("settingsPages.sSOSettings.proxyBaseUrl", { defaultValue: "Proxy Base URL" }),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
        isTeamMappingsEnabled
          ? {
              label: t("settingsPages.sSOSettings.teamIdsJwtField", { defaultValue: "Team IDs JWT Field" }),
              render: (values: SSOSettingsValues) => renderTeamMappingsField(values),
            }
          : null,
      ],
    },
    generic: {
      providerText: ssoProviderDisplayNames.generic,
      fields: [
        {
          label: t("settingsPages.sSOSettings.clientId", { defaultValue: "Client ID" }),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_id} />,
        },
        {
          label: t("settingsPages.sSOSettings.clientSecret", { defaultValue: "Client Secret" }),
          render: (values: SSOSettingsValues) => <RedactableField value={values.generic_client_secret} />,
        },
        {
          label: t("settingsPages.sSOSettings.authorizationEndpoint", { defaultValue: "Authorization Endpoint" }),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_authorization_endpoint} />,
        },
        {
          label: t("settingsPages.sSOSettings.tokenEndpoint", { defaultValue: "Token Endpoint" }),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_token_endpoint} />,
        },
        {
          label: t("settingsPages.sSOSettings.userInfoEndpoint", { defaultValue: "User Info Endpoint" }),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.generic_userinfo_endpoint} />,
        },
        {
          label: t("settingsPages.sSOSettings.scopes", { defaultValue: "Scopes" }),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.generic_scope),
        },
        {
          label: t("settingsPages.sSOSettings.proxyBaseUrl", { defaultValue: "Proxy Base URL" }),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
        isTeamMappingsEnabled
          ? {
              label: t("settingsPages.sSOSettings.teamIdsJwtField", { defaultValue: "Team IDs JWT Field" }),
              render: (values: SSOSettingsValues) => renderTeamMappingsField(values),
            }
          : null,
      ],
    },
    saml: {
      providerText: ssoProviderDisplayNames.saml,
      fields: [
        {
          label: t("settingsPages.sSOSettings.idpMetadataUrl", { defaultValue: "IdP Metadata URL" }),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.saml_idp_metadata_url} />,
        },
        {
          label: t("settingsPages.sSOSettings.idpMetadataXml", { defaultValue: "IdP Metadata XML" }),
          render: (values: SSOSettingsValues) =>
            values.saml_idp_metadata_xml ? (
              <Badge variant="secondary">{t("settingsPages.sSOSettings.provided", { defaultValue: "Provided" })}</Badge>
            ) : (
              <NotConfigured />
            ),
        },
        {
          label: t("settingsPages.sSOSettings.spEntityId", { defaultValue: "SP Entity ID" }),
          render: (values: SSOSettingsValues) => <EndpointValue value={values.saml_sp_entity_id} />,
        },
        {
          label: t("settingsPages.sSOSettings.allowUnsolicited", {
            defaultValue: "Allow IdP-initiated (unsolicited) responses",
          }),
          render: (values: SSOSettingsValues) => (
            <Badge variant={values.saml_allow_unsolicited === "true" ? "default" : "secondary"}>
              {values.saml_allow_unsolicited === "true"
                ? t("common.enabled", { defaultValue: "Enabled" })
                : t("common.disabled", { defaultValue: "Disabled" })}
            </Badge>
          ),
        },
        {
          label: t("settingsPages.sSOSettings.proxyBaseUrl", { defaultValue: "Proxy Base URL" }),
          render: (values: SSOSettingsValues) => renderSimpleValue(values.proxy_base_url),
        },
      ],
    },
  };

  const renderSSOSettings = () => {
    if (!ssoSettings?.values || !selectedProvider) return null;
    const config = providerConfigs[selectedProvider as keyof typeof providerConfigs];
    if (!config) return null;

    return (
      <dl className="divide-y divide-border overflow-hidden rounded-md border border-border">
        <DetailRow label={t("settingsPages.sSOSettings.provider", { defaultValue: "Provider" })}>
          <div className="flex items-center gap-2">
            {ssoProviderLogoMap[selectedProvider] && (
              <Logo
                src={ssoProviderLogoMap[selectedProvider]}
                label={ssoProviderDisplayNames[selectedProvider] || selectedProvider}
                className="size-6 object-contain"
              />
            )}
            <span>{config.providerText}</span>
          </div>
        </DetailRow>
        {config.fields.map(
          (field) =>
            field && (
              <DetailRow key={field.label} label={field.label}>
                {field.render(ssoSettings.values)}
              </DetailRow>
            ),
        )}
      </dl>
    );
  };

  return (
    <>
      {isLoading ? (
        <SSOSettingsLoadingSkeleton />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="size-6 text-muted-foreground" />
                <div>
                  <CardTitle>
                    <h3>{t("settingsPages.sSOSettings.title", { defaultValue: "SSO Configuration" })}</h3>
                  </CardTitle>
                  <CardDescription>
                    {t("settingsPages.sSOSettings.subtitle", {
                      defaultValue: "Manage Single Sign-On authentication settings",
                    })}
                  </CardDescription>
                </div>
              </div>
              {isSSOConfigured && (
                <CardAction className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalVisible(true)}>
                    <Edit />
                    {t("settingsPages.sSOSettings.editSSOSettings", { defaultValue: "Edit SSO Settings" })}
                  </Button>
                  <Button type="button" variant="destructive" onClick={() => setIsDeleteModalVisible(true)}>
                    <Trash2 />
                    {t("settingsPages.sSOSettings.deleteSSOSettings", { defaultValue: "Delete SSO Settings" })}
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              {isSSOConfigured ? (
                renderSSOSettings()
              ) : (
                <SSOSettingsEmptyPlaceholder onAdd={() => setIsAddModalVisible(true)} />
              )}
            </CardContent>
          </Card>
          {isRoleMappingsEnabled && <RoleMappings roleMappings={ssoSettings?.values.role_mappings} />}
        </div>
      )}

      <DeleteSSOSettingsModal
        isVisible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        onSuccess={() => refetch()}
      />
      <AddSSOSettingsModal
        isVisible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSuccess={() => {
          setIsAddModalVisible(false);
          refetch();
        }}
      />
      <EditSSOSettingsModal
        isVisible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => {
          setIsEditModalVisible(false);
          refetch();
        }}
      />
    </>
  );
}
