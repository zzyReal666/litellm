import i18n from "@/lib/i18n";
import { useTranslation } from "react-i18next";
import React, { useState, useEffect } from "react";
import { CircleHelp, Eye, EyeOff, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { useWatch } from "react-hook-form";
import { z } from "zod";
import { CredentialItem, vectorStoreCreateCall } from "@/components/networking";
import {
  VectorStoreProviders,
  vectorStoreProviderLogoMap,
  vectorStoreProviderMap,
  getProviderSpecificFields,
  getVectorStoreProviderLogoAndName,
  VectorStoreFieldConfig,
} from "@/components/vector_store_providers";
import { Logo } from "@/components/molecules/logo/Logo";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { SearchSelect } from "@/components/shared/SearchSelect";
import { credentialOptions } from "@/components/shared/credentialOptions";

const EMBEDDING_MODEL_RENAME_PROVIDERS = new Set(["milvus", "valkey", "mongodb"]);

export const buildVectorStoreLitellmParams = (
  provider: string,
  formValues: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    getProviderSpecificFields(provider)
      .filter(isSupportedProviderField)
      .map((field) => [
        EMBEDDING_MODEL_RENAME_PROVIDERS.has(provider) && field.name === "embedding_model"
          ? "litellm_embedding_model"
          : field.name,
        formValues[field.name],
      ]),
  );

interface VectorStoreFormProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  credentials: CredentialItem[];
}

const PROVIDER_FIELD_NAMES = [
  "api_base",
  "api_key",
  "vertex_project",
  "vertex_location",
  "vertex_collection_id",
  "vertex_engine_id",
  "embedding_model",
  "vector_bucket_name",
  "index_name",
  "aws_region_name",
  "mongodb_database",
  "mongodb_collection",
  "mongodb_embedding_field",
  "mongodb_text_field",
  "mongodb_num_candidates",
  "valkey_host",
  "valkey_port",
  "valkey_password",
  "valkey_ssl",
  "valkey_text_field",
  "valkey_embedding_field",
] as const;

type ProviderFieldName = (typeof PROVIDER_FIELD_NAMES)[number];

const isProviderFieldName = (name: string): name is ProviderFieldName =>
  (PROVIDER_FIELD_NAMES as readonly string[]).includes(name);

const optionalText = z.string().optional();

const vectorStoreShape = {
  custom_llm_provider: z.string().min(1, i18n.t("guardrails.editGuardrailForm.providerRequired", { defaultValue: "Please select a provider" })),
  vector_store_id: z.string().min(1, i18n.t("vectorStoreManagement.vectorStoreForm.vectorStoreIdRequired", { defaultValue: "Please input the vector store ID from your api provider" })),
  vector_store_name: optionalText,
  vector_store_description: optionalText,
  litellm_credential_name: z.string().nullable().optional(),
  api_base: optionalText,
  api_key: optionalText,
  vertex_project: optionalText,
  vertex_location: optionalText,
  vertex_collection_id: optionalText,
  vertex_engine_id: optionalText,
  embedding_model: optionalText,
  vector_bucket_name: optionalText,
  index_name: optionalText,
  aws_region_name: optionalText,
  mongodb_database: optionalText,
  mongodb_collection: optionalText,
  mongodb_embedding_field: optionalText,
  mongodb_text_field: optionalText,
  mongodb_num_candidates: optionalText,
  valkey_host: optionalText,
  valkey_port: optionalText,
  valkey_password: optionalText,
  valkey_ssl: optionalText,
  valkey_text_field: optionalText,
  valkey_embedding_field: optionalText,
};

const vectorStoreSchema = z.object(vectorStoreShape).superRefine((values, ctx) => {
  getProviderSpecificFields(values.custom_llm_provider)
    .filter((field) => field.required && isProviderFieldName(field.name) && !values[field.name])
    .forEach((field) =>
      ctx.addIssue({
        code: "custom",
        path: [field.name],
        message:
          field.type === "select"
            ? `Please select the ${field.label.toLowerCase()}`
            : `Please input the ${field.label.toLowerCase()}`,
      }),
    );
});

