"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";

interface PaginationStatusAlertsProps {
  isFetchingMore: boolean;
  cancelled: boolean;
  progress: { currentPage: number; totalPages: number };
  cancel: () => void;
  subject?: string;
}

const PaginationStatusAlerts = ({
  isFetchingMore,
  cancelled,
  progress,
  cancel,
  subject,
}: PaginationStatusAlertsProps) => {
  const { t } = useTranslation();
  const subjectLabel = subject ?? t("shared.paginationStatusAlerts.spendData", { defaultValue: "spend data" });

  return (
    <>
      {isFetchingMore && (
        <Alert variant="warning" className="mb-2">
          <AlertDescription className="flex items-center justify-between text-inherit">
            <span>
              <Loader2 className="mr-2 inline size-4 animate-spin align-text-bottom" />
              <Trans
                i18nKey="shared.paginationStatusAlerts.fetching"
                defaults="Currently fetching {{subject}}: fetched {{current}} / {{total}} pages. Charts will update periodically as data loads. Moving off of this page will stop and reset this. To continue using the UI in the meantime, <0>open a new tab<1/></0>."
                values={{ subject: subjectLabel, current: progress.currentPage, total: progress.totalPages }}
                components={[
                  <a key="tab" href={window.location.href} target="_blank" rel="noopener noreferrer" />,
                  <ExternalLink key="icon" className="inline size-3.5 align-text-bottom" />,
                ]}
              />
            </span>
            <Button variant="destructive" onClick={cancel}>
              {t("toolPolicies.stop", { defaultValue: "Stop" })}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {cancelled && (
        <Alert variant="info" className="mb-2">
          <AlertDescription className="text-inherit">
            {t("shared.paginationStatusAlerts.partial", {
              defaultValue: "Showing partial {{subject}} ({{current}}/{{total}} pages loaded)",
              subject: subjectLabel,
              current: progress.currentPage,
              total: progress.totalPages,
            })}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default PaginationStatusAlerts;
