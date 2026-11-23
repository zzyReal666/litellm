import i18n from "@/lib/i18n";
import * as React from "react";

const MARK_CLASS = "ml-1 text-destructive";
const OPTIONAL_CLASS = "ml-1 text-xs font-normal text-muted-foreground";

export const RequirementMark: React.FC<{ required?: boolean }> = ({ required = false }) =>
  required ? (
    <>
      <span aria-hidden="true" className={MARK_CLASS}>
        *
      </span>
      <span className="sr-only">{i18n.t("common.required", { defaultValue: "Required" })}</span>
    </>
  ) : (
    <span className={OPTIONAL_CLASS}>{i18n.t("common.optional", { defaultValue: "Optional" })}</span>
  );

export const withRequirement = (label: React.ReactNode, required?: boolean): React.ReactNode => (
  <>
    {label}
    <RequirementMark required={required} />
  </>
);
