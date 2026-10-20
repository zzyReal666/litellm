import React, { useState, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import TagInfoView from "./tag_info";
import { modelInfoCall } from "@/components/networking";
import { tagCreateCall, tagListCall, tagDeleteCall } from "@/components/networking";
import { Tag } from "@/components/tag_management/types";
import TagTable from "./TagTable";
import { toast } from "@/lib/toast";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import CreateTagModal from "./components/CreateTagModal";

interface ModelInfo {
  model_name: string;
  litellm_params: {
    model: string;
  };
  model_info: {
    id: string;
  };
}

interface TagProps {
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
}

const TagManagement: React.FC<TagProps> = ({ accessToken, userID, userRole }) => {
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [editTag, setEditTag] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("");
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  const fetchTags = async () => {
    if (!accessToken) {
      setIsLoadingTags(false);
      return;
    }
    try {
      const response = await tagListCall(accessToken);
      setTags(Object.values(response));
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.fromError(
        t("tagManagement.index.errorFetchingTags", { error, defaultValue: "Error fetching tags: {{error}}" }),
      );
    } finally {
      setIsLoadingTags(false);
    }
  };

  const handleRefreshClick = () => {
    fetchTags();
    const currentDate = new Date();
    setLastRefreshed(currentDate.toLocaleString());
  };

  const handleCreate = async (formValues: any) => {
    if (!accessToken) return;
    try {
      await tagCreateCall(accessToken, {
        name: formValues.tag_name,
        description: formValues.description,
        models: formValues.allowed_llms,
        max_budget: formValues.max_budget,
        soft_budget: formValues.soft_budget,
        tpm_limit: formValues.tpm_limit,
        rpm_limit: formValues.rpm_limit,
        budget_duration: formValues.budget_duration,
      });
      toast.success(t("tagManagement.index.tagCreatedSuccess", { defaultValue: "Tag created successfully" }));
      setIsCreateModalVisible(false);
      fetchTags();
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.fromError(
        t("tagManagement.index.errorCreatingTag", { error, defaultValue: "Error creating tag: {{error}}" }),
      );
    }
  };

  const handleDelete = async (tagName: string) => {
    setTagToDelete(tagName);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!accessToken || !tagToDelete) return;
    setIsDeleting(true);
    try {
      await tagDeleteCall(accessToken, tagToDelete);
      toast.success(t("tagManagement.index.tagDeletedSuccess", { defaultValue: "Tag deleted successfully" }));
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.fromError(
        t("tagManagement.index.errorDeletingTag", { error, defaultValue: "Error deleting tag: {{error}}" }),
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setTagToDelete(null);
    }
  };

  useEffect(() => {
    if (userID && userRole && accessToken) {
      const fetchModels = async () => {
        try {
          const response = await modelInfoCall(accessToken, userID, userRole);
          if (response && response.data) {
            setAvailableModels(response.data);
          }
        } catch (error) {
          console.error("Error fetching models:", error);
          toast.fromError(
            t("tagManagement.index.errorFetchingModels", { error, defaultValue: "Error fetching models: {{error}}" }),
          );
        }
      };
      fetchModels();
    }
  }, [accessToken, userID, userRole]);

  useEffect(() => {
    fetchTags();
  }, [accessToken]);

  return (
    <div className="mx-4 h-full">
      {selectedTagId ? (
        <TagInfoView
          tagId={selectedTagId}
          onClose={() => {
            setSelectedTagId(null);
            setEditTag(false);
          }}
          accessToken={accessToken}
          is_admin={userRole === "Admin"}
          editTag={editTag}
        />
      ) : (
        <div className="flex h-full w-full flex-col p-8 pt-10">
          <div className="mt-2 mb-4 flex w-full items-center justify-between">
            <h1>{t("tagManagement.index.pageTitle", { defaultValue: "Tag Management" })}</h1>
            <div className="flex items-center space-x-2">
              {lastRefreshed && (
                <p className="text-sm">
                  <Trans
                    i18nKey="tagManagement.index.lastRefreshed"
                    values={{ time: lastRefreshed }}
                    defaults="Last Refreshed: {{time}}"
                  />
                </p>
              )}
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={t("tagManagement.index.refreshAriaLabel", { defaultValue: "Refresh tags" })}
                onClick={handleRefreshClick}
              >
                <RefreshCw />
              </Button>
            </div>
          </div>

          <div className="mb-4 text-sm">
            <Trans
              i18nKey="tagManagement.index.clickTagNameHint"
              defaults="Click on a tag name to view and edit its details."
            />
            <p>
              <Trans
                i18nKey="tagManagement.index.tagRoutingDescription"
                defaults="You can use tags to restrict the usage of certain LLMs based on tags passed in the request. Read more about tag routing <docsLink>here</docsLink>."
                components={{
                  docsLink: (
                    <a
                      href="https://docs.litellm.ai/docs/proxy/tag_routing"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                }}
              />
            </p>
          </div>

          <Button className="mb-4 self-start" onClick={() => setIsCreateModalVisible(true)}>
            {t("tagManagement.index.createNewTagButton", { defaultValue: "+ Create New Tag" })}
          </Button>

          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <TagTable
              data={tags}
              isLoading={isLoadingTags}
              onEdit={(tag) => {
                setSelectedTagId(tag.name);
                setEditTag(true);
              }}
              onDelete={handleDelete}
              onSelectTag={setSelectedTagId}
            />
          </div>

          {/* Create Tag Modal */}
          <CreateTagModal
            visible={isCreateModalVisible}
            onCancel={() => setIsCreateModalVisible(false)}
            onSubmit={handleCreate}
            availableModels={availableModels}
          />

          {/* Delete Confirmation Modal */}
          <DeleteResourceModal
            isOpen={isDeleteModalOpen}
            title={t("tagManagement.index.deleteTagTitle", { defaultValue: "Delete Tag" })}
            message={t("tagManagement.index.deleteTagConfirmDetailed", {
              defaultValue: "Are you sure you want to delete this tag? This action cannot be undone.",
            })}
            resourceInformationTitle={t("tagManagement.index.resourceInformationTitle", {
              defaultValue: "Tag Information",
            })}
            resourceInformation={[
              {
                label: t("tagManagement.tagTable.colTagName", { defaultValue: "Tag Name" }),
                value: tagToDelete,
                code: true,
              },
            ]}
            onCancel={() => {
              setIsDeleteModalOpen(false);
              setTagToDelete(null);
            }}
            onOk={confirmDelete}
            confirmLoading={isDeleting}
          />
        </div>
      )}
    </div>
  );
};

export default TagManagement;
