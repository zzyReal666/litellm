import { updateGuardrailCall } from "@/components/networking";
import { toast } from "@/lib/toast";
import type { TFunction } from "i18next";

import { formatContentFilterDataForAPI } from "./content_filter/ContentFilterManager";
import { asText, type GuardrailFormValues } from "./GuardrailFormField";
import {
  guardrail_provider_map,
  skipSystemMessageToChoice,
  skipToolMessageToChoice,
  type SkipSystemMessageChoice,
  type SkipToolMessageChoice,
} from "./guardrail_info_helpers";
import { providerParamsForUpdate } from "./providerParamsForUpdate";
import type { ToolPermissionConfig } from "./tool_permission/ToolPermissionRulesEditor";

interface ContentFilterData {
  patterns: unknown[];
  blockedWords: unknown[];
  categories: unknown[];
  competitorIntentEnabled?: boolean;
  competitorIntentConfig?: unknown;
}

interface GuardrailUpdateContext {
  accessToken: string | null;
  guardrailId: string;
  guardrailData: any;
  guardrailProviderSpecificParams: any;
  values: GuardrailFormValues;
  selectedPiiEntities: string[];
  selectedPiiActions: { [key: string]: string };
  hasUnsavedContentFilterChanges: boolean;
  contentFilterData: ContentFilterData;
  toolPermissionConfig: ToolPermissionConfig;
  toolPermissionDirty: boolean;
  t: TFunction;
}

