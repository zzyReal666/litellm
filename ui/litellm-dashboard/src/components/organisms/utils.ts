import i18n from "@/lib/i18n";

const extractErrorMessage = (error: any, errorString: string): string => {
  try {
    if (error && typeof error === "object" && !(error instanceof Error)) {
      const errorObj = error?.error || error;
      if (errorObj?.message) {
        return errorObj.message;
      }
    }
    const jsonMatch = errorString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedError = JSON.parse(jsonMatch[0]);
      const errorObj = parsedError?.error || parsedError;
      if (errorObj?.message) {
        return errorObj.message;
      }
    }
  } catch {
    return errorString;
  }
  return errorString;
};

const DUPLICATE_ALIAS_PATTERN = /key alias ['"]([^'"]+)['"] already exists/i;

export const simplifyKeyGenerateError = (error: any): string => {
  const errorString =
    error && typeof error === "object" && !(error instanceof Error) ? JSON.stringify(error) : String(error);
  const errorMessage = extractErrorMessage(error, errorString);

  const duplicateAlias = DUPLICATE_ALIAS_PATTERN.exec(errorMessage) ?? DUPLICATE_ALIAS_PATTERN.exec(errorString);
  if (duplicateAlias) {
    return i18n.t("organisms.createKeyButton.duplicateKeyAliasGlobal", {
      alias: duplicateAlias[1],
      defaultValue:
        "The key name (alias) {{alias}} is already used by another key. Choose a different name and try again.",
    });
  }

  if (!errorString.includes("/key/generate") && !errorString.includes("KeyManagementRoutes.KEY_GENERATE")) {
    return `Error creating the key: ${error}`;
  }

  if (
    errorString.includes("team_member_permission_error") ||
    errorMessage.includes("Team member does not have permissions")
  ) {
    return "Team member does not have permission to generate key for this team. Ask your proxy admin to configure the team member permission settings.";
  }

  return `Error creating the key: ${error}`;
};
