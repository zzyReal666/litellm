"use client";

import { SearchX, TriangleAlert } from "lucide-react";
import i18n from "@/lib/i18n";
import { LoadingState } from "@/components/shared/LoadingState";
import { StateMessage } from "@/components/shared/StateMessage";
import { Button } from "@/components/ui/button";

import { ApiError } from "@/lib/http/client";

function loadFailureMessage(queryError: unknown, unavailable: boolean): string {
  if (unavailable)
    return "This dashboard may be newer than the proxy. Reload the page, and if it persists, check the proxy deployment.";
  if (queryError instanceof Error) return queryError.message;
  return "Something went wrong while contacting the proxy.";
}

export function InvestigationsLoadFailed({ queryError, refresh }: { queryError: unknown; refresh: () => void }) {
  const unavailable = queryError instanceof ApiError && queryError.status === 404;
  return (
    <StateMessage
      role="alert"
      tone="destructive"
      icon={<TriangleAlert className="size-5" />}
      title={unavailable ? "Lens API is unavailable" : "Couldn't load investigations"}
      description={loadFailureMessage(queryError, unavailable)}
    >
      <Button size="sm" onClick={() => (unavailable ? window.location.reload() : refresh())}>
        {unavailable ? "Reload page" : "Try again"}
      </Button>
    </StateMessage>
  );
}

export function InvestigationError({ message, refresh }: { message: string; refresh: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      <span className="min-w-0">{message}</span>
      <Button variant="ghost" size="sm" onClick={refresh}>
        Retry
      </Button>
    </div>
  );
}

export function InvestigationsLoading() {
  return (
    <LoadingState
      title={i18n.t("investigationStates.loading-investigations", { defaultValue: "Loading investigations…" })}
      description={i18n.t("investigationStates.fetching-your-investigations-and-their-lates", { defaultValue: "Fetching your investigations and their latest findings." })}
    />
  );
}

export function InvestigationMissing({ selectLens }: { selectLens: (id: string | null) => void }) {
  return (
    <StateMessage
      role="alert"
      icon={<SearchX className="size-5" />}
      title={i18n.t("investigationStates.investigation-not-found", { defaultValue: "Investigation not found" })}
      description={i18n.t("investigationStates.it-may-have-been-deleted-or-the-link-points", { defaultValue: "It may have been deleted, or the link points to a different proxy." })}
    >
      <Button size="sm" onClick={() => selectLens(null)}>
        {i18n.t("investigationStates.view-all-investigations", { defaultValue: "View all investigations" })}{" "}</Button>
    </StateMessage>
  );
}
