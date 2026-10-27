import { CircleAlert } from "lucide-react";
import i18n from "@/lib/i18n";
import React, { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { toast } from "@/lib/toast";
import { AgentKillSwitchResult, triggerAgentKillSwitchCall } from "@/components/networking";
import { KillSwitchConfig } from "./kill_switch_config";

interface AgentKillSwitchDangerZoneProps {
  agentId: string;
  agentName: string;
  killSwitch: KillSwitchConfig | null | undefined;
  accessToken: string | null;
  isAdmin: boolean;
}

const AgentKillSwitchDangerZone: React.FC<AgentKillSwitchDangerZoneProps> = ({
  agentId,
  agentName,
  killSwitch,
  accessToken,
  isAdmin,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isFiring, setIsFiring] = useState(false);
  const [lastResult, setLastResult] = useState<AgentKillSwitchResult | null>(null);

  if (!isAdmin) return null;

  const openConfirm = () => {
    setConfirmationInput("");
    setIsConfirmOpen(true);
  };

  const fire = async () => {
    if (!accessToken) return;
    setIsFiring(true);
    setLastResult(null);
    try {
      const result = await triggerAgentKillSwitchCall(accessToken, agentId);
      setLastResult(result);
      setIsConfirmOpen(false);
      toast.success(i18n.t("agentsPage.agentKillSwitch.fired", { defaultValue: "Kill switch fired (HTTP {{code}})", code: result.status_code }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : i18n.t("agentsPage.agentKillSwitch.fireFailed", { defaultValue: "Failed to fire kill switch" }));
    } finally {
      setIsFiring(false);
    }
  };

  return (
    <section aria-labelledby="agent-danger-zone-heading" className="mt-6">
      <h3 id="agent-danger-zone-heading" className="text-lg font-medium text-destructive">
        {i18n.t("agentsPage.agentKillSwitch.dangerZone", { defaultValue: "Danger Zone" })}
      </h3>
      <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1 text-sm">
            <p className="font-medium text-foreground">{i18n.t("agentsPage.agentKillSwitch.killSwitch", { defaultValue: "Kill switch" })}</p>
            {killSwitch ? (
              <>
                <p className="text-muted-foreground">
                  {i18n.t("agentsPage.agentKillSwitch.description", {
                    defaultValue:
                      "Calls the configured webhook to stop this agent's upstream runtime. This can cause an outage for everyone using the agent and cannot be undone from 中安云科 AI 安全网关",
                  })}
                </p>
                <p className="font-mono break-all text-foreground">
                  {killSwitch.method ?? "POST"} {killSwitch.url}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                {i18n.t("agentsPage.agentKillSwitch.notConfigured", { defaultValue: "Not configured. Add a kill switch webhook under Settings to enable this action" })}
              </p>
            )}
          </div>
          {killSwitch && (
            <Button type="button" variant="destructive" onClick={openConfirm} disabled={isFiring} aria-busy={isFiring}>
              {isFiring && <UiLoadingSpinner className="size-4" />}
              {i18n.t("agentsPage.agentKillSwitch.fireButton", { defaultValue: "Fire Kill Switch" })}
            </Button>
          )}
        </div>
        {lastResult && (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            {i18n.t("agentsPage.agentKillSwitch.lastResult", { defaultValue: "Last result: HTTP {{code}}", code: lastResult.status_code })}
            {lastResult.response_body ? ` ${lastResult.response_body}` : ""}
          </p>
        )}
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={(open) => !open && !isFiring && setIsConfirmOpen(false)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{i18n.t("agentsPage.agentKillSwitch.confirmTitle", { defaultValue: "Fire kill switch for {{name}}?", name: agentName })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="error">
              <CircleAlert />
              <AlertTitle>{i18n.t("agentsPage.agentKillSwitch.outageWarningTitle", { defaultValue: "This can cause an outage" })}</AlertTitle>
              <AlertDescription>
                {i18n.t("agentsPage.agentKillSwitch.outageWarningDescription", {
                  defaultValue:
                    "中安云科 AI 安全网关 will call {{method}} {{url}} immediately. Whatever that webhook does to the agent is outside 中安云科 AI 安全网关's control and cannot be reverted here",
                  method: killSwitch?.method ?? "POST",
                  url: killSwitch?.url,
                })}
              </AlertDescription>
            </Alert>
            <div>
              <p className="mb-2 text-base font-medium text-foreground">
                {i18n.t("agentsPage.agentKillSwitch.typeToConfirm", { defaultValue: "Type {{name}} to confirm:", name: agentName }).split("{{name}}")[0]}
                <span className="font-semibold text-destructive">{agentName}</span>
                {i18n.t("agentsPage.agentKillSwitch.typeToConfirm", { defaultValue: "Type {{name}} to confirm:", name: agentName }).split("{{name}}")[1]}
              </p>
              <InputGroup className="rounded-md">
                <InputGroupAddon>
                  <CircleAlert className="size-3.5 text-destructive" />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label={i18n.t("agentsPage.agentKillSwitch.confirmAgentNameAria", { defaultValue: "Confirm agent name" })}
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={agentName}
                  autoFocus
                />
              </InputGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isFiring}>
              {i18n.t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={fire}
              disabled={confirmationInput !== agentName || isFiring}
              aria-busy={isFiring}
            >
              {isFiring && <UiLoadingSpinner className="size-4" />}
              {isFiring ? i18n.t("agentsPage.agentKillSwitch.firing", { defaultValue: "Firing..." }) : i18n.t("agentsPage.agentKillSwitch.fireButton", { defaultValue: "Fire Kill Switch" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AgentKillSwitchDangerZone;
