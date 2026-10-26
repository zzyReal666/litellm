import { Info } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import {
  DECISIONS_DOCS_URL,
  SYSTEM_ONE_PLAYGROUND_ROUTE,
  isDecisionSelection,
  type DecisionCatalog,
} from "@/lib/decisionModels";
import { uiHref } from "@/utils/uiHref";
import type { MountedFormValues } from "../common_components/MountedFormField";
import i18n from "@/lib/i18n";
import { Trans } from "react-i18next";

interface DecisionModelNoteProps {
  catalog: DecisionCatalog;
  litellmProvider: string | undefined;
}

const selectedModelNames = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((model): model is string => typeof model === "string");
  }
  return typeof value === "string" && value !== "" ? [value] : [];
};

export default function DecisionModelNote({ catalog, litellmProvider }: DecisionModelNoteProps) {
  const { control } = useFormContext<MountedFormValues>();
  const model = useWatch({ control, name: "model" });

  if (!isDecisionSelection(catalog, litellmProvider, selectedModelNames(model))) {
    return null;
  }

  return (
    <Alert variant="info" role="note" aria-label={i18n.t("modelsEndpoints.DecisionModelNote.decisionModelNotice", { defaultValue: "Decision model notice" })} className="mb-4">
      <Info />
      <AlertTitle>{i18n.t("modelsEndpoints.DecisionModelNote.decisionModel", { defaultValue: "Decision model" })}</AlertTitle>
      <AlertDescription>
        <p>
          <Trans
            i18nKey="modelsEndpoints.DecisionModelNote.decisionEndpointHelp"
            defaults="For decision requests, call <code>/v1/decisions</code> (OpenAI format) or <code>/v1/systemone</code> (System One format)."
            components={{ code: <code /> }}
          />
        </p>
        <p>
          <Trans
            i18nKey="modelsEndpoints.DecisionModelNote.playgroundHint"
            defaults="After you add it, <playground>test it in the Decisions playground</playground>"
            components={{ playground: <a href={uiHref(SYSTEM_ONE_PLAYGROUND_ROUTE)} className="underline" /> }}
          />
        </p>
      </AlertDescription>
    </Alert>
  );
}
