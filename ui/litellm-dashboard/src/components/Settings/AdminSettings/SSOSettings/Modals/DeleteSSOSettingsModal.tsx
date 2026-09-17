import { useEditSSOSettings } from "@/app/(dashboard)/hooks/sso/useEditSSOSettings";
import { useSSOSettings } from "@/app/(dashboard)/hooks/sso/useSSOSettings";
import React from "react";
import DeleteResourceModal from "../../../../common_components/DeleteResourceModal";
import { toast } from "@/lib/toast";
import { parseErrorMessage } from "../../../../shared/errorUtils";
import { detectSSOProvider } from "../utils";
import { useTranslation } from "react-i18next";

interface DeleteSSOSettingsModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const DeleteSSOSettingsModal: React.FC<DeleteSSOSettingsModalProps> = ({ isVisible, onCancel, onSuccess }) => {
  const { t } = useTranslation();
  const { data: ssoSettings } = useSSOSettings();
  const { mutateAsync: editSSOSettings, isPending: isEditingSSOSettings } = useEditSSOSettings();

  // Handle clearing SSO settings
  const handleClearSSO = async () => {
    const clearSettings = {
      google_client_id: null,
      google_client_secret: null,
      microsoft_client_id: null,
      microsoft_client_secret: null,
      microsoft_tenant: null,
      generic_client_id: null,
      generic_client_secret: null,
      generic_authorization_endpoint: null,
      generic_token_endpoint: null,
      generic_userinfo_endpoint: null,
      saml_idp_metadata_url: null,
      saml_idp_metadata_xml: null,
      saml_sp_entity_id: null,
      saml_allow_unsolicited: null,
      proxy_base_url: null,
      user_email: null,
      sso_provider: null,
      role_mappings: null,
      team_mappings: null,
    };

    await editSSOSettings(clearSettings, {
      onSuccess: () => {
        toast.success(
          t("settingsPages.deleteSSOSettingsModal.clearSuccess", { defaultValue: "SSO settings cleared successfully" }),
        );
        onCancel();
        onSuccess();
      },
      onError: (error) => {
        toast.fromError(
          t("settingsPages.deleteSSOSettingsModal.clearFailed", {
            defaultValue: "Failed to clear SSO settings: {{error}}",
            error: String(parseErrorMessage(error)),
          }),
        );
      },
    });
  };

  return (
    <DeleteResourceModal
      isOpen={isVisible}
      title={t("settingsPages.deleteSSOSettingsModal.title", { defaultValue: "Confirm Clear SSO Settings" })}
      alertMessage={t("settingsPages.deleteSSOSettingsModal.alertMessage", {
        defaultValue: "This action cannot be undone.",
      })}
      message={t("settingsPages.deleteSSOSettingsModal.message", {
        defaultValue:
          "Are you sure you want to clear all SSO settings? Users will no longer be able to login using SSO after this change.",
      })}
      resourceInformationTitle={t("settingsPages.deleteSSOSettingsModal.resourceTitle", {
        defaultValue: "SSO Settings",
      })}
      resourceInformation={[
        {
          label: t("settingsPages.deleteSSOSettingsModal.providerLabel", { defaultValue: "Provider" }),
          value:
            (ssoSettings?.values && detectSSOProvider(ssoSettings?.values)) ||
            t("settingsPages.deleteSSOSettingsModal.providerDefault", { defaultValue: "Generic" }),
        },
      ]}
      onCancel={onCancel}
      onOk={handleClearSSO}
      confirmLoading={isEditingSSOSettings}
    />
  );
};

export default DeleteSSOSettingsModal;
