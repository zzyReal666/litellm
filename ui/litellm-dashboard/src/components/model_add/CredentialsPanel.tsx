"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useCredentials } from "@/app/(dashboard)/hooks/credentials/useCredentials";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import {
  credentialCreateCall,
  credentialDeleteCall,
  CredentialItem,
  credentialUpdateCall,
} from "@/components/networking";
import { Button } from "@/components/ui/button";
import { stripMaskedSecrets } from "@/utils/maskedSecretUtils";
import { isProxyAdminRole } from "@/utils/roles";

import DeleteResourceModal from "../common_components/DeleteResourceModal";
import { toast } from "@/lib/toast";
import CredentialModal from "./CredentialModal";
import CredentialsTable from "./CredentialsTable";

const restrictedFields = ["credential_name", "custom_llm_provider"];

const buildCredential = (values: Record<string, unknown>, credentialValues: Record<string, unknown>) => ({
  credential_name: values.credential_name as string,
  credential_values: credentialValues,
  credential_info: {
    custom_llm_provider: values.custom_llm_provider as string,
  },
});

const withoutRestrictedFields = (values: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(values).filter(([key]) => !restrictedFields.includes(key)));

export default function CredentialsPanel() {
  const { t } = useTranslation();
  const { accessToken, userRole } = useAuthorized();
  // Admin Viewer follows the read-parity rule: see credentials, do not modify.
  const canModifyCredentials = isProxyAdminRole(userRole ?? "");
  const { data: credentialsResponse, isLoading, refetch: refetchCredentials } = useCredentials();
  const credentialList = credentialsResponse?.credentials || [];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<CredentialItem | null>(null);
  const [credentialToDelete, setCredentialToDelete] = useState<CredentialItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCredentialDeleting, setIsCredentialDeleting] = useState(false);

  const handleUpdateCredential = async (values: Record<string, unknown>) => {
    if (!accessToken) {
      return;
    }
    try {
      const newCredential = buildCredential(values, stripMaskedSecrets(withoutRestrictedFields(values)));
      await credentialUpdateCall(accessToken, values.credential_name as string, newCredential);
      toast.success(t("modelAdd.credentials.updatedSuccess", { defaultValue: "Credential updated successfully" }));
      setIsUpdateModalOpen(false);
      await refetchCredentials();
    } catch (error) {
      toast.error(t("modelAdd.credentials.updateFailed", { defaultValue: "Failed to update credential" }));
    }
  };

  const handleAddCredential = async (values: Record<string, unknown>) => {
    if (!accessToken) {
      return;
    }
    try {
      const newCredential = buildCredential(values, withoutRestrictedFields(values));
      await credentialCreateCall(accessToken, newCredential);
      toast.success(t("modelAdd.credentials.addedSuccess", { defaultValue: "Credential added successfully" }));
      setIsAddModalOpen(false);
      await refetchCredentials();
    } catch (error) {
      toast.error(t("modelAdd.credentials.addFailed", { defaultValue: "Failed to add credential" }));
    }
  };

  const handleDeleteCredential = async () => {
    if (!accessToken || !credentialToDelete) {
      return;
    }
    setIsCredentialDeleting(true);
    try {
      await credentialDeleteCall(accessToken, credentialToDelete.credential_name);
      toast.success(t("modelAdd.credentials.deletedSuccess", { defaultValue: "Credential deleted successfully" }));
      await refetchCredentials();
    } catch (error) {
      toast.error(t("modelAdd.credentials.deleteFailed", { defaultValue: "Failed to delete credential" }));
    } finally {
      setCredentialToDelete(null);
      setIsDeleteModalOpen(false);
      setIsCredentialDeleting(false);
    }
  };

  const openEditModal = (credential: CredentialItem) => {
    setSelectedCredential(credential);
    setIsUpdateModalOpen(true);
  };

  const openDeleteModal = (credential: CredentialItem) => {
    setCredentialToDelete(credential);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setCredentialToDelete(null);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="mx-auto flex w-full flex-auto flex-col gap-4 overflow-y-auto p-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t("modelAdd.credentials.configuredCredentials", {
            defaultValue: "Configured credentials for different AI providers. Add and manage your API credentials.",
          })}
        </p>
        {canModifyCredentials && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="size-4" />
            {t("modelAdd.credentials.addCredential", { defaultValue: "Add Credential" })}
          </Button>
        )}
      </div>

      <CredentialsTable
        credentials={credentialList}
        canModifyCredentials={canModifyCredentials}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        isLoading={isLoading}
      />

      {isAddModalOpen && (
        <CredentialModal
          mode="add"
          onSubmit={handleAddCredential}
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
        />
      )}
      {isUpdateModalOpen && (
        <CredentialModal
          mode="edit"
          open={isUpdateModalOpen}
          existingCredential={selectedCredential}
          onSubmit={handleUpdateCredential}
          onCancel={() => setIsUpdateModalOpen(false)}
        />
      )}

      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        onCancel={closeDeleteModal}
        onOk={handleDeleteCredential}
        title={t("modelAdd.credentials.deleteTitle", { defaultValue: "Delete Credential?" })}
        message={t("modelAdd.credentials.deleteMessage", {
          defaultValue:
            "Are you sure you want to delete this credential? This action cannot be undone and may break existing integrations.",
        })}
        resourceInformationTitle={t("modelAdd.credentials.credentialInformation", {
          defaultValue: "Credential Information",
        })}
        resourceInformation={[
          {
            label: t("modelAdd.credentials.credentialName", { defaultValue: "Credential Name" }),
            value: credentialToDelete?.credential_name,
          },
          {
            label: t("modelAdd.credentials.provider", { defaultValue: "Provider" }),
            value: credentialToDelete?.credential_info?.custom_llm_provider || "-",
          },
        ]}
        confirmLoading={isCredentialDeleting}
        requiredConfirmation={credentialToDelete?.credential_name}
      />
    </div>
  );
}