export const buildGuardrailUpdateData = ({
  accessToken,
  guardrailData,
  guardrailProviderSpecificParams,
  values,
  selectedPiiEntities,
  selectedPiiActions,
  hasUnsavedContentFilterChanges,
  contentFilterData,
  toolPermissionConfig,
  toolPermissionDirty,
}: GuardrailUpdateContext): Record<string, any> | null => {
  const updateData: any = {
    litellm_params: {},
  };

  if (values.guardrail_name !== guardrailData.guardrail_name) {
    updateData.guardrail_name = values.guardrail_name;
  }

  if (values.default_on !== guardrailData.litellm_params?.default_on) {
    updateData.litellm_params.default_on = values.default_on;
  }

  const prevSkipChoice = skipSystemMessageToChoice(guardrailData.litellm_params?.skip_system_message_in_guardrail);
  const nextSkipChoice = values.skip_system_message_choice as SkipSystemMessageChoice | undefined;
  if (nextSkipChoice !== undefined && nextSkipChoice !== prevSkipChoice) {
    if (nextSkipChoice === "inherit") {
      updateData.litellm_params.skip_system_message_in_guardrail = null;
    } else if (nextSkipChoice === "yes") {
      updateData.litellm_params.skip_system_message_in_guardrail = true;
    } else {
      updateData.litellm_params.skip_system_message_in_guardrail = false;
    }
  }

  const prevSkipToolChoice = skipToolMessageToChoice(guardrailData.litellm_params?.skip_tool_message_in_guardrail);
  const nextSkipToolChoice = values.skip_tool_message_choice as SkipToolMessageChoice | undefined;
  if (nextSkipToolChoice !== undefined && nextSkipToolChoice !== prevSkipToolChoice) {
    if (nextSkipToolChoice === "inherit") {
      updateData.litellm_params.skip_tool_message_in_guardrail = null;
    } else if (nextSkipToolChoice === "yes") {
      updateData.litellm_params.skip_tool_message_in_guardrail = true;
    } else {
      updateData.litellm_params.skip_tool_message_in_guardrail = false;
    }
  }

  const originalGuardrailInfo = guardrailData.guardrail_info;
  const newGuardrailInfo = values.guardrail_info ? JSON.parse(asText(values.guardrail_info)) : undefined;
  if (JSON.stringify(originalGuardrailInfo) !== JSON.stringify(newGuardrailInfo)) {
    updateData.guardrail_info = newGuardrailInfo;
  }

  const originalPiiConfig = guardrailData.litellm_params?.pii_entities_config || {};
  const newPiiEntitiesConfig: { [key: string]: string } = {};

  selectedPiiEntities.forEach((entity) => {
    newPiiEntitiesConfig[entity] = selectedPiiActions[entity] || "MASK";
  });

  if (JSON.stringify(originalPiiConfig) !== JSON.stringify(newPiiEntitiesConfig)) {
    updateData.litellm_params.pii_entities_config = newPiiEntitiesConfig;
  }

  if (guardrailData.litellm_params?.guardrail === "litellm_content_filter" && hasUnsavedContentFilterChanges) {
    const formattedData = formatContentFilterDataForAPI(
      (contentFilterData.patterns as any[]) || [],
      (contentFilterData.blockedWords as any[]) || [],
      (contentFilterData.categories as any[]) || [],
      contentFilterData.competitorIntentEnabled,
      contentFilterData.competitorIntentConfig as any,
    );

    updateData.litellm_params.patterns = formattedData.patterns;
    updateData.litellm_params.blocked_words = formattedData.blocked_words;
    updateData.litellm_params.categories = formattedData.categories;
    updateData.litellm_params.competitor_intent_config = formattedData.competitor_intent_config ?? null;
  }

  if (guardrailData.litellm_params?.guardrail === "tool_permission") {
    const originalRules = guardrailData.litellm_params?.rules || [];
    const currentRules = toolPermissionConfig.rules || [];
    const rulesChanged = JSON.stringify(originalRules) !== JSON.stringify(currentRules);

    const originalDefault = (guardrailData.litellm_params?.default_action || "deny").toLowerCase();
    const currentDefault = (toolPermissionConfig.default_action || "deny").toLowerCase();
    const defaultChanged = originalDefault !== currentDefault;

    const originalOnDisallowed = (guardrailData.litellm_params?.on_disallowed_action || "block").toLowerCase();
    const currentOnDisallowed = (toolPermissionConfig.on_disallowed_action || "block").toLowerCase();
    const onDisallowedChanged = originalOnDisallowed !== currentOnDisallowed;

    const originalMessage = guardrailData.litellm_params?.violation_message_template || "";
    const currentMessage = toolPermissionConfig.violation_message_template || "";
    const messageChanged = originalMessage !== currentMessage;

    if (toolPermissionDirty || rulesChanged || defaultChanged || onDisallowedChanged || messageChanged) {
      updateData.litellm_params.rules = currentRules;
      updateData.litellm_params.default_action = currentDefault;
      updateData.litellm_params.on_disallowed_action = currentOnDisallowed;
      updateData.litellm_params.violation_message_template = currentMessage || null;
    }
  }

  const currentProvider = Object.keys(guardrail_provider_map).find(
    (key) => guardrail_provider_map[key] === guardrailData.litellm_params?.guardrail,
  );
  const isToolPermissionGuardrail = guardrailData.litellm_params?.guardrail === "tool_permission";
  if (guardrailProviderSpecificParams && currentProvider && !isToolPermissionGuardrail) {
    const providerKey = guardrail_provider_map[currentProvider]?.toLowerCase();
    updateData.litellm_params = {
      ...updateData.litellm_params,
      ...providerParamsForUpdate({
        formValues: values,
        providerSpecificParams: guardrailProviderSpecificParams[providerKey] || {},
        originalParams: guardrailData.litellm_params ?? {},
      }),
    };
  }

  if (Object.keys(updateData.litellm_params).length === 0) {
    delete updateData.litellm_params;
  }

  return Object.keys(updateData).length === 0 ? null : updateData;
};

export const submitGuardrailUpdate = async (context: GuardrailUpdateContext): Promise<{ updated: boolean }> => {
  const { accessToken, guardrailId, t } = context;
  const noUpdate = { updated: false };

  try {
    const updateData = buildGuardrailUpdateData(context);

    if (updateData === null) {
      if (!accessToken) return noUpdate;
      toast.info(t("guardrails.guardrailInfo.noChanges", { defaultValue: "No changes detected" }));
      return noUpdate;
    }

    if (!accessToken) return noUpdate;

    await updateGuardrailCall(accessToken, guardrailId, updateData);
    toast.success(t("guardrails.guardrailInfo.updateSuccess", { defaultValue: "Guardrail updated successfully" }));
    return { updated: true };
  } catch (error) {
    console.error("Error updating guardrail:", error);
    toast.fromError(t("guardrails.guardrailInfo.updateFailed", { defaultValue: "Failed to update guardrail" }));
    return noUpdate;
  }
};
