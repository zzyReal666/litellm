import React from "react";
import { useTranslation } from "react-i18next";

import { Switch } from "@/components/ui/switch";

import type { ComplexityRouterConfigValue } from "./ComplexityRouterConfig";

export const ModalityRoutingControls: React.FC<{
  value: ComplexityRouterConfigValue;
  onChange: (value: ComplexityRouterConfigValue) => void;
}> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const modalityRouting = value.modality_routing ?? false;
  const routingLabel = t("addModel.modalityRouting.routeImagesLabel", {
    defaultValue: "Route image requests to vision-capable models",
  });
  const overrideLabel = t("addModel.modalityRouting.pinOverrideLabel", {
    defaultValue: "Override session pin for image requests",
  });
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={modalityRouting}
          onCheckedChange={(nextModalityRouting) => onChange({ ...value, modality_routing: nextModalityRouting })}
          aria-label={routingLabel}
        />
        <strong className="font-semibold">{routingLabel}</strong>
      </div>
      <span className="block text-xs mb-3 text-muted-foreground">
        {t("addModel.modalityRouting.routeImagesHint", {
          defaultValue:
            "Replaces a routed model that cannot take image input with the nearest higher tier that can, then the default model, instead of failing with a provider 400. Only models explicitly declared supports_vision false are replaced, and a kept session pin still wins unless you turn on the override below.",
        })}
      </span>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={value.modality_pin_override ?? false}
          onCheckedChange={(modalityPinOverride) => onChange({ ...value, modality_pin_override: modalityPinOverride })}
          disabled={!modalityRouting}
          aria-label={overrideLabel}
        />
        <strong className="font-semibold">{overrideLabel}</strong>
      </div>
      <span className="block text-xs text-muted-foreground">
        {t("addModel.modalityRouting.pinOverrideHint", {
          defaultValue:
            "Route an image turn to a capable model even when the session is pinned to one that cannot take images. The pin is kept, so the next text turn goes back to it. Needs image routing turned on.",
        })}
      </span>
    </>
  );
};
