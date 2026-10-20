import { useTranslation } from "react-i18next";
import CopyButton from "@/components/shared/CopyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import { JsonViewer } from "./JsonViewer";

interface ClassifierAuditViewProps {
  request: Record<string, unknown>;
  response: unknown;
}

export function ClassifierAuditView({ request, response }: ClassifierAuditViewProps) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 space-y-4">
      <AuditField
        title={t("viewLogs.classifierAuditView.inputTitle", { defaultValue: "Classifier input" })}
        value={request.classifier_input}
      >
        {t("viewLogs.classifierAuditView.inputHint", {
          defaultValue: "Provider request payload. A cached call or disabled message logging may have no capture.",
        })}
      </AuditField>
      <AuditField
        title={t("viewLogs.classifierAuditView.originatingTitle", {
          defaultValue: "Originating request, credentials masked",
        })}
        value={request.originating_request_masked}
      >
        {t("viewLogs.classifierAuditView.originatingHint", {
          defaultValue: "Comparison only. This source request was not appended to the classifier input.",
        })}
      </AuditField>
      <AuditField
        title={t("viewLogs.classifierAuditView.responseTitle", { defaultValue: "Classifier response" })}
        value={response}
      >
        {t("viewLogs.classifierAuditView.responseHint", {
          defaultValue:
            "The returned verdict and any explanation supplied by the classifier. Later routing rules may change the tier.",
        })}
      </AuditField>
    </div>
  );
}

function AuditField({ title, value, children }: { title: string; value: unknown; children: ReactNode }) {
  const { t } = useTranslation();
  const serialized = JSON.stringify(value);
  const truncated = serialized?.includes("litellm_truncated") ?? false;

  return (
    <Card size="sm" role="region" aria-label={title}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CopyButton
          value={JSON.stringify(value, null, 2)}
          label={t("common.copyField", { field: title, defaultValue: `Copy ${title}` })}
        />
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">{children}</p>
        {truncated && (
          <p role="status" className="mb-3 text-sm text-warning">
            {t("viewLogs.classifierAuditView.truncatedNotice", {
              defaultValue:
                "This stored copy is truncated. The complete payload is unavailable from the configured log storage.",
            })}
          </p>
        )}
        {value == null ? (
          <p className="text-sm text-muted-foreground">
            {t("viewLogs.classifierAuditView.notCaptured", {
              defaultValue: "Not captured or message logging disabled",
            })}
          </p>
        ) : (
          <JsonViewer data={value} mode="formatted" />
        )}
      </CardContent>
    </Card>
  );
}
