"use client";

import { analysisElapsed } from "../../model/progress";
import i18n from "@/lib/i18n";
import type { Job } from "../../model/types";

export function ScanDuration({ job }: { job: Job }) {
  if (!job.finished_at) return null;
  return (
    <span title={i18n.t("jobMeta.total-time-including-any-wait-for-an-analyze", { defaultValue: "Total time, including any wait for an analyzer" })}>
      {" · Took "}
      {analysisElapsed(job.created_at, Date.parse(job.finished_at))}
    </span>
  );
}