type VectorStoreFormValues = z.output<typeof vectorStoreSchema>;

const VECTOR_STORE_ID_PLACEHOLDERS: Record<string, string> = {
  vertex_rag_engine: '6917529027641081856 (corpus ID from Vertex AI / "RAG Engine" console)',
  "vertex_ai/search_api": 'my-datastore_1234567890 (data store ID from Vertex AI / "Agent Search" console)',
  valkey: i18n.t("vectorStores.vectorStoreForm.vectorStoreIdPlaceholderValkey", { defaultValue: "my-search-index (FT index name in Valkey)" }),
  mongodb: i18n.t("vectorStores.vectorStoreForm.vectorStoreIdPlaceholderMongoDb", { defaultValue: "my-vector-index (MongoDB Vector Search index name)" }),
};

const VERTEX_SEARCH_API_WITH_ENGINE_PLACEHOLDER = i18n.t("vectorStores.vectorStoreForm.vectorStoreIdPlaceholderVertexSearchWithEngine", { defaultValue: "Any identifier you'll use to reference this in 中安云科 AI 安全网关" });

const DEFAULT_VECTOR_STORE_ID_PLACEHOLDER = i18n.t("vectorStores.vectorStoreForm.vectorStoreIdPlaceholderDefault", { defaultValue: "Enter vector store ID from your provider" });

