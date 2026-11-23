import { describe, expect, it } from "vitest";
import i18n from "@/lib/i18n";
import { describeLoginError } from "./loginError";

const t = (key: string, defaultValue: string) => i18n.t(key, { defaultValue });

describe("describeLoginError", () => {
  it("returns null without an error", () => {
    expect(describeLoginError(null)).toBeNull();
    expect(describeLoginError(undefined)).toBeNull();
    expect(describeLoginError("")).toBeNull();
  });

  it("maps invalid credentials to an actionable localized message", () => {
    expect(describeLoginError("Invalid credentials used to access UI. Check password for user")).toBe(
      t(
        "login.invalidCredentials",
        "Incorrect username or password. Try again, or ask an administrator to reset your password.",
      ),
    );
  });

  it("keeps the invalid-credentials message for both password and username failures", () => {
    expect(describeLoginError("Incorrect username")).toBe(describeLoginError("Incorrect password"));
  });

  it("maps throttling and network failures", () => {
    expect(describeLoginError("429 Too Many Requests")).toBe(
      t("login.tooManyAttempts", "Too many login attempts. Wait a moment and try again."),
    );
    expect(describeLoginError("TypeError: Failed to fetch")).toBe(
      t("login.networkError", "Cannot reach the gateway. Check your network or gateway address and try again."),
    );
  });

  it("falls back to a clear generic message instead of leaking the raw error", () => {
    expect(describeLoginError("Database exploded")).toBe(
      t("login.unexpectedError", "Login failed. Try again later or contact an administrator."),
    );
  });
});
