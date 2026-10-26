import React, { useState } from "react";
import i18n from "@/lib/i18n";
import { Trans } from "react-i18next";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

interface CreatedKeyDisplayProps {
  apiKey: string;
}

/**
 * Shared component for displaying a newly-created virtual key.
 * Used on the Virtual Keys page and in the Add Agent wizard.
 */
const CreatedKeyDisplay: React.FC<CreatedKeyDisplayProps> = ({ apiKey }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    toast.success(i18n.t("createdKeyDisplay.copySuccess", { defaultValue: "Key copied to clipboard" }));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="mb-2">
        <Trans
          i18nKey="createdKeyDisplay.saveSecretKeyHint"
          defaults="Please save this secret key somewhere safe and accessible. For security reasons, <b>you will not be able to view it again</b> through your LiteLLM account. If you lose this secret key, you will need to generate a new one."
          components={{ b: <b /> }}
        />
      </p>

      <p className="text-sm text-muted-foreground mt-3 mb-1">{i18n.t("createdKeyDisplay.virtual-key", { defaultValue: "Virtual Key:" })}</p>
      <div className="bg-muted rounded-md p-2.5 mb-2.5">
        <pre className="m-0 whitespace-normal break-words text-foreground">{apiKey}</pre>
      </div>

      <CopyToClipboard text={apiKey} onCopy={handleCopy}>
        <Button className="mt-3">
          {copied
            ? i18n.t("createdKeyDisplay.copied", { defaultValue: "Copied!" })
            : i18n.t("createdKeyDisplay.copyVirtualKey", { defaultValue: "Copy Virtual Key" })}
        </Button>
      </CopyToClipboard>
    </div>
  );
};

export default CreatedKeyDisplay;
