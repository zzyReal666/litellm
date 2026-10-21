"use client";

import i18n from "@/lib/i18n";
import { BotIcon, InfoIcon, LayersIcon, ServerIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { useAgents } from "@/app/(dashboard)/hooks/agents/useAgents";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const accessGroupFormSchema = z.object({
  name: z.string().min(1, i18n.t("accessGroups.accessGroupBaseForm.nameRequired", { defaultValue: "Please enter the access group name" })),
  description: z.string(),
  modelIds: z.array(z.string()),
  mcpServerIds: z.array(z.string()),
  agentIds: z.array(z.string()),
});

export type AccessGroupFormValues = z.output<typeof accessGroupFormSchema>;

export const GENERAL_TAB = "general";
export const MODELS_TAB = "models";
export const MCP_SERVERS_TAB = "mcp-servers";
export const AGENTS_TAB = "agents";

interface AccessGroupBaseFormProps {
  form: UseFormReturn<AccessGroupFormValues>;
  isNameDisabled?: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AccessGroupBaseForm({
  form,
  isNameDisabled = false,
  activeTab,
  onTabChange,
}: AccessGroupBaseFormProps) {
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

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="w-full">
        <TabsTrigger value={GENERAL_TAB}>
          <InfoIcon size={16} />
          {i18n.t("accessGroups.accessGroupBaseForm.tabGeneralInfo", { defaultValue: "General Info" })}
        </TabsTrigger>
        <TabsTrigger value={MODELS_TAB}>
          <LayersIcon size={16} />
          {i18n.t("accessGroups.accessGroupBaseForm.tabModels", { defaultValue: "Models" })}
        </TabsTrigger>
        <TabsTrigger value={MCP_SERVERS_TAB}>
          <ServerIcon size={16} />
          {i18n.t("accessGroups.accessGroupBaseForm.tabMcpServers", { defaultValue: "MCP Servers" })}
        </TabsTrigger>
        <TabsTrigger value={AGENTS_TAB}>
          <BotIcon size={16} />
          {i18n.t("accessGroups.accessGroupBaseForm.tabAgents", { defaultValue: "Agents" })}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={GENERAL_TAB} className="pt-4">
        <FieldGroup>
          <FormField control={form.control} name="name" label={i18n.t("accessGroups.accessGroupBaseForm.labelGroupName", { defaultValue: "Group Name" })}>
            {({ ref, ...field }) => (
              <Input {...field} ref={ref} placeholder={i18n.t("accessGroups.accessGroupBaseForm.namePlaceholder", { defaultValue: "e.g. Engineering Team" })} disabled={isNameDisabled} />
            )}
          </FormField>
          <FormField control={form.control} name="description" label={i18n.t("common.description", { defaultValue: "Description" })}>
            {({ ref, ...field }) => (
              <Textarea {...field} ref={ref} rows={4} placeholder={i18n.t("accessGroups.accessGroupBaseForm.descriptionPlaceholder", { defaultValue: "Describe the purpose of this access group..." })} />
            )}
          </FormField>
        </FieldGroup>
      </TabsContent>

      <TabsContent value={MODELS_TAB} className="pt-4">
        <FormField control={form.control} name="modelIds" label={i18n.t("accessGroups.accessGroupBaseForm.labelAllowedModels", { defaultValue: i18n.t("tagManagement.tagInfo.allowedModelsLabel", { defaultValue: "Allowed Models" }) })}>
          {(field) => <ModelSelect context="global" value={field.value} onChange={field.onChange} />}
        </FormField>
      </TabsContent>

      <TabsContent value={MCP_SERVERS_TAB} className="pt-4">
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

      <TabsContent value={AGENTS_TAB} className="pt-4">
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
  );
}
