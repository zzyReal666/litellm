"use client";

import React, { useState } from "react";
import { CircleAlert, TriangleAlert, X } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { LicenseInfo } from "@/components/networking";
import { useLicenseInfo } from "@/app/(dashboard)/hooks/license/useLicenseInfo";
import { formatExpiryDate, getDaysUntilExpiration, getLicenseExpiryTier } from "@/utils/licenseUtils";
import i18n from "@/lib/i18n";

const DISMISS_KEY_PREFIX = "litellm:licenseExpiryBannerDismissed:";
const SALES_EMAIL = "sales@berri.ai";

interface LicenseExpiryBannerProps {
  accessToken: string | null;
}

interface LicenseExpiryBannerViewProps {
  licenseInfo: LicenseInfo | null;
}

const describeCountdown = (days: number): string => {
  if (days <= 0) {
    return i18n.t("licenseExpiryBanner.expiresToday", { defaultValue: "expires today" });
  }
  if (days === 1) {
    return i18n.t("licenseExpiryBanner.expiresInOneDay", { defaultValue: "expires in 1 day" });
  }
  return i18n.t("licenseExpiryBanner.expiresInDays", { defaultValue: "expires in {{days}} days", days });
};

const expiryDescription = (tier: "warning" | "critical" | "expired"): React.ReactNode => {
  if (tier === "expired") {
    return i18n.t("licenseExpiryBanner.expiredDescription", {
      defaultValue: "Enterprise features are now disabled. Reach out to {{email}} to restore access",
      email: SALES_EMAIL,
    });
  }
  if (tier === "critical") {
    return i18n.t("licenseExpiryBanner.criticalDescription", {
      defaultValue: "Renew now to avoid losing enterprise features. Reach out to {{email}}",
      email: SALES_EMAIL,
    });
  }
  return i18n.t("licenseExpiryBanner.warningDescription", {
    defaultValue: "Renew before it lapses to keep enterprise features. Reach out to {{email}}",
    email: SALES_EMAIL,
  });
};

export const LicenseExpiryBannerView: React.FC<LicenseExpiryBannerViewProps> = ({ licenseInfo }) => {
  const [locallyDismissed, setLocallyDismissed] = useState(false);

  const expirationDate = licenseInfo?.expiration_date ?? null;
  const tier = getLicenseExpiryTier(expirationDate);
  const days = getDaysUntilExpiration(expirationDate);

  if (expirationDate === null || tier === "none" || days === null) {
    return null;
  }

  const isDismissible = tier === "warning";
  const dismissKey = `${DISMISS_KEY_PREFIX}${expirationDate}`;
  const previouslyDismissed =
    isDismissible && typeof window !== "undefined" ? sessionStorage.getItem(dismissKey) === "true" : false;

  if (isDismissible && (locallyDismissed || previouslyDismissed)) {
    return null;
  }

  const formattedDate = formatExpiryDate(expirationDate);

  const message =
    tier === "expired"
      ? i18n.t("licenseExpiryBanner.expiredTitle", {
          defaultValue: "Your LiteLLM Enterprise license expired on {{date}}",
          date: formattedDate,
        })
      : i18n.t("licenseExpiryBanner.activeTitle", {
          defaultValue: "Your LiteLLM Enterprise license {{countdown}} ({{date}})",
          countdown: describeCountdown(days),
          date: formattedDate,
        });

  const description = expiryDescription(tier);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(dismissKey, "true");
    }
    setLocallyDismissed(true);
  };

  return (
    <Alert variant={tier === "warning" ? "warning" : "error"} className="rounded-none border-x-0 border-t-0">
      {tier === "warning" ? (
        <TriangleAlert className="size-4" aria-hidden />
      ) : (
        <CircleAlert className="size-4" aria-hidden />
      )}
      <AlertTitle>{message}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {isDismissible && (
        <AlertAction>
          <Button variant="ghost" size="icon-sm" aria-label={i18n.t("licenseExpiryBanner.closeAria", { defaultValue: "Close" })} onClick={handleClose}>
            <X className="size-4" />
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
};

export const LicenseExpiryBanner: React.FC<LicenseExpiryBannerProps> = ({ accessToken }) => {
  const { data } = useLicenseInfo(accessToken);
  return <LicenseExpiryBannerView licenseInfo={data ?? null} />;
};
