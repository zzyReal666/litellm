import React from "react";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { Switch } from "@/components/ui/switch";
import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";
import i18n from "@/lib/i18n";

const HousekeepingRoutingControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const enabled = value.route_housekeeping_to_cheapest_tier ?? true;
  const patterns = value.housekeeping_patterns ?? [];
  return (
    <>
      <div className="mb-2 flex items-center gap-2">
        <Switch
          checked={enabled}
          onCheckedChange={(next) => onChange({ ...value, route_housekeeping_to_cheapest_tier: next })}
          aria-label={i18n.t("modelsEndpoints.HousekeepingRoutingControls.routeHousekeepingCallsToTheCheapest", { defaultValue: "Route housekeeping calls to the cheapest tier" })}
        />
        <strong className="font-semibold">{i18n.t("modelsEndpoints.HousekeepingRoutingControls.routeHousekeepingCallsToTheCheapest2", { defaultValue: "Route housekeeping calls to the cheapest tier" })}</strong>
      </div>
      <span className="mb-3 block text-xs text-muted-foreground">
        {i18n.t("modelsEndpoints.HousekeepingRoutingControls.conversationTitleStyleCallsSkipThe", { defaultValue: "Conversation-title style calls skip the classifier and go to the cheapest tier." })}
      </span>
      <strong className="mb-1 block font-semibold">{i18n.t("modelsEndpoints.HousekeepingRoutingControls.additionalHousekeepingSentinels", { defaultValue: "Additional housekeeping sentinels" })}</strong>
      <MultiSelect
        options={patterns.map((pattern) => ({ label: pattern, value: pattern }))}
        value={patterns}
        onValueChange={(next) => onChange({ ...value, housekeeping_patterns: next.length > 0 ? next : undefined })}
        placeholder={i18n.t("modelsEndpoints.HousekeepingRoutingControls.eGConversationTitle", { defaultValue: "e.g., conversation title" })}
        emptyText={i18n.t("modelsEndpoints.HousekeepingRoutingControls.typeToAddASentinel", { defaultValue: "Type to add a sentinel" })}
        allowCustomValues
        disabled={!enabled}
        className="w-full"
      />
      <span className="mt-1 block text-xs text-muted-foreground">
        {i18n.t("modelsEndpoints.HousekeepingRoutingControls.caseSensitiveLiteralStringsAddedTo", { defaultValue: "Case-sensitive literal strings added to the built-in conversation-title sentinels." })}
        {!enabled && " Turn housekeeping routing on for these to take effect."}
      </span>
    </>
  );
};

export default HousekeepingRoutingControls;