const EMPTY_VALUES: VectorStoreFormValues = {
  custom_llm_provider: "bedrock",
  vector_store_id: "",
  vertex_location: "global",
  mongodb_embedding_field: "embedding",
  mongodb_text_field: "text",
  valkey_port: "6379",
  valkey_ssl: "false",
  valkey_text_field: "text",
  valkey_embedding_field: "embedding",
};

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp aria-label="question-circle" className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<typeof InputGroupInput>>(
  (props, ref) => {
    const [revealed, setRevealed] = useState(false);
    return (
      <InputGroup>
        <InputGroupInput {...props} ref={ref} type={revealed ? "text" : "password"} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={revealed ? i18n.t("vectorStores.vectorStoreForm.hidePassword", { defaultValue: "Hide Password" }) : i18n.t("vectorStores.vectorStoreForm.showPassword", { defaultValue: "Show Password" })}
            onClick={() => setRevealed(!revealed)}
          >
            {revealed ? <EyeOff /> : <Eye />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

const VectorStoreForm: React.FC<VectorStoreFormProps> = ({
  isVisible,
  onCancel,
  onSuccess,
  accessToken,
  credentials,
}) => {
  const form = useZodForm(vectorStoreSchema, { defaultValues: EMPTY_VALUES });
  const [metadataJson, setMetadataJson] = useState("{}");
  const [selectedProvider, setSelectedProvider] = useState("bedrock");
  const [modelInfo, setModelInfo] = useState<ModelGroup[]>([]);
  const vertexEngineId = useWatch({ control: form.control, name: "vertex_engine_id" });

  useEffect(() => {
    if (!accessToken) return;

    const loadModels = async () => {
      try {
        const uniqueModels = await fetchAvailableModels(accessToken);
        if (uniqueModels.length > 0) {
          setModelInfo(uniqueModels);
        }
      } catch (error) {
        console.error("Error fetching model info:", error);
      }
    };

    loadModels();
  }, [accessToken]);

  const makeProviderChangeHandler = (onChange: (provider: string) => void) => (provider: string | null) => {
    if (provider === null) return;
    onChange(provider);
    setSelectedProvider(provider);
  };

  const handleCreate = async (formValues: VectorStoreFormValues) => {
    if (!accessToken) return;
    try {
      let metadata = {};
      try {
        metadata = metadataJson.trim() ? JSON.parse(metadataJson) : {};
      } catch (e) {
        toast.fromError(i18n.t("vectorStoreManagement.vectorStoreForm.invalidMetadataJson", { defaultValue: "Invalid JSON in metadata field" }));
        return;
      }

      await vectorStoreCreateCall(accessToken, {
        vector_store_id: formValues.vector_store_id,
        custom_llm_provider: formValues.custom_llm_provider,
        vector_store_name: formValues.vector_store_name,
        vector_store_description: formValues.vector_store_description,
        vector_store_metadata: metadata,
        litellm_credential_name: formValues.litellm_credential_name,
        litellm_params: buildVectorStoreLitellmParams(formValues.custom_llm_provider, formValues),
      });
      toast.success(i18n.t("vectorStoreManagement.vectorStoreForm.createSuccess", { defaultValue: "Vector store created successfully" }));
      form.reset(EMPTY_VALUES);
      setMetadataJson("{}");
      onSuccess();
    } catch (error) {
      console.error("Error creating vector store:", error);
      toast.fromError("Error creating vector store: " + error);
    }
  };

  const handleCancel = () => {
    form.reset(EMPTY_VALUES);
    setMetadataJson("{}");
    setSelectedProvider("bedrock");
    onCancel();
  };

  const vectorStoreIdPlaceholder =
    selectedProvider === "vertex_ai/search_api" && vertexEngineId
      ? VERTEX_SEARCH_API_WITH_ENGINE_PLACEHOLDER
      : VECTOR_STORE_ID_PLACEHOLDERS[selectedProvider] ?? DEFAULT_VECTOR_STORE_ID_PLACEHOLDER;

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{i18n.t("vectorStoreManagement.vectorStoreForm.modalTitle", { defaultValue: "Add New Vector Store" })}</DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={form.handleSubmit(handleCreate)}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="custom_llm_provider"
                label={labelWithHint(i18n.t("vectorStoreManagement.vectorStoreForm.providerLabel", { defaultValue: "Provider" }), i18n.t("vectorStoreManagement.vectorStoreForm.providerTooltip", { defaultValue: "Select the provider for this vector store" }))}
              >
                {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                  <Select value={value} onValueChange={makeProviderChangeHandler(onChange)}>
                    <SelectTrigger
                      id={id}
                      aria-invalid={ariaInvalid}
                      aria-describedby={ariaDescribedBy}
                      className="w-full"
                    >
                      <SelectValue>
                        {(provider: string) => {
                          const { displayName, logo } = getVectorStoreProviderLogoAndName(provider);
                          return (
                            <>
                              <Logo src={logo} label={displayName} className="w-5 h-5" />
                              <span>{displayName}</span>
                            </>
                          );
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VectorStoreProviders).map(([providerEnum, providerDisplayName]) => (
                        <SelectItem key={providerEnum} value={vectorStoreProviderMap[providerEnum]}>
                          <Logo
                            src={vectorStoreProviderLogoMap[providerDisplayName]}
                            label={providerDisplayName}
                            className="w-5 h-5"
                          />
                          <span>{providerDisplayName}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>

              {selectedProvider === "pg_vector" && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{i18n.t("vectorStoreManagement.vectorStoreForm.pgVectorAlertTitle", { defaultValue: "PG Vector Setup Required" })}</AlertTitle>
                  <AlertDescription>
                    <p>{i18n.t("vectorStoreManagement.vectorStoreForm.pgVectorAlertDescription", { defaultValue: "中安云科 AI 安全网关 provides a server to connect to PG Vector. To use this provider:" })}</p>
                    <ol style={{ marginLeft: "16px", marginTop: "8px", listStyleType: "decimal" }}>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.pgVectorStep1Deploy", { defaultValue: "Deploy the litellm-pgvector server from:" })}{" "}
                        
                      </li>
                      <li>{i18n.t("vectorStoreManagement.vectorStoreForm.pgVectorStep2", { defaultValue: "Configure your PostgreSQL database with pgvector extension" })}</li>
                      <li>{i18n.t("vectorStoreManagement.vectorStoreForm.pgVectorStep3", { defaultValue: "Start the server and note the API base URL and API key" })}</li>
                      <li>{i18n.t("vectorStoreManagement.vectorStoreForm.pgVectorStep4", { defaultValue: "Enter those details in the fields below" })}</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              {selectedProvider === "valkey" && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{i18n.t("vectorStores.vectorStoreForm.valkeyAlertTitle", { defaultValue: "Valkey Setup Required" })}</AlertTitle>
                  <AlertDescription>
                    <p>
                      {i18n.t("vectorStoreManagement.vectorStoreForm.valkeyIntro", {
                        defaultValue:
                          "中安云科 AI 安全网关 searches documents you have already stored in Valkey. It does not create the index or upload documents for you. Before creating this vector store, make sure:",
                      })}
                    </p>
                    <ol style={{ marginLeft: "16px", marginTop: "8px", listStyleType: "decimal" }}>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.valkeyRequirement1", {
                          defaultValue:
                            "Your Valkey server has vector search enabled (the valkey-search module, included in the valkey-bundle image and in AWS ElastiCache / MemoryDB for Valkey)",
                        })}
                      </li>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.valkeyRequirement2", {
                          defaultValue:
                            "You have already created a search index and loaded your documents and their embeddings into it. Enter that index name as the Vector Store ID",
                        })}
                      </li>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.valkeyRequirement3", {
                          defaultValue:
                            "You know which embedding model created those stored embeddings. That model must be added to this proxy under Models so you can pick it below. Using a different model returns wrong results",
                        })}
                      </li>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.valkeyRequirement4", {
                          defaultValue:
                            'You know the field names your documents use for their text and their embedding. If they are not "text" and "embedding", set them below',
                        })}
                      </li>
                    </ol>
                    <p style={{ marginTop: "8px" }}>
                      {i18n.t("vectorStoreManagement.vectorStoreForm.valkeyQueryNote", {
                        defaultValue:
                          "When a query comes in, 中安云科 AI 安全网关 converts it to an embedding with the model below and returns the closest matching documents from your index.",
                      })}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {selectedProvider === "vertex_rag_engine" && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{i18n.t("vectorStoreManagement.vectorStoreForm.vertexRagAlertTitle", { defaultValue: "Vertex AI RAG Engine Setup" })}</AlertTitle>
                  <AlertDescription>
                    <p>{i18n.t("vectorStoreManagement.vectorStoreForm.vertexRagAlertDescription", { defaultValue: "To use Vertex AI RAG Engine:" })}</p>
                    <p style={{ marginTop: "4px", fontStyle: "italic" }}>
                      {i18n.t("vectorStoreManagement.vectorStoreForm.vertexRagRenameNote", {
                        defaultValue:
                          'Note: Google Cloud has renamed this to "RAG Engine" in its console — the steps below still apply.',
                      })}
                    </p>
                    <ol style={{ marginLeft: "16px", marginTop: "8px", listStyleType: "decimal" }}>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.vertexRagCorpusStep", { defaultValue: "Set up your Vertex AI RAG Engine corpus following the guide:" })}{" "}
                        
                      </li>
                      <li>{i18n.t("vectorStoreManagement.vectorStoreForm.vertexRagStep2", { defaultValue: "Create a corpus in your Google Cloud project" })}</li>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.vertexRagCorpusIdStep", {
                          defaultValue: 'Note the corpus ID from the Vertex AI console (now labeled "RAG Engine" in Google Cloud)',
                        })}
                      </li>
                      <li>{i18n.t("vectorStoreManagement.vectorStoreForm.vertexRagStep4", { defaultValue: "Enter the corpus ID in the Vector Store ID field below" })}</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              {selectedProvider === "vertex_ai/search_api" && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{i18n.t("vectorStoreManagement.vectorStoreForm.vertexSearchAlertTitle", { defaultValue: "Vertex AI Search Setup" })}</AlertTitle>
                  <AlertDescription>
                    <p>{i18n.t("vectorStoreManagement.vectorStoreForm.vertexSearchAlertDescription", { defaultValue: "To use Vertex AI Search (Discovery Engine):" })}</p>
                    <p style={{ marginTop: "4px", fontStyle: "italic" }}>
                      {i18n.t("vectorStoreManagement.vectorStoreForm.vertexSearchRenameNote", {
                        defaultValue:
                          'Note: Google Cloud has renamed this to "Agent Search" in its console — the steps below still apply.',
                      })}
                    </p>
                    <ol style={{ marginLeft: "16px", marginTop: "8px", listStyleType: "decimal" }}>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.vertexSearchEnableStep", {
                          defaultValue:
                            "Enable the Discovery Engine API on your Google Cloud project and create a data store following the guide:",
                        })}{" "}
                        
                      </li>
                      <li>{i18n.t("vectorStoreManagement.vectorStoreForm.vertexSearchStep2", { defaultValue: "Pick a supported location: global, us, or eu" })}</li>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.vertexSearchDataStoreStep", {
                          defaultValue:
                            "For most data store types (Cloud Storage, BigQuery, Media): copy the data store ID and enter it in the Vector Store ID field below.",
                        })}
                      </li>
                      <li>
                        {i18n.t("vectorStoreManagement.vectorStoreForm.vertexSearchEngineIdStepBefore", {
                          defaultValue:
                            "For website, healthcare, and connector-based sources (Drive, Gmail, Slack, Jira, etc.): create a search app on top of the data store, then copy the",
                        })}{" "}
                        <strong>{i18n.t("vectorStoreManagement.vectorStoreForm.engineIdLabel", { defaultValue: "Engine ID" })}</strong>{" "}
                        {i18n.t("vectorStoreManagement.vectorStoreForm.vertexSearchEngineIdStepAfter", {
                          defaultValue:
                            "and enter it in the Engine ID field. The Vector Store ID is still required as the 中安云科 AI 安全网关-side name for this record, but it isn't used in the GCP URL when Engine ID is set.",
                        })}
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="vector_store_id"
                label={labelWithHint(i18n.t("vectorStoreManagement.vectorStoreForm.vectorStoreIdLabel", { defaultValue: "Vector Store ID" }), i18n.t("vectorStoreManagement.vectorStoreForm.vectorStoreIdTooltip", { defaultValue: "Enter the vector store ID from your api provider" }))}
              >
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder={vectorStoreIdPlaceholder} />}
              </FormField>

              {getProviderSpecificFields(selectedProvider)
                .filter(isSupportedProviderField)
                .map((field) => (
                  <ProviderField key={field.name} field={field} control={form.control} modelInfo={modelInfo} />
                ))}

              <FormField
                control={form.control}
                name="vector_store_name"
                label={labelWithHint(
                  i18n.t("vectorStoreManagement.vectorStoreInfo.vectorStoreNameLabel", { defaultValue: i18n.t("vectorStoreManagement.vectorStoreForm.vectorStoreNameLabel", { defaultValue: "Vector Store Name" }) }),
                  i18n.t("vectorStoreManagement.vectorStoreForm.vectorStoreNameTooltip", { defaultValue: "Custom name you want to give to the vector store, this name will be rendered on the 中安云科 AI 安全网关 UI" }),
                )}
              >
                {({ ref, value, ...field }) => <Input {...field} ref={ref} value={value ?? ""} />}
              </FormField>

              <FormField control={form.control} name="vector_store_description" label={i18n.t("common.description", { defaultValue: "Description" })}>
                {({ ref, value, ...field }) => <Textarea {...field} ref={ref} value={value ?? ""} rows={4} />}
              </FormField>

              <FormField
                control={form.control}
                name="litellm_credential_name"
                label={labelWithHint(
                  i18n.t("modelInfoView.fieldExistingCredentials", { defaultValue: "Existing Credentials" }),
                  i18n.t("vectorStoreManagement.vectorStoreForm.existingCredentialsTooltip", { defaultValue: "Optionally select API provider credentials for this vector store eg. Bedrock API KEY" }),
                )}
              >
                {({ id, value, onChange }) => (
                  <SearchSelect
                    inputId={id}
                    placeholder={i18n.t("modelInfoView.placeholderCredentials", { defaultValue: "Select or search for existing credentials" })}
                    options={credentialOptions(credentials)}
                    value={value ?? ""}
                    onValueChange={(selected) => onChange(selected === "" || selected === null ? undefined : selected)}
                  />
                )}
              </FormField>

              <div role="group" className="flex w-full flex-col gap-3">
                <span className="flex w-fit gap-2 text-sm leading-snug font-medium">
                  {labelWithHint(i18n.t("createUserButton.metadataLabel", { defaultValue: "Metadata" }), i18n.t("vectorStoreManagement.vectorStoreForm.metadataTooltip", { defaultValue: "JSON metadata for the vector store (optional)" }))}
                </span>
                <Textarea
                  rows={4}
                  value={metadataJson}
                  onChange={(event) => setMetadataJson(event.target.value)}
                  placeholder='{"key": "value"}'
                />
              </div>
            </FieldGroup>

            <div className="mt-6 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {i18n.t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button type="submit">{i18n.t("common.create", { defaultValue: "Create" })}</Button>
            </div>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

