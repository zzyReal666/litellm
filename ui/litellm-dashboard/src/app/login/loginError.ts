import i18n from "@/lib/i18n";

const INVALID_CREDENTIALS = [
  "invalid credentials",
  "incorrect username",
  "incorrect password",
  "authentication failed",
  "authentication error",
  "unauthorized",
  "401",
];

const TOO_MANY_ATTEMPTS = ["too many", "429", "rate limit"];
const NETWORK_FAILURE = ["failed to fetch", "network error", "networkerror", "load failed", "connection refused"];

export const describeLoginError = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const message = raw.toLowerCase();

  if (INVALID_CREDENTIALS.some((marker) => message.includes(marker))) {
    return i18n.t("login.invalidCredentials", {
      defaultValue: "Incorrect username or password. Try again, or ask an administrator to reset your password.",
    });
  }
  if (TOO_MANY_ATTEMPTS.some((marker) => message.includes(marker))) {
    return i18n.t("login.tooManyAttempts", {
      defaultValue: "Too many login attempts. Wait a moment and try again.",
    });
  }
  if (NETWORK_FAILURE.some((marker) => message.includes(marker))) {
    return i18n.t("login.networkError", {
      defaultValue: "Cannot reach the gateway. Check your network or gateway address and try again.",
    });
  }
  return i18n.t("login.unexpectedError", {
    defaultValue: "Login failed. Try again later or contact an administrator.",
  });
};
