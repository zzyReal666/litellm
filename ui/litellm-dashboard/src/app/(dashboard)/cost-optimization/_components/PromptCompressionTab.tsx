"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { Trans, useTranslation } from "react-i18next";
import { CircleHelp } from "lucide-react";
import { z } from "zod/v4";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGuardrailCall, getGuardrailsList } from "@/components/networking";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import { toast } from "@/lib/toast";
import {
  buildCompressionGuardrailPayload,
  compressionGuardrailsOf,
  GuardrailListItem,
  GuardrailListResponse,
} from "./helpers";

interface PromptCompressionTabProps {
  accessToken: string | null;
}

const compressionSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .min(1, t("costOptimization.promptCompressionTab.nameRequired", { defaultValue: "Name is required" })),
    apiBase: z
      .string()
      .min(1, t("costOptimization.promptCompressionTab.apiBaseRequired", { defaultValue: "API base is required" })),
    defaultOn: z.boolean(),
  });

type CompressionFormValues = z.infer<ReturnType<typeof compressionSchema>>;

const EMPTY_VALUES: CompressionFormValues = {
  name: "",
  apiBase: "",
  defaultOn: true,
};

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

const PromptCompressionTab: React.FC<PromptCompressionTabProps> = ({ accessToken }) => {
  const { t } = useTranslation();
  const form = useZodForm(
    useMemo(() => compressionSchema(t), [t]),
    { defaultValues: EMPTY_VALUES },
  );
  const [guardrails, setGuardrails] = useState<GuardrailListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadGuardrails = useCallback(() => {
    if (!accessToken) {
      return;
    }
    getGuardrailsList(accessToken)
      .then((response) => setGuardrails(compressionGuardrailsOf(response as GuardrailListResponse)))
      .catch((error) => {
        console.error("Failed to load compression guardrails:", error);
        toast.fromError(
          t("costOptimization.promptCompressionTab.failedToLoadGuardrails", {
            defaultValue: "Failed to load compression guardrails",
          }),
        );
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, t]);

  useEffect(() => {
    loadGuardrails();
  }, [loadGuardrails]);

  const handleAdd = async (values: CompressionFormValues) => {
    if (!accessToken) {
      return;
    }
    setIsSaving(true);
    try {
      await createGuardrailCall(
        accessToken,
        buildCompressionGuardrailPayload({
          name: values.name,
          apiBase: values.apiBase,
          defaultOn: values.defaultOn ?? true,
        }),
      );
      toast.success(
        t("costOptimization.promptCompressionTab.created", { defaultValue: "Compression guardrail created" }),
      );
      form.reset(EMPTY_VALUES);
      await loadGuardrails();
    } catch (error) {
      console.error("Failed to create compression guardrail:", error);
      toast.fromError(
        t("costOptimization.promptCompressionTab.failedToCreate", {
          defaultValue: "Failed to create compression guardrail",
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {t("costOptimization.promptCompressionTab.title", { defaultValue: "Headroom prompt compression" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            <Trans
              i18nKey="costOptimization.promptCompressionTab.description"
              defaults="Headroom is a native LiteLLM guardrail that compresses your prompts before they reach the model, so you pay for fewer input tokens. The tokens it removes are priced and shown on the Usage tab as compression savings. <a>Headroom setup docs</a>"
              components={{
                a: (
                  <a
                    href="https://docs.litellm.ai/docs/proxy/headroom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-info underline"
                  />
                ),
              }}
            />
          </p>
          {isLoading && (
            <p className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: "Loading..." })}</p>
          )}
          {!isLoading && guardrails.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("costOptimization.promptCompressionTab.noGuardrails", {
                defaultValue:
                  "No prompt compression guardrails configured yet. Add one below to start saving on input tokens",
              })}
            </p>
          )}
          {!isLoading && guardrails.length > 0 && (
            <ul className="divide-y divide-border">
              {guardrails.map((guardrail) => (
                <li key={guardrail.guardrail_id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{guardrail.guardrail_name}</p>
                    <p className="text-xs text-muted-foreground">{guardrail.litellm_params?.api_base ?? ""}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      guardrail.litellm_params?.default_on
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {guardrail.litellm_params?.default_on
                      ? t("costOptimization.promptCompressionTab.alwaysOn", { defaultValue: "Always on" })
                      : t("costOptimization.promptCompressionTab.optIn", { defaultValue: "Opt-in" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("costOptimization.promptCompressionTab.addTitle", {
              defaultValue: "Add Headroom compression guardrail",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            <form onSubmit={form.handleSubmit(handleAdd)} noValidate>
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="name"
                  label={t("guardrails.guardrailTable.colName", { defaultValue: "Name" })}
                >
                  {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="headroom-compression" />}
                </FormField>
                <FormField
                  control={form.control}
                  name="apiBase"
                  label={labelWithHint(
                    t("costOptimization.promptCompressionTab.apiBaseLabel", { defaultValue: "Headroom API base" }),
                    t("costOptimization.promptCompressionTab.apiBaseHint", {
                      defaultValue:
                        "Base URL of your Headroom compression service (LiteLLM calls its /v1/compress endpoint)",
                    }),
                  )}
                  description={t("costOptimization.promptCompressionTab.apiBaseDescription", {
                    defaultValue: "The URL where your Headroom compression service is hosted",
                  })}
                >
                  {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="https://your-headroom-endpoint" />}
                </FormField>
                <FormField
                  control={form.control}
                  name="defaultOn"
                  label={t("costOptimization.promptCompressionTab.applyToAllRequests", {
                    defaultValue: "Apply to all requests",
                  })}
                >
                  {({ value, onChange, ref: _ref, ...field }) => (
                    <Switch
                      {...field}
                      nativeButton
                      render={<button type="button" />}
                      checked={value}
                      onCheckedChange={onChange}
                    />
                  )}
                </FormField>
              </FieldGroup>
              <div className="mt-6 mb-4 rounded-lg border border-warning/20 bg-warning/10 p-3">
                <p className="text-sm text-warning">
                  <Trans
                    i18nKey="costOptimization.promptCompressionTab.enterpriseNotice"
                    defaults="Applying compression to all requests is available to all users. Enabling it selectively per key or team is a LiteLLM Enterprise feature. Get a trial key <a>here</a>"
                    components={{
                      a: (
                        <a
                          href="https://www.litellm.ai/#pricing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        />
                      ),
                    }}
                  />
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <UiLoadingSpinner className="size-4" />}
                  {t("costOptimization.promptCompressionTab.addGuardrail", { defaultValue: "Add guardrail" })}
                </Button>
              </div>
            </form>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptCompressionTab;
