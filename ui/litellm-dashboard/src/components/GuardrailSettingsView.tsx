import React from "react";
import { Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cva.config";
import i18n from "@/lib/i18n";

interface GuardrailSettingsViewProps {
  globalGuardrailNames: Set<string>;
  teamGuardrails?: string[];
  optedOutGlobalGuardrails?: string[];
  killSwitchOn?: boolean;
  variant?: "card" | "inline";
  className?: string;
}

export function GuardrailSettingsView({
  globalGuardrailNames,
  teamGuardrails = [],
  optedOutGlobalGuardrails = [],
  killSwitchOn = false,
  variant = "card",
  className = "",
}: GuardrailSettingsViewProps) {
  const optedOutSet = new Set(optedOutGlobalGuardrails);
  const globalsRunning = Array.from(globalGuardrailNames).filter((n) => !optedOutSet.has(n));
  const nonGlobalOptIns = teamGuardrails.filter((n) => !globalGuardrailNames.has(n));

  const isEmpty = !killSwitchOn && globalsRunning.length === 0 && nonGlobalOptIns.length === 0;

  const content = isEmpty ? (
    <span className="block text-muted-foreground">{i18n.t("guardrailSettingsView.noGuardrailsConfigured", { defaultValue: "No guardrails configured" })}</span>
  ) : (
    <div className="flex flex-col gap-4">
      <div>
        <span className="mb-2 flex items-center gap-1 text-sm font-medium text-foreground">
          <Globe2 className="size-4" aria-label={i18n.t("guardrailSettingsView.globalGuardrailAriaLabel", { defaultValue: "Global guardrail" })} />
          {i18n.t("guardrailSettingsView.globalLabel", { defaultValue: "Global" })}
        </span>
        {killSwitchOn ? (
          <Badge variant="outline">{i18n.t("guardrailSettingsView.bypassedForTeam", { defaultValue: "Bypassed for this team" })}</Badge>
        ) : globalsRunning.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {globalsRunning.map((name) => (
              <Badge key={name}>{name}</Badge>
            ))}
          </div>
        ) : (
          <span className="block text-sm text-muted-foreground">{i18n.t("guardrailSettingsView.noneConfigured", { defaultValue: "None configured" })}</span>
        )}
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">{i18n.t("guardrailSettingsView.teamSpecificLabel", { defaultValue: "Team-specific" })}</span>
        {nonGlobalOptIns.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {nonGlobalOptIns.map((name) => (
              <Badge key={name}>{name}</Badge>
            ))}
          </div>
        ) : (
          <span className="block text-sm text-muted-foreground">{i18n.t("guardrailSettingsView.noneConfigured", { defaultValue: "None configured" })}</span>
        )}
      </div>
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{i18n.t("guardrailSettingsView.cardTitle", { defaultValue: "Guardrails Settings" })}</CardTitle>
          <CardDescription>{i18n.t("guardrailSettingsView.cardSubtitle", { defaultValue: "Global and team-specific guardrails applied to this team" })}</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(className)}>
      <span className="mb-3 block font-medium text-foreground">{i18n.t("guardrailSettingsView.inlineTitle", { defaultValue: "Guardrails Settings" })}</span>
      {content}
    </div>
  );
}

export default GuardrailSettingsView;
