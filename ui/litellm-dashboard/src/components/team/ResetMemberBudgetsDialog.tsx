import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import i18n from "@/lib/i18n";
import type { MemberBudgetResetState } from "./useMemberBudgetReset";

interface ResetMemberBudgetsDialogProps {
  state: MemberBudgetResetState;
  onReset: () => void;
  onRetry: () => void;
  onKeep: () => void;
  onDismiss: () => void;
}

export default function ResetMemberBudgetsDialog({
  state,
  onReset,
  onRetry,
  onKeep,
  onDismiss,
}: ResetMemberBudgetsDialogProps) {
  const open = state.phase !== "idle";
  const busy = state.phase === "resetting";
  const failed = state.phase === "resetFailed";
  const memberCount = state.phase === "idle" ? 0 : state.pending.userIds.length;
  const newBudget = state.phase === "idle" ? 0 : state.pending.newBudget;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !busy) onDismiss();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {i18n.t("resetMemberBudgetsDialog.resetTitle", { defaultValue: "Reset member budgets?" })}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {i18n.t("resetMemberBudgetsDialog.resetDescription", {
            count: memberCount,
            defaultValue_one:
              "{{count}} member has a custom budget, so the new team default of ¥{{budget}} will not apply to that member. Reset it to the default, or keep the custom budget?",
            defaultValue_other:
              "{{count}} members have a custom budget, so the new team default of ¥{{budget}} will not apply to them. Reset them to the default, or keep the custom budgets?",
            budget: formatNumberWithCommas(newBudget, 2),
          })}
        </p>
        <DialogFooter>
          {failed ? (
            <>
              <Button variant="outline" onClick={onDismiss}>
                {i18n.t("resetMemberBudgetsDialog.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button onClick={onRetry}>
                {i18n.t("resetMemberBudgetsDialog.retryReset", { defaultValue: "Retry reset" })}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onDismiss} disabled={busy}>
                {i18n.t("resetMemberBudgetsDialog.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button variant="outline" onClick={onKeep} disabled={busy}>
                {i18n.t("resetMemberBudgetsDialog.keepCustomBudget", {
                  count: memberCount,
                  defaultValue_one: "Keep custom budget",
                  defaultValue_other: "Keep custom budgets",
                })}
              </Button>
              <Button onClick={onReset} disabled={busy}>
                {i18n.t("resetMemberBudgetsDialog.resetToBudget", {
                  count: memberCount,
                  defaultValue_one: "Reset to ¥{{budget}}",
                  defaultValue_other: "Reset all to ¥{{budget}}",
                  budget: formatNumberWithCommas(newBudget, 2),
                })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
