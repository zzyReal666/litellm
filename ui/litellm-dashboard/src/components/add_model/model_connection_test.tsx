import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CircleCheck, Copy, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { toast } from "@/lib/toast";
import { copyToClipboard } from "../../utils/dataUtils";
import { testConnectionRequest } from "../networking";
import { connectionAdvice } from "./connection_troubleshooting";
import { prepareModelAddRequest } from "./handle_add_model_submit";

interface PreparedConnectionRequest {
  litellmParamsObj: Record<string, any>;
  modelInfoObj: Record<string, any>;
}

interface ModelConnectionTestProps {
  formValues?: Record<string, any>;
  accessToken: string;
  testMode: string;
  modelName?: string;
  preparedRequest?: PreparedConnectionRequest;
  credentialName?: string | null;
  onClose?: () => void;
  onTestComplete?: () => void;
}

const SENSITIVE_HEADER = /authorization|api[-_]?key|token|secret/i;

const ModelConnectionTest: React.FC<ModelConnectionTestProps> = ({
  formValues = {},
  accessToken,
  testMode,
  modelName = "this model",
  preparedRequest,
  credentialName,
  onClose: _onClose,
  onTestComplete,
}) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState<Error | string | null>(null);
  const [rawResponse, setRawResponse] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [durationMs, setDurationMs] = React.useState<number | null>(null);

  const testModelConnection = async () => {
    const startedAt = Date.now();
    setIsLoading(true);
    setShowDetails(false);
    setError(null);
    setRawResponse(null);
    setIsSuccess(false);
    setDurationMs(null);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const prepared = preparedRequest ?? (await prepareModelAddRequest(formValues, accessToken, null))?.[0];

      if (!prepared) {
        setError(
          t("addModel.modelConnectionTest.prepareFailed", {
            defaultValue: "Failed to prepare model data. Please check your form inputs.",
          }),
        );
        setIsSuccess(false);
        setIsLoading(false);
        return;
      }

      const { litellmParamsObj, modelInfoObj } = prepared;
      const response = await testConnectionRequest(
        accessToken,
        litellmParamsObj,
        modelInfoObj,
        preparedRequest ? undefined : testMode,
      );

      if (response.status === "success") {
        toast.success(
          t("addModel.modelConnectionTest.connectionTestSuccessful", { defaultValue: "Connection test successful!" }),
        );
        setError(null);
        setRawResponse(response.result?.raw_request_typed_dict ?? null);
        setIsSuccess(true);
      } else {
        const errorMessage =
          response.result?.error ||
          response.message ||
          t("addModel.modelConnectionTest.unknownError", { defaultValue: "Unknown error" });
        setError(errorMessage);
        setRawResponse(response.result?.raw_request_typed_dict);
        setIsSuccess(false);
        toast.error(
          t("addModel.modelConnectionTest.connectionFailedToast", { defaultValue: "Connection test failed" }),
        );
      }
    } catch (connectionError) {
      console.error("Test connection error:", connectionError);
      setError(connectionError instanceof Error ? connectionError.message : String(connectionError));
      setIsSuccess(false);
      toast.error(
        t("addModel.modelConnectionTest.connectionFailedToast", { defaultValue: "Connection test failed" }),
      );
    } finally {
      setDurationMs(Date.now() - startedAt);
      setIsLoading(false);
      onTestComplete?.();
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      testModelConnection();
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the parent remounts the component to start a fresh connection test
  }, []);

  const getCleanErrorMessage = (errorMsg: string, translate: TFunction) => {
    if (!errorMsg) return translate("addModel.modelConnectionTest.unknownError", { defaultValue: "Unknown error" });
    return errorMsg
      .split("stack trace:")[0]
      .trim()
      .replace(/^litellm\.(.*?)Error: /, "");
  };

  const unknownError = t("addModel.modelConnectionTest.unknownError", { defaultValue: "Unknown error" });
  const errorMessage =
    typeof error === "string"
      ? getCleanErrorMessage(error, t)
      : error?.message
        ? getCleanErrorMessage(error.message, t)
        : unknownError;

  const formatCurlCommand = (
    apiBase: string,
    requestBody: Record<string, any>,
    requestHeaders: Record<string, string>,
  ) => {
    const formattedBody = JSON.stringify(requestBody, null, 2)
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");

    const headerString = Object.entries(requestHeaders)
      .map(([key, value]) => `-H '${key}: ${SENSITIVE_HEADER.test(key) ? "***" : value}'`)
      .join(" \\\n  ");

    return `curl -X POST \\
  ${apiBase} \\
  ${
    headerString
      ? `${headerString} \\
  `
      : ""
  }-H 'Content-Type: application/json' \\
  -d '{
${formattedBody}
  }'`;
  };

  const curlCommand = rawResponse
    ? formatCurlCommand(
        rawResponse.raw_request_api_base,
        rawResponse.raw_request_body,
        rawResponse.raw_request_headers || {},
      )
    : "";
  const advice = connectionAdvice(errorMessage);

  return (
    <div className="rounded-lg bg-background p-6">
      {isLoading ? (
        <div aria-busy="true" className="flex flex-col items-center justify-center gap-4 px-5 py-8 text-center">
          <LoaderCircle className="size-8 animate-spin text-primary" />
          <p className="text-base">
            {t("addModel.modelConnectionTest.testingConnection", {
              defaultValue: "Testing connection to {{modelName}}...",
              modelName,
            })}
          </p>
        </div>
      ) : isSuccess ? (
        <div className="flex flex-col items-center justify-center gap-2.5 px-5 py-8">
          <div className="flex items-center gap-2.5">
            <CircleCheck className="size-6 text-primary" />
            <p data-testid="connection-success-msg" className="text-lg font-medium">
              {t("addModel.modelConnectionTest.connectionSuccess", {
                defaultValue: "Connection to {{modelName}} successful!",
                modelName,
              })}
            </p>
          </div>
          {credentialName ? (
            <p data-testid="connection-credential" className="text-sm text-muted-foreground">
              {t("addModel.modelConnectionTest.usingCredential", {
                defaultValue: "Credential used: {{credentialName}}",
                credentialName,
              })}
            </p>
          ) : null}
          {durationMs !== null && (
            <p data-testid="connection-duration" className="text-xs text-muted-foreground">
              {t("addModel.modelConnectionTest.duration", {
                defaultValue: "Duration: {{duration}}s",
                duration: (durationMs / 1000).toFixed(2),
              })}
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-5 flex items-center gap-3">
            <AlertTriangle className="size-6 text-destructive" />
            <p data-testid="connection-failure-msg" className="text-lg font-medium text-destructive">
              {t("addModel.modelConnectionTest.connectionFailed", {
                defaultValue: "Connection to {{modelName}} failed",
                modelName,
              })}
            </p>
          </div>

          {credentialName ? (
            <p data-testid="connection-credential" className="mb-4 text-sm text-muted-foreground">
              {t("addModel.modelConnectionTest.usingCredential", {
                defaultValue: "Credential used: {{credentialName}}",
                credentialName,
              })}
            </p>
          ) : null}

          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 shadow-xs">
            <p className="mb-2 font-medium">
              {t("commonComponents.checkOpenapiSchema.errorPrefix", { defaultValue: "Error:" })}
            </p>
            <p className="text-sm leading-relaxed text-destructive">{errorMessage}</p>
            {durationMs !== null && (
              <p data-testid="connection-duration" className="mt-2 text-xs text-muted-foreground">
                {t("addModel.modelConnectionTest.duration", {
                  defaultValue: "Duration: {{duration}}s",
                  duration: (durationMs / 1000).toFixed(2),
                })}
              </p>
            )}

            {error && (
              <Button
                type="button"
                variant="link"
                className="mt-3 h-auto px-0"
                onClick={() => setShowDetails((visible) => !visible)}
              >
                {showDetails
                  ? t("addModel.modelConnectionTest.hideDetails", { defaultValue: "Hide Details" })
                  : t("addModel.modelConnectionTest.showDetails", { defaultValue: "Show Details" })}
              </Button>
            )}
          </div>

          <div data-testid="connection-troubleshooting" className="mb-5 rounded-lg border bg-muted/30 p-4">
            <p className="mb-1 text-sm font-medium">
              {t("addModel.modelConnectionTest.troubleshooting.title", { defaultValue: "Troubleshooting" })}
            </p>
            <p data-testid="connection-issue-title" className="mb-2 text-sm text-foreground">
              {t(advice.titleKey)}
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {advice.suggestionKeys.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </div>

          {showDetails && (
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium">
                {t("addModel.modelConnectionTest.troubleshootingDetails", {
                  defaultValue: "Troubleshooting Details",
                })}
              </p>
              <pre className="max-h-52 overflow-auto rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed">
                {typeof error === "string" ? error : JSON.stringify(error, null, 2)}
              </pre>
            </div>
          )}

        </div>
      )}

      {!isLoading && (curlCommand || !isSuccess) && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium">
            {t("addModel.modelConnectionTest.apiRequest", { defaultValue: "API Request" })}
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/50 p-4 text-xs leading-relaxed">
            {curlCommand ||
              t("addModel.modelConnectionTest.noRequestData", { defaultValue: "No request data available" })}
          </pre>
          {curlCommand ? (
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() =>
                void copyToClipboard(
                  curlCommand,
                  t("addModel.modelConnectionTest.copiedToClipboard", { defaultValue: "Copied to clipboard" }),
                )
              }
            >
              <Copy data-icon="inline-start" />
              {t("addModel.modelConnectionTest.copyToClipboard", { defaultValue: "Copy to Clipboard" })}
            </Button>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("addModel.modelConnectionTest.noRequestDataCopyHint", {
                defaultValue: "This failure produced no request data to copy",
              })}
            </p>
          )}
        </div>
      )}

      <Separator className="my-6" />
    </div>
  );
};

export default ModelConnectionTest;
