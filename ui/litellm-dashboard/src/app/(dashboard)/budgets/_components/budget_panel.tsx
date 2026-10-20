/**
 * The parent pane, showing list of budgets
 *
 */

import { Plus, Wallet } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { prism } from "react-syntax-highlighter/dist/esm/styles/prism";

import { useSyntaxTheme } from "@/hooks/useSyntaxTheme";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeleteResourceModal from "@/components/common_components/DeleteResourceModal";
import { toast } from "@/lib/toast";
import { useBudgetList, useDeleteBudget, budgetItem } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import BudgetModal from "./budget_modal";
import BudgetTable from "./BudgetTable";
import EditBudgetModal from "./edit_budget_modal";
import { CREATE_END_USER_CURL_COMMAND, CHAT_COMPLETIONS_CURL_COMMAND, OPENAI_SDK_PYTHON_CODE } from "./constants";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { isProxyAdminRole } from "@/utils/roles";

interface BudgetSettingsPageProps {
  accessToken: string | null;
}

const BudgetPanel: React.FC<BudgetSettingsPageProps> = ({ accessToken }) => {
  const { t } = useTranslation();
  const syntaxTheme = useSyntaxTheme(prism);
  const [isCreateModelVisible, setIsCreateModelVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<budgetItem | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const { userRole } = useAuthorized();
  // Admin Viewer follows the read-parity rule: see budgets, no writes.
  const canModify = isProxyAdminRole(userRole ?? "");

  const budgetList = useBudgetList();
  const deleteBudget = useDeleteBudget();

  // Stable identities keep the memoized column defs stable; new ones remount every header and cell.
  const handleEditCall = useCallback(
    (budget: budgetItem) => {
      if (accessToken == null) {
        return;
      }
      setSelectedBudget(budget);
      setIsEditModalVisible(true);
    },
    [accessToken],
  );

  const handleDeleteClick = useCallback((budget: budgetItem) => {
    setSelectedBudget(budget);
    setIsDeleteModalVisible(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!selectedBudget || accessToken == null) {
      return;
    }
    try {
      await deleteBudget.mutateAsync(selectedBudget.budget_id);
      toast.success(t("budgets.budgetPanel.budgetDeleted", { defaultValue: "Budget deleted." }));
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.fromError(t("budgets.budgetPanel.failedToDelete", { defaultValue: "Failed to delete budget" }));
    } finally {
      setIsDeleteModalVisible(false);
      setSelectedBudget(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
  };

  return (
    <main className="flex h-full flex-col p-8">
      <Tabs defaultValue="budgets" className="min-h-0 flex-1 gap-6">
        <PageHeader
          icon={<Wallet />}
          title={t("budgets.budgetPanel.tabBudgets", { defaultValue: "Budgets" })}
          subtitle={t("budgetsPage.budgetPanel.subtitle", {
            defaultValue: "Spend, TPM and RPM limits you can assign to customers.",
          })}
          primaryAction={
            canModify ? (
              <Button onClick={() => setIsCreateModelVisible(true)}>
                <Plus className="size-4" />
                {t("budgets.budgetModal.title", { defaultValue: "Create Budget" })}
              </Button>
            ) : undefined
          }
          tabs={({ leadingControls }) => (
            <TabsList
              variant="line"
              className="gap-0 p-0 [&>[data-slot=tabs-trigger]+[data-slot=tabs-trigger]]:ml-[22px]"
            >
              {leadingControls}
              <TabsTrigger value="budgets" className="flex-none px-0 py-[7px] data-active:font-semibold">
                {t("budgets.budgetPanel.tabBudgets", { defaultValue: "Budgets" })}
              </TabsTrigger>
              <TabsTrigger value="examples" className="flex-none px-0 py-[7px] data-active:font-semibold">
                {t("budgets.budgetPanel.tabExamples", { defaultValue: "Examples" })}
              </TabsTrigger>
            </TabsList>
          )}
        />
        <TabsContent value="budgets" className="flex min-h-0 flex-1 flex-col" keepMounted>
          <div className="flex min-h-0 flex-1 flex-col">
            <BudgetModal isModalVisible={isCreateModelVisible} setIsModalVisible={setIsCreateModelVisible} />
            {selectedBudget && (
              <EditBudgetModal
                isModalVisible={isEditModalVisible}
                setIsModalVisible={setIsEditModalVisible}
                existingBudget={selectedBudget}
              />
            )}
            <BudgetTable
              list={budgetList}
              canModify={canModify}
              onEditClick={handleEditCall}
              onDeleteClick={handleDeleteClick}
            />
            <DeleteResourceModal
              isOpen={isDeleteModalVisible}
              title={t("budgets.budgetPanel.deleteTitle", { defaultValue: "Delete Budget?" })}
              message={t("budgets.budgetPanel.deleteMessage", {
                defaultValue: "Are you sure you want to delete this budget? This action cannot be undone.",
              })}
              resourceInformationTitle={t("budgets.budgetPanel.budgetInformation", {
                defaultValue: "Budget Information",
              })}
              resourceInformation={[
                {
                  label: t("budgets.budgetPanel.colBudgetId", { defaultValue: "Budget ID" }),
                  value: selectedBudget?.budget_id,
                  code: true,
                },
                {
                  label: t("budgets.budgetPanel.colMaxBudget", { defaultValue: "Max Budget" }),
                  value: selectedBudget?.max_budget,
                },
                { label: t("budgets.budgetPanel.colTpm", { defaultValue: "TPM" }), value: selectedBudget?.tpm_limit },
                { label: t("budgets.budgetPanel.colRpm", { defaultValue: "RPM" }), value: selectedBudget?.rpm_limit },
              ]}
              onCancel={handleDeleteCancel}
              onOk={handleDeleteConfirm}
              confirmLoading={deleteBudget.isPending}
            />
          </div>
        </TabsContent>
        <TabsContent value="examples" className="min-h-0 flex-1 overflow-y-auto" keepMounted>
          <div className="pt-6">
            <p className="text-base text-muted-foreground">
              {t("budgets.budgetPanel.howToUseBudgetId", { defaultValue: "How to use budget id" })}
            </p>
            <Tabs defaultValue="assign-budget">
              <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b p-0">
                <TabsTrigger value="assign-budget" className="flex-none rounded-none px-4 py-2">
                  {t("budgets.budgetPanel.tabAssignBudget", { defaultValue: "Assign Budget to Customer" })}
                </TabsTrigger>
                <TabsTrigger value="curl" className="flex-none rounded-none px-4 py-2">
                  {t("budgets.budgetPanel.tabTestCurl", { defaultValue: "Test it (Curl)" })}
                </TabsTrigger>
                <TabsTrigger value="openai-sdk" className="flex-none rounded-none px-4 py-2">
                  {t("budgets.budgetPanel.tabTestSdk", { defaultValue: "Test it (OpenAI SDK)" })}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="assign-budget" keepMounted>
                <SyntaxHighlighter language="bash" style={syntaxTheme}>
                  {CREATE_END_USER_CURL_COMMAND}
                </SyntaxHighlighter>
              </TabsContent>
              <TabsContent value="curl" keepMounted>
                <SyntaxHighlighter language="bash" style={syntaxTheme}>
                  {CHAT_COMPLETIONS_CURL_COMMAND}
                </SyntaxHighlighter>
              </TabsContent>
              <TabsContent value="openai-sdk" keepMounted>
                <SyntaxHighlighter language="python" style={syntaxTheme}>
                  {OPENAI_SDK_PYTHON_CODE}
                </SyntaxHighlighter>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default BudgetPanel;
