import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  vectorStoreListCall,
  vectorStoreDeleteCall,
  credentialListCall,
  CredentialItem,
} from "@/components/networking";
import { VectorStore } from "@/components/vector_store_management/types";
import VectorStoreTable from "./VectorStoreTable";
import VectorStoreForm from "./VectorStoreForm";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import VectorStoreInfoView from "./vector_store_info";
import CreateVectorStore from "./CreateVectorStore";
import TestVectorStoreTab from "./TestVectorStoreTab";
import IndexesTab from "./IndexesTab";
import { isAdminRole, isProxyAdminRole } from "@/utils/roles";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVisitedTabs } from "@/hooks/useVisitedTabs";

interface VectorStoreProps {
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
  isViewOnly: boolean;
}

const VectorStoreManagement: React.FC<VectorStoreProps> = ({ accessToken, userID, userRole, isViewOnly }) => {
  const { t } = useTranslation();
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [isLoadingVectorStores, setIsLoadingVectorStores] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vectorStoreToDelete, setVectorStoreToDelete] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState("");
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);
  const [selectedVectorStoreId, setSelectedVectorStoreId] = useState<string | null>(null);
  const [editVectorStore, setEditVectorStore] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canCreateVectorStores = isProxyAdminRole(userRole || "") && !isViewOnly;
  const defaultTab = canCreateVectorStores ? "create" : "manage";
  const { onTabChange, hasVisited } = useVisitedTabs(defaultTab);

  const fetchVectorStores = async () => {
    if (!accessToken) {
      setIsLoadingVectorStores(false);
      return;
    }
    try {
      const response = await vectorStoreListCall(accessToken);
      setVectorStores(response.data || []);
    } catch (error) {
      console.error("Error fetching vector stores:", error);
      toast.fromError(
        t("vectorStores.index.fetchVectorStoresError", {
          error: String(error),
          defaultValue: "Error fetching vector stores: {{error}}",
        }),
      );
    } finally {
      setIsLoadingVectorStores(false);
    }
  };

  const fetchCredentials = async () => {
    if (!accessToken || !canCreateVectorStores) return;
    try {
      const response = await credentialListCall(accessToken);
      setCredentials(response.credentials || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      toast.fromError(
        t("vectorStores.index.fetchCredentialsError", {
          error: String(error),
          defaultValue: "Error fetching credentials: {{error}}",
        }),
      );
    }
  };

  const handleRefreshClick = () => {
    fetchVectorStores();
    fetchCredentials();
    const currentDate = new Date();
    setLastRefreshed(currentDate.toLocaleString());
  };

  const handleDelete = async (vectorStoreId: string) => {
    setVectorStoreToDelete(vectorStoreId);
    setIsDeleteModalOpen(true);
  };

  const handleView = (vectorStoreId: string) => {
    setSelectedVectorStoreId(vectorStoreId);
    setEditVectorStore(false);
  };

  const handleEdit = (vectorStoreId: string) => {
    setSelectedVectorStoreId(vectorStoreId);
    setEditVectorStore(true);
  };

  const handleCloseInfo = () => {
    setSelectedVectorStoreId(null);
    setEditVectorStore(false);
    fetchVectorStores();
  };

  const confirmDelete = async () => {
    if (!accessToken || !vectorStoreToDelete) return;
    setIsDeleting(true);
    try {
      await vectorStoreDeleteCall(accessToken, vectorStoreToDelete);
      toast.success(
        t("vectorStoreManagement.index.deleteSuccess", { defaultValue: "Vector store deleted successfully" }),
      );
      fetchVectorStores();
    } catch (error) {
      console.error("Error deleting vector store:", error);
      toast.fromError(
        t("vectorStores.index.deleteError", {
          error: String(error),
          defaultValue: "Error deleting vector store: {{error}}",
        }),
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setVectorStoreToDelete(null);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalVisible(false);
    fetchVectorStores();
  };

  const handleVectorStoreCreated = (vectorStoreId: string) => {
    fetchVectorStores();
    // Optionally switch to the manage tab
  };

  useEffect(() => {
    fetchVectorStores();
    fetchCredentials();
  }, [accessToken]);

  return selectedVectorStoreId ? (
    <div className="w-full h-full">
      <VectorStoreInfoView
        vectorStoreId={selectedVectorStoreId}
        onClose={handleCloseInfo}
        accessToken={accessToken}
        is_admin={isAdminRole(userRole || "")}
        editVectorStore={editVectorStore}
      />
    </div>
  ) : (
    <div className="mx-4">
      <div className="gap-2 p-8 w-full mt-2">
        <div className="flex justify-between mt-2 w-full items-center mb-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t("vectorStoreManagement.index.pageTitle", { defaultValue: "Vector Store Management" })}
          </h1>
          <div className="flex items-center space-x-2">
            {lastRefreshed && (
              <p className="text-sm text-muted-foreground">
                {t("vectorStoreManagement.index.lastRefreshed", {
                  time: lastRefreshed,
                  defaultValue: "Last Refreshed: {{time}}",
                })}
              </p>
            )}
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t("common.refresh", { defaultValue: "Refresh" })}
              onClick={handleRefreshClick}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {t("vectorStoreManagement.index.pageDescription", {
            defaultValue: "You can use vector stores to store and retrieve LLM embeddings.",
          })}
        </p>

        <Tabs defaultValue={defaultTab} onValueChange={onTabChange}>
          <TabsList variant="line" className="mb-6 h-auto w-full justify-start rounded-none p-0">
            {canCreateVectorStores && (
              <TabsTrigger value="create" className="flex-none rounded-none px-4 py-2">
                {t("vectorStoreManagement.index.tabCreate", { defaultValue: "Create Vector Store" })}
              </TabsTrigger>
            )}
            <TabsTrigger value="manage" className="flex-none rounded-none px-4 py-2">
              {t("vectorStoreManagement.index.tabManage", { defaultValue: "Manage Vector Stores" })}
            </TabsTrigger>
            <TabsTrigger value="test" className="flex-none rounded-none px-4 py-2">
              {t("vectorStoreManagement.index.tabTest", { defaultValue: "Test Vector Store" })}
            </TabsTrigger>
            {isProxyAdminRole(userRole || "") && (
              <TabsTrigger value="indexes" className="flex-none rounded-none px-4 py-2">
                {t("vectorStores.index.tabIndexes", { defaultValue: "Indexes" })}
              </TabsTrigger>
            )}
          </TabsList>

          {canCreateVectorStores && (
            <TabsContent keepMounted={hasVisited("create")} value="create">
              <CreateVectorStore accessToken={accessToken} onSuccess={handleVectorStoreCreated} />
            </TabsContent>
          )}

          <TabsContent keepMounted={hasVisited("manage")} value="manage">
            {canCreateVectorStores && (
              <Button className="mb-4" onClick={() => setIsCreateModalVisible(true)}>
                {t("vectorStoreManagement.index.addVectorStore", { defaultValue: "+ Add Vector Store" })}
              </Button>
            )}

            <div className="grid grid-cols-1 gap-2 pt-2 pb-2 w-full mt-2">
              <VectorStoreTable
                data={vectorStores}
                isLoading={isLoadingVectorStores}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </TabsContent>

          <TabsContent keepMounted={hasVisited("test")} value="test">
            <TestVectorStoreTab accessToken={accessToken} vectorStores={vectorStores} />
          </TabsContent>

          {isProxyAdminRole(userRole || "") && (
            <TabsContent keepMounted={hasVisited("indexes")} value="indexes">
              <IndexesTab accessToken={accessToken} vectorStores={vectorStores} onViewVectorStore={handleView} />
            </TabsContent>
          )}
        </Tabs>

        {/* Create Vector Store Modal */}
        <VectorStoreForm
          isVisible={isCreateModalVisible}
          onCancel={() => setIsCreateModalVisible(false)}
          onSuccess={handleCreateSuccess}
          accessToken={accessToken}
          credentials={credentials}
        />

        {/* Delete Confirmation Modal */}
        <DeleteResourceModal
          isOpen={isDeleteModalOpen}
          title={t("vectorStoreManagement.index.deleteModalTitle", { defaultValue: "Delete Vector Store" })}
          message={t("vectorStoreManagement.index.deleteModalMessage", {
            defaultValue: "Are you sure you want to delete this vector store? This action cannot be undone.",
          })}
          resourceInformationTitle={t("vectorStoreManagement.index.deleteModalInfoTitle", {
            defaultValue: "Vector Store Information",
          })}
          resourceInformation={[
            {
              label: t("vectorStoreManagement.index.vectorStoreIdLabel", { defaultValue: "Vector Store ID" }),
              value: vectorStoreToDelete,
              code: true,
            },
          ]}
          onCancel={() => setIsDeleteModalOpen(false)}
          onOk={confirmDelete}
          confirmLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default VectorStoreManagement;
