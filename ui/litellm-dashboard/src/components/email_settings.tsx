import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/lib/toast";
import { serviceHealthCheck, setCallbacksCall } from "./networking";
import i18n from "@/lib/i18n";
import { EmailEventSettings } from "./email_events";

interface EmailSettingsProps {
  accessToken: string | null;
  premiumUser: boolean;
  alerts: any[];
}

const requiredMarker = () => (
  <span className="text-destructive"> {i18n.t("emailSettings.requiredStar", { defaultValue: "Required *" })} </span>
);

const fieldHelp = (key: string): React.ReactNode => {
  const required = requiredMarker();
  switch (key) {
    case "SMTP_HOST":
      return (
        <>
          {i18n.t("emailSettings.smtpHostDesc", { defaultValue: "Enter the SMTP host address, e.g. `smtp.resend.com`" })}
          {required}
        </>
      );
    case "SMTP_PORT":
      return (
        <>
          {i18n.t("emailSettings.smtpPortDesc", { defaultValue: "Enter the SMTP port number, e.g. `587`" })}
          {required}
        </>
      );
    case "SMTP_USERNAME":
      return (
        <>
          {i18n.t("emailSettings.smtpUsernameDesc", { defaultValue: "Enter the SMTP username, e.g. `username`" })}
          {required}
        </>
      );
    case "SMTP_PASSWORD":
      return required;
    case "SMTP_SENDER_EMAIL":
      return (
        <>
          {i18n.t("emailSettings.smtpSenderEmailDesc", {
            defaultValue: "Enter the sender email address, e.g. `sender@berri.ai`",
          })}
          {required}
        </>
      );
    case "TEST_EMAIL_ADDRESS":
      return (
        <>
          {i18n.t("emailSettings.testEmailAddressDesc", {
            defaultValue: "Email Address to send `Test Email Alert` to. example: `info@berri.ai`",
          })}
          {required}
        </>
      );
    case "EMAIL_LOGO_URL":
      return i18n.t("emailSettings.emailLogoUrlDesc", {
        defaultValue: "(Optional) Customize the Logo that appears in the email, pass a url to your logo",
      });
    case "EMAIL_SUPPORT_CONTACT":
      return i18n.t("emailSettings.emailSupportContactDesc", {
        defaultValue: "(Optional) Customize the support email address that appears in the email. Default is support@berri.ai",
      });
    default:
      return null;
  }
};

const PREMIUM_ONLY_FIELDS = ["EMAIL_LOGO_URL", "EMAIL_SUPPORT_CONTACT"];

const SENSITIVE_FIELD_PATTERN = /(PASSWORD|SECRET|KEY|TOKEN)/i;

const EmailSettings: React.FC<EmailSettingsProps> = ({ accessToken, premiumUser, alerts }) => {
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleFieldVisibility = (key: string) => {
    setVisibleFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveEmailSettings = async () => {
    if (!accessToken) {
      return;
    }

    let updatedVariables: Record<string, string> = {};

    alerts
      .filter((alert) => alert.name === "email")
      .forEach((alert) => {
        Object.entries(alert.variables ?? {}).forEach(([key, value]) => {
          const inputElement = document.querySelector(`input[name="${key}"]`) as HTMLInputElement;
          if (!inputElement || !inputElement.value) {
            return;
          }
          // Only send fields the admin actually edited. Values rendered from the
          // server are masked (SMTP_PASSWORD) or sourced from the process
          // environment, so re-submitting an untouched field would persist a mask
          // or copy env-managed config into the database.
          if (inputElement.value === (value == null ? "" : String(value))) {
            return;
          }
          updatedVariables[key] = inputElement.value;
        });
      });

    //filter out null / undefined values for updatedVariables

    const payload = {
      general_settings: {
        alerting: ["email"],
      },
      environment_variables: updatedVariables,
    };
    try {
      await setCallbacksCall(accessToken, payload);
      toast.success(i18n.t("emailSettings.saveSuccess", { defaultValue: "Email settings updated successfully" }));
    } catch (error) {
      toast.fromError(error);
    }
  };

  return (
    <>
      <div className="mt-6 mb-6">
        <EmailEventSettings accessToken={accessToken} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{i18n.t("emailSettings.emailServerSettings", { defaultValue: "Email Server Settings" })}</CardTitle>
          <p className="text-sm">
            
          </p>
        </CardHeader>

        <CardContent>
          {alerts
            .filter((alert) => alert.name === "email")
            .map((alert, index) => (
              <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(alert.variables ?? {}).map(([key, value]) => {
                  const isLocked = !premiumUser && PREMIUM_ONLY_FIELDS.includes(key);
                  const isSensitive = SENSITIVE_FIELD_PATTERN.test(key);
                  const isVisible = visibleFields[key] || false;
                  return (
                    <div key={key} className="space-y-1">
                      {isLocked ? (
                        <p className="text-sm">✨ {key}</p>
                      ) : (
                        <p className="text-sm">{key}</p>
                      )}
                      <InputGroup className="max-w-100">
                        <InputGroupInput
                          name={key}
                          defaultValue={value as string}
                          type={isSensitive && !isVisible ? "password" : "text"}
                          disabled={isLocked}
                        />
                        {isSensitive && (
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              size="icon-xs"
                              onClick={() => toggleFieldVisibility(key)}
                              aria-label={
                                isVisible
                                  ? i18n.t("emailSettings.hideCredential", { defaultValue: "Hide credential" })
                                  : i18n.t("emailSettings.showCredential", { defaultValue: "Show credential" })
                              }
                            >
                              {isVisible ? <EyeOff /> : <Eye />}
                            </InputGroupButton>
                          </InputGroupAddon>
                        )}
                      </InputGroup>
                      <div className="text-xs text-muted-foreground italic">{fieldHelp(key)}</div>
                    </div>
                  );
                })}
              </div>
            ))}

          <div className="mt-6 flex gap-2">
            <Button onClick={() => handleSaveEmailSettings()}>
              {i18n.t("emailSettings.saveChanges", { defaultValue: "Save Changes" })}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!accessToken) return;
                try {
                  await serviceHealthCheck(accessToken, "email");
                  toast.success(i18n.t("emailSettings.testSuccess", { defaultValue: "Email test triggered. Check your configured email inbox/logs." }));
                } catch (error) {
                  toast.fromError(error);
                }
              }}
            >
              {i18n.t("emailSettings.testEmailAlerts", { defaultValue: "Test Email Alerts" })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default EmailSettings;
