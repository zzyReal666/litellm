"use client";

import React, { useState } from "react";
import { CircleHelp, Info, Plug } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { useWatch } from "react-hook-form";
import { z } from "zod/v4";

import { createPassThroughEndpoint } from "./networking";
import NumericalInput from "./shared/numerical_input";
import KeyValueInput, { type KeyValuePair } from "./key_value_input";
import QueryParamInput from "./query_param_input";
import { passThroughItem } from "./PassThroughSettings/PassThroughSettings";
import RoutePreview from "./route_preview";
import { toast } from "@/lib/toast";
import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import PassThroughSecuritySection from "./common_components/PassThroughSecuritySection";
import PassThroughGuardrailsSection from "./common_components/PassThroughGuardrailsSection";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const HTTP_METHOD_OPTIONS = HTTP_METHODS.map((method) => ({ label: method, value: method }));

type GuardrailSettings = Record<string, { request_fields?: string[]; response_fields?: string[] } | null>;

const keyValuePairsSchema = z.array(z.tuple([z.string(), z.string()]));

const passThroughFormSchema = z.object({
  path: z
    .string()
    .min(1, { error: () => i18n.t("addPassThrough.pathRequired", { defaultValue: "Path is required" }) })
    .regex(/^\//, { error: () => i18n.t("addPassThrough.pathRequired", { defaultValue: "Path is required" }) }),
  target: z
    .string()
    .min(1, { error: () => i18n.t("addPassThrough.targetUrlRequired", { defaultValue: "Target URL is required" }) })
    .pipe(
      z.url({
        error: () => i18n.t("addPassThrough.targetUrlInvalid", { defaultValue: "Please enter a valid URL" }),
      }),
    ),
  methods: z.array(z.string()).optional(),
  include_subpath: z.boolean(),
  headers: keyValuePairsSchema.refine((pairs) => pairs.some(([name]) => name !== ""), {
    error: () => i18n.t("addPassThrough.headersRequired", { defaultValue: "Please configure the headers" }),
  }),
  default_query_params: keyValuePairsSchema.optional(),
  auth: z.boolean().optional(),
  timeout: z.string().optional(),
  cost_per_request: z.string().optional(),
});

type PassThroughFormValues = z.output<typeof passThroughFormSchema>;

const emptyFormValues = {
  path: "",
  target: "",
  methods: undefined,
  include_subpath: true,
  headers: [],
  default_query_params: undefined,
  auth: undefined,
  timeout: undefined,
  cost_per_request: undefined,
} as unknown as PassThroughFormValues;

const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

const optionalText = (raw: string): string | undefined => (raw === "" ? undefined : raw);

const toRecord = (pairs: readonly KeyValuePair[]): Record<string, string> =>
  Object.fromEntries(pairs.filter(([name]) => name !== ""));

const optionalRecord = (pairs: readonly KeyValuePair[] | undefined): Record<string, string> | undefined => {
  const record = toRecord(pairs ?? []);
  return Object.keys(record).length > 0 ? record : undefined;
};

interface AddFallbacksProps {
  accessToken: string;
  passThroughItems: passThroughItem[];
  setPassThroughItems: React.Dispatch<React.SetStateAction<passThroughItem[]>>;
  premiumUser?: boolean;
}

const AddPassThroughEndpoint: React.FC<AddFallbacksProps> = ({
  accessToken,
  setPassThroughItems,
  passThroughItems,
  premiumUser = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [guardrails, setGuardrails] = useState<GuardrailSettings>({});
  const form = useZodForm(passThroughFormSchema, { defaultValues: emptyFormValues });
  const { t } = useTranslation();

  const pathValue = useWatch({ control: form.control, name: "path" });
  const targetValue = useWatch({ control: form.control, name: "target" });
  const includeSubpath = useWatch({ control: form.control, name: "include_subpath" });
  const selectedMethods = useWatch({ control: form.control, name: "methods" }) ?? [];

  const handleCancel = () => {
    form.reset(emptyFormValues);
    setGuardrails({});
    setIsModalVisible(false);
  };

  const addPassThrough = async (values: PassThroughFormValues) => {
    setIsLoading(true);
    try {
      const formValues = {
        path: values.path,
        target: values.target,
        methods: values.methods,
        include_subpath: values.include_subpath,
        headers: toRecord(values.headers),
        default_query_params: optionalRecord(values.default_query_params),
        ...(premiumUser ? { auth: values.auth } : {}),
        timeout: values.timeout,
        cost_per_request: values.cost_per_request,
        ...(Object.keys(guardrails).length > 0 ? { guardrails } : {}),
      };

      const response = await createPassThroughEndpoint(accessToken, formValues);
      const createdEndpoint = response.endpoints[0];

      setPassThroughItems([...passThroughItems, createdEndpoint]);

      toast.success(t("addPassThrough.createSuccess", { defaultValue: "Pass-through endpoint created successfully" }));
      form.reset(emptyFormValues);
      setGuardrails({});
      setIsModalVisible(false);
    } catch (error) {
      toast.fromError(
        t("addPassThrough.createFailed", {
          error: String(error),
          defaultValue: "Error creating pass-through endpoint: {{error}}",
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div>
        <Button className="mx-auto mb-4 mt-4" onClick={() => setIsModalVisible(true)}>
          {t("addPassThrough.addButton", { defaultValue: "+ Add Pass-Through Endpoint" })}
        </Button>
        <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
          <DialogContent className="top-8 max-h-[calc(100dvh-4rem)] translate-y-0 overflow-y-auto sm:max-w-[1000px]">
            <DialogHeader>
              <div className="flex items-center space-x-3 border-b border-border pb-4">
                <Plug className="size-5 text-info" />
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {t("addPassThrough.modalTitle", { defaultValue: "Add Pass-Through Endpoint" })}
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="mt-6">
              <Alert variant="info" className="mb-6">
                <Info />
                <AlertTitle>
                  {t("addPassThrough.alertMessage", { defaultValue: "What is a Pass-Through Endpoint?" })}
                </AlertTitle>
                <AlertDescription>
                  {t("addPassThrough.alertDescription", {
                    defaultValue:
                      "Route requests from your LiteLLM proxy to any external API. Perfect for custom models, image generation APIs, or any service you want to proxy through LiteLLM.",
                  })}
                </AlertDescription>
              </Alert>

              <form onSubmit={form.handleSubmit(addPassThrough)} className="space-y-6">
                <Card className="block p-5">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("addPassThrough.routeConfigTitle", { defaultValue: "Route Configuration" })}
                  </h3>
                  <p className="mb-5 text-sm text-muted-foreground">
                    {t("addPassThrough.routeConfigSubtitle", {
                      defaultValue: "Configure how requests to your domain will be forwarded to the target API",
                    })}
                  </p>

                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="path"
                      label={t("addPassThrough.pathPrefixLabel", { defaultValue: "Path Prefix" })}
                      description={t("addPassThrough.pathExample", {
                        defaultValue: "Example: /bria, /adobe-photoshop, /elasticsearch",
                      })}
                    >
                      {({ value, onChange, ...field }) => (
                        <Input
                          {...field}
                          placeholder="bria"
                          value={value ?? ""}
                          onChange={(event) => {
                            const raw = event.target.value;
                            onChange(raw && !raw.startsWith("/") ? "/" + raw : raw);
                          }}
                        />
                      )}
                    </FormField>

                    <FormField
                      control={form.control}
                      name="target"
                      label={t("addPassThrough.targetUrlLabel", { defaultValue: "Target URL" })}
                      description={t("addPassThrough.targetUrlExample", {
                        defaultValue: "Example:https://engine.prod.bria-api.com",
                      })}
                    >
                      {({ value, ...field }) => (
                        <Input {...field} placeholder="https://engine.prod.bria-api.com" value={value ?? ""} />
                      )}
                    </FormField>

                    <FormField
                      control={form.control}
                      name="methods"
                      label={labelWithHint(
                        t("addPassThrough.httpMethodsLabel", { defaultValue: "HTTP Methods (Optional)" }),
                        t("addPassThrough.httpMethodsTooltip", {
                          defaultValue:
                            "Select specific HTTP methods. Leave empty to support all methods (GET, POST, PUT, DELETE, PATCH). Useful when the same path needs different targets for different methods.",
                        }),
                      )}
                      description={
                        selectedMethods.length === 0
                          ? t("addPassThrough.allMethodsDefault", {
                              defaultValue: "All HTTP methods supported (default)",
                            })
                          : t("addPassThrough.selectedMethodsDesc", {
                              methods: selectedMethods.join(", "),
                              defaultValue: "Only {{methods}} requests will be routed to this endpoint",
                            })
                      }
                    >
                      {({ value, onChange, ref: _ref, ...field }) => (
                        <Select multiple items={HTTP_METHOD_OPTIONS} value={value ?? []} onValueChange={onChange}>
                          <SelectTrigger {...field} className="w-full">
                            <SelectValue
                              placeholder={t("addPassThrough.selectMethodsPlaceholder", {
                                defaultValue: "Select methods (leave empty for all)",
                              })}
                            >
                              {(selected: string[]) =>
                                selected.length === 0
                                  ? t("addPassThrough.selectMethodsPlaceholder", {
                                      defaultValue: "Select methods (leave empty for all)",
                                    })
                                  : selected.join(", ")
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {HTTP_METHODS.map((method) => (
                              <SelectItem key={method} value={method} title={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormField>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {t("addPassThrough.includeSubpathsLabel", { defaultValue: "Include Subpaths" })}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {t("addPassThrough.includeSubpathsDesc", {
                            defaultValue: "Forward all subpaths to the target API (recommended for REST APIs)",
                          })}
                        </div>
                      </div>
                      <FormField control={form.control} name="include_subpath">
                        {({ value, onChange, ref: _ref, ...field }) => (
                          <Switch {...field} checked={value} onCheckedChange={onChange} />
                        )}
                      </FormField>
                    </div>
                  </div>
                </Card>

                <RoutePreview pathValue={pathValue} targetValue={targetValue} includeSubpath={includeSubpath} />

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("addPassThrough.headersSectionTitle", { defaultValue: "Headers" })}
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    {t("addPassThrough.headersSectionSubtitle", {
                      defaultValue: "Add headers that will be sent with every request to the target API",
                    })}
                  </p>

                  <FormField
                    control={form.control}
                    name="headers"
                    label={labelWithHint(
                      t("addPassThrough.authHeadersLabel", { defaultValue: "Authentication Headers" }),
                      t("addPassThrough.authHeadersTooltip", {
                        defaultValue: "Authentication and other headers to forward with requests",
                      }),
                    )}
                    description={
                      <>
                        <span className="mb-1 block font-medium">
                          {t("addPassThrough.headersExtraTitle", {
                            defaultValue: "Add authentication tokens and other required headers",
                          })}
                        </span>
                        <span className="block">
                          {t("addPassThrough.headersExtraExamples", {
                            defaultValue: "Common examples: auth_token, Authorization, x-api-key",
                          })}
                        </span>
                      </>
                    }
                  >
                    {({ value, onChange }) => <KeyValueInput value={value} onChange={onChange} />}
                  </FormField>
                </Card>

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("addPassThrough.queryParamsSectionTitle", { defaultValue: "Default Query Parameters" })}
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    {t("addPassThrough.queryParamsSectionSubtitle", {
                      defaultValue:
                        "Add query parameters that will be automatically sent with every request to the target API",
                    })}
                  </p>

                  <FormField
                    control={form.control}
                    name="default_query_params"
                    label={labelWithHint(
                      t("addPassThrough.queryParamsLabel", { defaultValue: "Default Query Parameters (Optional)" }),
                      t("addPassThrough.queryParamsTooltip", {
                        defaultValue:
                          "Query parameters that will be added to all requests. Clients can override these by providing their own values.",
                      }),
                    )}
                    description={
                      <>
                        <span className="mb-1 block font-medium">
                          {t("addPassThrough.queryParamsExtraTitle", {
                            defaultValue: "Parameters are sent with all GET, POST, PUT, PATCH requests",
                          })}
                        </span>
                        <span className="block">
                          {t("addPassThrough.queryParamsExtraExamples", {
                            defaultValue:
                              "Client parameters override defaults. Examples: version=v1, format=json, key=default",
                          })}
                        </span>
                      </>
                    }
                  >
                    {({ value, onChange }) => <QueryParamInput value={value} onChange={onChange} />}
                  </FormField>
                </Card>

                <FormField control={form.control} name="auth">
                  {({ value, onChange }) => (
                    <PassThroughSecuritySection
                      premiumUser={premiumUser}
                      authEnabled={value ?? false}
                      onAuthChange={onChange}
                    />
                  )}
                </FormField>

                <PassThroughGuardrailsSection accessToken={accessToken} value={guardrails} onChange={setGuardrails} />

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("addPassThrough.performanceSectionTitle", { defaultValue: "Performance" })}
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    {t("addPassThrough.performanceSectionSubtitle", {
                      defaultValue: "Configure upstream request timeout for this endpoint",
                    })}
                  </p>

                  <FormField
                    control={form.control}
                    name="timeout"
                    label={labelWithHint(
                      t("passThroughInfo.timeoutLabel", { defaultValue: "Request Timeout (seconds)" }),
                      t("addPassThrough.timeoutTooltip", {
                        defaultValue:
                          "Max time to wait for the upstream API to respond. Leave empty to use general_settings.pass_through_request_timeout (default 600s).",
                      }),
                    )}
                    description={t("addPassThrough.timeoutDesc", {
                      defaultValue: "Use a higher value for slow upstream APIs (e.g. 1200 for long-running LLM calls)",
                    })}
                  >
                    {({ value, onChange, ref: _ref, ...field }) => (
                      <NumericalInput
                        {...field}
                        min={1}
                        step={1}
                        placeholder="600"
                        value={value ?? ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onChange(optionalText(event.target.value))
                        }
                      />
                    )}
                  </FormField>
                </Card>

                <Card className="block p-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {t("addPassThrough.billingSectionTitle", { defaultValue: "Billing" })}
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    {t("addPassThrough.billingSectionSubtitle", {
                      defaultValue: "Optional cost tracking for this endpoint",
                    })}
                  </p>

                  <FormField
                    control={form.control}
                    name="cost_per_request"
                    label={labelWithHint(
                      t("addPassThrough.costPerRequestLabel", { defaultValue: "Cost Per Request (USD)" }),
                      t("addPassThrough.costPerRequestTooltip", {
                        defaultValue: "Optional: Track costs for requests to this endpoint",
                      }),
                    )}
                    description={t("addPassThrough.costPerRequestExtra", {
                      defaultValue: "The cost charged for each request through this endpoint",
                    })}
                  >
                    {({ value, onChange, ref: _ref, ...field }) => (
                      <NumericalInput
                        {...field}
                        min={0}
                        step={0.001}
                        placeholder="2.0000"
                        value={value ?? ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onChange(optionalText(event.target.value))
                        }
                      />
                    )}
                  </FormField>
                </Card>

                <div className="flex items-center justify-end space-x-3 border-t border-border pt-6">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    {t("common.cancel", { defaultValue: "Cancel" })}
                  </Button>
                  <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
                    {isLoading && <UiLoadingSpinner className="size-4" />}
                    {isLoading
                      ? t("addPassThrough.creating", { defaultValue: "Creating..." })
                      : t("addPassThrough.modalTitle", { defaultValue: "Add Pass-Through Endpoint" })}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default AddPassThroughEndpoint;
