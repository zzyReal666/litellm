import { useTranslation } from "react-i18next";
import CopyButton from "@/components/shared/CopyButton";
import { buildCurlCommand, type CurlCommandInput } from "./lib/curlCommand";

interface CurlPreviewProps extends CurlCommandInput {
  errorCount?: number;
}

export default function CurlPreview({ errorCount = 0, ...input }: CurlPreviewProps) {
  const { t } = useTranslation();
  const command = buildCurlCommand(input);
  const issueWord = t("playground.systemOne.issue", { defaultValue: "issue" });
  const issuesWord = t("playground.systemOne.issues", { defaultValue: "issues" });
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md border">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-sm">
        <span className="font-medium">{t("playground.systemOne.cUrlRequest", { defaultValue: "cURL request" })}</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {errorCount > 0 ? (
            <span role="alert" className="text-destructive">
              {t("playground.systemOne.fixIssues", {
                count: errorCount,
                issues: errorCount === 1 ? issueWord : issuesWord,
                defaultValue: "Fix {{count}} {{issues}} on the Form tab before copying",
              })}
            </span>
          ) : (
            <>
              <span>{t("playground.systemOne.replaceApiKey", { defaultValue: "Replace $LITELLM_API_KEY with a virtual key" })}</span>
              <CopyButton value={command} label={t("playground.systemOne.copyCurl", { defaultValue: "Copy cURL" })} variant="action" />
            </>
          )}
        </div>
      </div>
      <pre
        aria-label={t("playground.systemOne.cUrlRequest", { defaultValue: "cURL request" })}
        className="m-0 min-h-0 flex-1 overflow-auto whitespace-pre-wrap wrap-anywhere px-3 py-3 font-mono text-xs leading-5"
      >
        {command}
      </pre>
    </div>
  );
}