type SupportedProviderField = VectorStoreFieldConfig & { name: ProviderFieldName };

const isSupportedProviderField = (field: VectorStoreFieldConfig): field is SupportedProviderField =>
  isProviderFieldName(field.name);

interface ProviderFieldProps {
  field: SupportedProviderField;
  control: ReturnType<typeof useZodForm<VectorStoreFormValues, VectorStoreFormValues>>["control"];
  modelInfo: ModelGroup[];
}

const ProviderField: React.FC<ProviderFieldProps> = ({ field, control, modelInfo }) => {
  const { t } = useTranslation();
  const label = labelWithHint(
    field.labelKey ? t(field.labelKey, { defaultValue: field.label }) : field.label,
    field.tooltipKey ? t(field.tooltipKey, { defaultValue: field.tooltip }) : field.tooltip,
  );

  if (field.type === "select") {
    const selectOptions =
      field.options ??
      modelInfo
        .filter((option: ModelGroup) => option.mode === "embedding" || option.mode === null)
        .map((option: ModelGroup) => ({
          value: option.model_group,
          label: option.model_group,
        }));

    return (
      <FormField control={control} name={field.name} label={label}>
        {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
          <Combobox
            items={selectOptions}
            value={selectOptions.find((option) => option.value === value) ?? null}
            onValueChange={(option: { value: string; label: string } | null) => onChange(option?.value)}
            itemToStringLabel={(option: { value: string; label: string }) => option.label}
            isItemEqualToValue={(
              option: { value: string; label: string },
              selected: { value: string; label: string },
            ) => option.value === selected.value}
          >
            <ComboboxInput
              id={id}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              placeholder={field.placeholderKey ? t(field.placeholderKey, { defaultValue: field.placeholder }) : field.placeholder}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxEmpty>{t("vectorStores.vectorStoreForm.noMatchingOptions", { defaultValue: "No matching options" })}</ComboboxEmpty>
              <ComboboxList>
                {(option: { value: string; label: string }) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </FormField>
    );
  }

  return (
    <FormField control={control} name={field.name} label={label}>
      {({ ref, value, ...controlProps }) =>
        field.type === "password" ? (
          <PasswordInput {...controlProps} ref={ref} value={value ?? ""} placeholder={field.placeholderKey ? t(field.placeholderKey, { defaultValue: field.placeholder }) : field.placeholder} />
        ) : (
          <Input {...controlProps} ref={ref} value={value ?? ""} type="text" placeholder={field.placeholderKey ? t(field.placeholderKey, { defaultValue: field.placeholder }) : field.placeholder} />
        )
      }
    </FormField>
  );
};

export default VectorStoreForm;
