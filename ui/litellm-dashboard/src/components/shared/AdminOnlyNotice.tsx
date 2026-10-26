"use client";

import i18n from "@/lib/i18n";
import React from "react";

interface AdminOnlyNoticeProps {
  pageTitle: string;
}

export const AdminOnlyNotice: React.FC<AdminOnlyNoticeProps> = ({ pageTitle }) => (
  <div className="p-6 w-full min-w-0 flex-1">
    <h1 className="text-2xl font-semibold text-foreground mb-2">{pageTitle}</h1>
    <p className="text-sm text-muted-foreground">
      {i18n.t("shared.adminOnlyNotice", { defaultValue: "{{title}} is only available to admin users.", title: pageTitle })}
    </p>
  </div>
);
