import { parseAsString, useQueryState } from "nuqs";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, Code, Plus } from "lucide-react";
import { getGuardrailsList, deleteGuardrailCall } from "@/components/networking";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import AddGuardrailForm from "./add_guardrail_form";
import GuardrailTable from "./guardrail_table";
import { isAdminRole } from "@/utils/roles";
import GuardrailInfoView from "./guardrail_info";
import GuardrailTestPlayground from "./GuardrailTestPlayground";
import { toast } from "@/lib/toast";
import { Guardrail } from "@/components/guardrails/types";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { formatGuardrailMode, getGuardrailLogoAndName } from "./guardrail_info_helpers";
import { CustomCodeModal } from "./custom_code";
import GuardrailGarden from "./guardrail_garden";
import { TeamGuardrailsTab } from "./TeamGuardrailsTab";

interface GuardrailsPanelProps {
  accessToken: string | null;
  userRole?: string;
}

interface GuardrailsResponse {
  guardrails: Guardrail[];
}

const GuardrailsPanel: React.FC<GuardrailsPanelProps> = ({ accessToken, userRole }) => {
  const { t } = useTranslation();
  const [guardrailsList, setGuardrailsList] = useState<Guardrail[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isCustomCodeModalVisible, setIsCustomCodeModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [guardrailToDelete, setGuardrailToDelete] = useState<Guardrail | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGuardrailId, setSelectedGuardrailId] = useQueryState(
    "guardrail",
    parseAsString.withOptions({ history: "push" }),
  );
  const isAdmin = userRole ? isAdminRole(userRole) : false;

  const fetchGuardrails = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response: GuardrailsResponse = await getGuardrailsList(accessToken);
      setGuardrailsList(response.guardrails);
    } catch (error) {
      console.error("Error fetching guardrails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardrails();
  }, [accessToken]);

  const closeGuardrailDetail = () => {
    void setSelectedGuardrailId(null, { history: "replace" });
  };

  const handleAddGuardrail = () => {
    if (selectedGuardrailId) {
      closeGuardrailDetail();
    }
    setIsAddModalVisible(true);
  };

  const handleAddCustomCodeGuardrail = () => {
    if (selectedGuardrailId) {
      closeGuardrailDetail();
    }
    setIsCustomCodeModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
  };

  const handleCloseCustomCodeModal = () => {
    setIsCustomCodeModalVisible(false);
  };

  const handleSuccess = () => {
    fetchGuardrails();
  };

  const handleDeleteClick = (guardrailId: string, guardrailName: string) => {
    const guardrail = guardrailsList.find((g) => g.guardrail_id === guardrailId) || null;
    setGuardrailToDelete(guardrail);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!guardrailToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await deleteGuardrailCall(accessToken, guardrailToDelete.guardrail_id);
      toast.success(
        t("guardrails.deleteSuccess", {
          name: guardrailToDelete.guardrail_name,
          defaultValue: 'Guardrail "{{name}}" deleted successfully',
        }),
      );
      await fetchGuardrails();
    } catch (error) {
      console.error("Error deleting guardrail:", error);
      toast.fromError(t("guardrails.deleteFailed", { defaultValue: "Failed to delete guardrail" }));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setGuardrailToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setGuardrailToDelete(null);
  };

  const providerDisplayName =
    guardrailToDelete && guardrailToDelete.litellm_params
      ? getGuardrailLogoAndName(guardrailToDelete.litellm_params.guardrail).displayName
      : undefined;

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      <Tabs defaultValue="guardrails">
        <TabsList variant="line">
          {isAdmin && (
            <>
              <TabsTrigger value="garden" className="flex-none">
                {t("guardrails.guardrailGardenTab", { defaultValue: "Guardrail Garden" })}
              </TabsTrigger>
              <TabsTrigger value="guardrails" className="flex-none">
                {t("guardrails.guardrailsTab", { defaultValue: "Guardrails" })}
              </TabsTrigger>
              <TabsTrigger value="playground" className="flex-none" disabled={!accessToken}>
                {t("guardrails.testPlaygroundTab", { defaultValue: "Test Playground" })}
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="submitted" className="flex-none">
            {t("guardrails.submittedGuardrailsTab", { defaultValue: "Submitted Guardrails" })}
          </TabsTrigger>
        </TabsList>

        {isAdmin && (
          <>
            <TabsContent value="garden" keepMounted>
              <GuardrailGarden accessToken={accessToken} onGuardrailCreated={handleSuccess} />
            </TabsContent>

            <TabsContent value="guardrails" keepMounted>
              <div className="flex justify-between items-center mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger disabled={!accessToken} className={cn(buttonVariants({ variant: "default" }))}>
                    <Plus />
                    {t("guardrails.addNewGuardrail", { defaultValue: "+ Add New Guardrail" })}
                    <ChevronDown />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={handleAddGuardrail}>
                      <Plus />
                      {t("guardrails.addProviderGuardrail", { defaultValue: "Add Provider Guardrail" })}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleAddCustomCodeGuardrail}>
                      <Code />
                      {t("guardrails.createCustomCodeGuardrail", { defaultValue: "Create Custom Code Guardrail" })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {selectedGuardrailId ? (
                <GuardrailInfoView
                  guardrailId={selectedGuardrailId}
                  onClose={closeGuardrailDetail}
                  accessToken={accessToken}
                  isAdmin={isAdmin}
                />
              ) : (
                <GuardrailTable
                  guardrailsList={guardrailsList}
                  isLoading={isLoading}
                  onDeleteClick={handleDeleteClick}
                  onGuardrailClick={(id) => void setSelectedGuardrailId(id)}
                />
              )}

              <AddGuardrailForm
                visible={isAddModalVisible}
                onClose={handleCloseModal}
                accessToken={accessToken}
                onSuccess={handleSuccess}
              />

              <CustomCodeModal
                visible={isCustomCodeModalVisible}
                onClose={handleCloseCustomCodeModal}
                accessToken={accessToken}
                onSuccess={handleSuccess}
              />

              <DeleteResourceModal
                isOpen={isDeleteModalOpen}
                title={t("guardrails.deleteGuardrailTitle", { defaultValue: "Delete Guardrail" })}
                message={t("guardrails.deleteGuardrailMessage", {
                  name: guardrailToDelete?.guardrail_name ?? "",
                  defaultValue: "Are you sure you want to delete guardrail: {{name}}? This action cannot be undone.",
                })}
                resourceInformationTitle={t("guardrails.guardrailInfoTitle", { defaultValue: "Guardrail Information" })}
                resourceInformation={[
                  { label: t("common.name", { defaultValue: "Name" }), value: guardrailToDelete?.guardrail_name },
                  {
                    label: t("guardrails.labelId", { defaultValue: "ID" }),
                    value: guardrailToDelete?.guardrail_id,
                    code: true,
                  },
                  {
                    label: t("guardrails.guardrailInfo.provider", { defaultValue: "Provider" }),
                    value: providerDisplayName,
                  },
                  {
                    label: t("guardrails.labelMode", { defaultValue: "Mode" }),
                    value: formatGuardrailMode(guardrailToDelete?.litellm_params.mode, t),
                  },
                  {
                    label: t("guardrails.labelDefaultOn", { defaultValue: "Default On" }),
                    value: guardrailToDelete?.litellm_params.default_on
                      ? t("common.yes", { defaultValue: "Yes" })
                      : t("common.no", { defaultValue: "No" }),
                  },
                ]}
                onCancel={handleDeleteCancel}
                onOk={handleDeleteConfirm}
                confirmLoading={isDeleting}
              />
            </TabsContent>

            <TabsContent value="playground" keepMounted>
              <GuardrailTestPlayground
                guardrailsList={guardrailsList}
                isLoading={isLoading}
                accessToken={accessToken}
                onClose={() => {}}
              />
            </TabsContent>
          </>
        )}

        <TabsContent value="submitted" keepMounted>
          <TeamGuardrailsTab accessToken={accessToken} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuardrailsPanel;
