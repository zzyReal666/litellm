import React from "react";
import { Copy, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EndpointType } from "@/components/chat_ui/mode_endpoint_mapping";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SessionManagementProps {
  endpointType: string | null;
  responsesSessionId: string | null;
  useApiSessionManagement: boolean;
  onToggleSessionManagement: (useApi: boolean) => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({
  endpointType,
  responsesSessionId,
  useApiSessionManagement,
  onToggleSessionManagement,
}) => {
  const { t } = useTranslation();

  if (endpointType !== EndpointType.RESPONSES) {
    return null;
  }

  const handleCopySessionId = async () => {
    if (responsesSessionId) {
      try {
        await navigator.clipboard.writeText(responsesSessionId);
        toast.success(
          t("playground.sessionManagement.copiedToClipboard", { defaultValue: "Response ID copied to clipboard!" }),
        );
      } catch {
        toast.error(
          t("playground.sessionManagement.copyResponseIdFailed", { defaultValue: "Unable to copy response ID" }),
        );
      }
    }
  };

  const getSessionDisplay = () => {
    if (!responsesSessionId) {
      return useApiSessionManagement
        ? t("playground.sessionManagement.apiSessionReady", { defaultValue: "API Session: Ready" })
        : t("playground.sessionManagement.uiSessionReady", { defaultValue: "UI Session: Ready" });
    }

    const sessionPrefix = useApiSessionManagement
      ? t("playground.sessionManagement.responseIdPrefix", { defaultValue: "Response ID" })
      : t("playground.sessionManagement.uiSessionPrefix", { defaultValue: "UI Session" });
    const truncatedId = responsesSessionId.slice(0, 10);
    return `${sessionPrefix}: ${truncatedId}...`;
  };

  const getSessionDescription = () => {
    if (!responsesSessionId) {
      return useApiSessionManagement
        ? t("playground.sessionManagement.apiSessionReadyDesc", {
            defaultValue: "LiteLLM will manage session using previous_response_id",
          })
        : t("playground.sessionManagement.uiSessionReadyDesc", {
            defaultValue: "UI will manage session using chat history",
          });
    }

    return useApiSessionManagement
      ? t("playground.sessionManagement.apiSessionActiveDesc", {
          defaultValue: "LiteLLM API session active - context maintained server-side",
        })
      : t("playground.sessionManagement.uiSessionActiveDesc", {
          defaultValue: "UI session active - context maintained client-side",
        });
  };

  return (
    <div className="mb-4">
      {/* Session Management Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {t("playground.sessionManagement.title", { defaultValue: "Session Management" })}
          </span>
          <Tooltip>
            <TooltipTrigger
              aria-label={t("playground.sessionManagement.aboutTitle", { defaultValue: "About session management" })}
            >
              <Info className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              {t("playground.sessionManagement.toggleTooltip", {
                defaultValue:
                  "Choose between LiteLLM API session management (using previous_response_id) or UI-based session management (using chat history)",
              })}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden="true">UI</span>
          <Switch
            checked={useApiSessionManagement}
            onCheckedChange={onToggleSessionManagement}
            aria-label={t("playground.sessionManagement.useApiSessionManagement", {
              defaultValue: "Use API session management",
            })}
            size="sm"
          />
          <span aria-hidden="true">API</span>
        </div>
      </div>

      {/* Session Status Indicator */}
      <div
        className={`text-xs p-2 rounded-md ${
          responsesSessionId
            ? "bg-success/10 text-success border border-success/20"
            : "bg-info/10 text-info border border-info/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Info className="size-3" />
            {getSessionDisplay()}
          </div>
          {responsesSessionId && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopySessionId}
                    aria-label={t("playground.sessionManagement.copyResponseId", {
                      defaultValue: "Copy response ID",
                    })}
                    className="ml-2 hover:bg-success/15"
                  />
                }
              >
                <Copy className="size-3" />
              </TooltipTrigger>
              <TooltipContent className="max-w-lg">
                <div className="text-xs">
                  <div className="mb-1">
                    {t("playground.sessionManagement.copyTooltipTitle", {
                      defaultValue: "Copy response ID to continue session:",
                    })}
                  </div>
                  <div className="bg-gray-800 text-gray-100 p-2 rounded-sm font-mono text-xs whitespace-pre-wrap">
                    {`curl -X POST "your-proxy-url/v1/responses" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "input": [{"role": "user", "content": "your message", "type": "message"}],
    "previous_response_id": "${responsesSessionId}",
    "stream": true
  }'`}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-xs opacity-75 mt-1">{getSessionDescription()}</div>
      </div>
    </div>
  );
};

export default SessionManagement;
