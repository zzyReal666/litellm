"use client";

import React, { useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useUpdateUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUpdateUserBanner";
import { useUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUserBanner";
import { toast } from "@/lib/toast";
import { UserBanner, UserBannerSeverity, UserBannerUpdate } from "@/components/networking";
import { Alert, AlertDescription } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SEVERITY_ICONS, UserBannerMarkdown } from "@/components/UserBanner";
import { Skeleton } from "@/components/ui/skeleton";

const SEVERITY_LABELS: Record<UserBannerSeverity, { key: string; defaultValue: string }> = {
  info: { key: "settingsPages.userBannerSettings.severityInfo", defaultValue: "Info" },
  warning: { key: "common.warning", defaultValue: "Warning" },
  error: { key: "common.error", defaultValue: "Error" },
};

const severityItems = (t: TFunction) =>
  (Object.keys(SEVERITY_LABELS) as UserBannerSeverity[]).map((severity) => {
    const label = SEVERITY_LABELS[severity];
    return { value: severity, label: t(label.key, { defaultValue: label.defaultValue }) };
  });

const EMPTY_BANNER: UserBanner = { enabled: false, message: "", severity: "info", revision: "" };

export default function UserBannerSettings() {
  const { accessToken } = useAuthorized();
  const { data: banner, isLoading } = useUserBanner(accessToken);
  const { mutate: saveBanner, isPending } = useUpdateUserBanner(accessToken);
  const persisted = banner ?? EMPTY_BANNER;

  return (
    <UserBannerSettingsForm
      key={JSON.stringify(persisted)}
      persisted={persisted}
      isLoading={isLoading}
      isPending={isPending}
      saveBanner={saveBanner}
    />
  );
}

interface UserBannerSettingsFormProps {
  persisted: UserBanner;
  isLoading: boolean;
  isPending: boolean;
  saveBanner: ReturnType<typeof useUpdateUserBanner>["mutate"];
}

function UserBannerSettingsForm({ persisted, isLoading, isPending, saveBanner }: UserBannerSettingsFormProps) {
  const { t } = useTranslation();
  const severityOptions = severityItems(t);
  const [draft, setDraft] = useState<UserBannerUpdate>({
    enabled: persisted.enabled,
    message: persisted.message,
    severity: persisted.severity,
  });

  const messageMissing = draft.enabled && draft.message.trim() === "";

  const handleSave = () => {
    saveBanner(draft, {
      onSuccess: () => {
        toast.success(
          t("settingsPages.userBannerSettings.saveSuccess", { defaultValue: "User banner updated successfully" }),
        );
      },
      onError: (error) => {
        toast.fromError(error);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settingsPages.userBannerSettings.cardTitle", { defaultValue: "User Banner" })}</CardTitle>
        <CardDescription>
          {t("settingsPages.userBannerSettings.cardDescription", {
            defaultValue:
              "Publish an announcement to all dashboard users. Markdown is supported; the banner appears below the header on every page until you unpublish it. Users can dismiss it, and it reappears whenever the content changes.",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(checked: boolean) => setDraft({ ...draft, enabled: checked })}
                aria-label={t("settingsPages.userBannerSettings.publishLabel", { defaultValue: "Publish user banner" })}
              />
              <Label>
                {t("settingsPages.userBannerSettings.publishLabel", { defaultValue: "Publish user banner" })}
              </Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="user-banner-message">
                {t("settingsPages.userBannerSettings.messageLabel", { defaultValue: "Message" })}
              </Label>
              <Textarea
                id="user-banner-message"
                value={draft.message}
                maxLength={4000}
                rows={3}
                placeholder={t("settingsPages.userBannerSettings.messagePlaceholder", {
                  defaultValue:
                    "**Scheduled maintenance** tonight at 10 PM UTC. See [status page](https://example.com).",
                })}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDraft({ ...draft, message: event.target.value })
                }
              />
              {messageMissing && (
                <p className="text-sm text-destructive">
                  {t("settingsPages.userBannerSettings.messageRequired", {
                    defaultValue: "Add a message before publishing.",
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("settingsPages.userBannerSettings.severityLabel", { defaultValue: "Severity" })}</Label>
              <Select
                items={severityOptions}
                value={draft.severity}
                onValueChange={(value: string | null) =>
                  setDraft({ ...draft, severity: (value ?? "info") as UserBannerSeverity })
                }
              >
                <SelectTrigger
                  className="w-48"
                  aria-label={t("settingsPages.userBannerSettings.severityAriaLabel", {
                    defaultValue: "Banner severity",
                  })}
                >
                  <SelectValue
                    placeholder={t("settingsPages.userBannerSettings.severityLabel", { defaultValue: "Severity" })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {draft.message.trim() !== "" && (
              <div className="flex flex-col gap-2">
                <Label>{t("settingsPages.userBannerSettings.previewLabel", { defaultValue: "Preview" })}</Label>
                <Alert variant={draft.severity}>
                  {SEVERITY_ICONS[draft.severity]}
                  <AlertDescription>
                    <UserBannerMarkdown message={draft.message} />
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div>
              <Button onClick={handleSave} disabled={isPending || messageMissing}>
                {isPending
                  ? t("common.saving", { defaultValue: "Saving..." })
                  : t("settingsPages.userBannerSettings.saveButton", { defaultValue: "Save banner" })}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
