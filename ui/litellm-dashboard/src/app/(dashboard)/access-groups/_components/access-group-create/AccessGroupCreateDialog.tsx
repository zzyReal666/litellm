"use client";

import i18n from "@/lib/i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BotIcon, InfoIcon, LayersIcon, ServerIcon } from "lucide-react";
import * as React from "react";

import { accessGroupKeys } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";
import { useAgents } from "@/app/(dashboard)/hooks/agents/useAgents";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { buildAccessGroupCreateBody, emptyAccessGroupFormValues, type AccessGroupCreateBody } from "./mapper";
import { accessGroupCreateSchema } from "./schema";

const GENERAL_TAB = "general";

const defaultCreateAccessGroup = async (body: AccessGroupCreateBody): Promise<unknown> => {
  const { data } = await fetchClient.POST("/v1/access_group", { body });
  return data;
};

interface AccessGroupCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createAccessGroup?: (body: AccessGroupCreateBody) => Promise<unknown>;
}

export const AccessGroupCreateDialog = ({
  open,
  onOpenChange,
  createAccessGroup = defaultCreateAccessGroup,
}: AccessGroupCreateDialogProps) => {
  const queryClient = useQueryClient();
  const form = useZodForm(accessGroupCreateSchema, { defaultValues: emptyAccessGroupFormValues });
  const [activeTab, setActiveTab] = React.useState(GENERAL_TAB);

  const { data: agentsData } = useAgents();
  const { data: mcpServersData } = useMCPServers();

  const mcpServerOptions = (mcpServersData ?? []).map((server) => ({
    value: server.server_id,
    label: server.server_name ?? server.server_id,
  }));
  const agentOptions = (agentsData?.agents ?? []).map((agent) => ({
    value: agent.agent_id,
    label: agent.agent_name,
  }));

  const closeAndReset = () => {
    form.reset(emptyAccessGroupFormValues);
    setActiveTab(GENERAL_TAB);
    onOpenChange(false);
  };

  const mutation = useMutation({
    mutationFn: (body: AccessGroupCreateBody) => createAccessGroup(body),
    onSuccess: () => {
      toast.success(i18n.t("accessGroups.accessGroupCreateModal.createSuccess", { defaultValue: "Access group created successfully" }));
      queryClient.invalidateQueries({ queryKey: accessGroupKeys.all });
      closeAndReset();
    },
    onError: (error: unknown) =>
      toast.fromError(error instanceof Error ? error.message: i18n.t("accessGroups.accessGroupCreateModal.createError", { defaultValue: "Failed to create access group" })),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && mutation.isPending) return;
    if (!nextOpen) {
      form.reset(emptyAccessGroupFormValues);
      setActiveTab(GENERAL_TAB);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      if (mutation.isPending) return;
      mutation.mutate(buildAccessGroupCreateBody(values));
    },
    // the only validated field (name) lives on the General Info tab
    () => setActiveTab(GENERAL_TAB),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{i18n.t("accessGroups.accessGroupCreateModal.title", { defaultValue: "Create Access Group" })}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value={GENERAL_TAB}>
                <InfoIcon />
                {i18n.t("accessGroups.accessGroupBaseForm.tabGeneralInfo", { defaultValue: "General Info" })}
              </TabsTrigger>
              <TabsTrigger value="models">
                <LayersIcon />
                {i18n.t("accessGroups.accessGroupBaseForm.tabModels", { defaultValue: "Models" })}
              </TabsTrigger>
              <TabsTrigger value="mcp-servers">
                <ServerIcon />
                {i18n.t("accessGroups.accessGroupBaseForm.tabMcpServers", { defaultValue: "MCP Servers" })}
              </TabsTrigger>
              <TabsTrigger value="agents">
                <BotIcon />
                {i18n.t("accessGroups.accessGroupBaseForm.tabAgents", { defaultValue: "Agents" })}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={GENERAL_TAB} className="pt-4">
              <FieldGroup>
                <FormField control={form.control} name="name" label={i18n.t("accessGroups.accessGroupBaseForm.labelGroupName", { defaultValue: "Group Name" })}>
                  {({ ref, ...field }) => <Input {...field} ref={ref} placeholder={i18n.t("accessGroups.accessGroupBaseForm.namePlaceholder", { defaultValue: "e.g. Engineering Team" })} />}
                </FormField>
                <FormField control={form.control} name="description" label={i18n.t("common.description", { defaultValue: "Description" })}>
                  {({ ref, ...field }) => (
                    <Textarea
                      {...field}
                      ref={ref}
                      rows={4}
                      placeholder={i18n.t("accessGroups.accessGroupBaseForm.descriptionPlaceholder", { defaultValue: "Describe the purpose of this access group..." })}
                    />
                  )}
                </FormField>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="models" className="pt-4">
              <FormField control={form.control} name="modelIds" label={i18n.t("accessGroups.accessGroupBaseForm.labelAllowedModels", { defaultValue: i18n.t("tagManagement.tagInfo.allowedModelsLabel", { defaultValue: "Allowed Models" }) })}>
                {(field) => <ModelSelect context="global" value={field.value} onChange={field.onChange} />}
              </FormField>
            </TabsContent>

            <TabsContent value="mcp-servers" className="pt-4">
              <FormField control={form.control} name="mcpServerIds" label={i18n.t("accessGroups.accessGroupBaseForm.labelAllowedMcpServers", { defaultValue: "Allowed MCP Servers" })}>
                {({ id, value, onChange }) => (
                  <MultiSelect
                    id={id}
                    value={value}
                    onValueChange={onChange}
                    options={mcpServerOptions}
                    placeholder={i18n.t("accessGroups.accessGroupBaseForm.mcpServersPlaceholder", { defaultValue: "Select MCP servers" })}
                  />
                )}
              </FormField>
            </TabsContent>

            <TabsContent value="agents" className="pt-4">
              <FormField control={form.control} name="agentIds" label={i18n.t("accessGroups.accessGroupBaseForm.labelAllowedAgents", { defaultValue: "Allowed Agents" })}>
                {({ id, value, onChange }) => (
                  <MultiSelect
                    id={id}
                    value={value}
                    onValueChange={onChange}
                    options={agentOptions}
                    placeholder={i18n.t("accessGroups.accessGroupBaseForm.agentsPlaceholder", { defaultValue: "Select agents" })}
                  />
                )}
              </FormField>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {i18n.t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? i18n.t("addPassThrough.creating", { defaultValue: "Creating..." }) : i18n.t("accessGroups.accessGroupCreateModal.okText", { defaultValue: "Create Group" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
