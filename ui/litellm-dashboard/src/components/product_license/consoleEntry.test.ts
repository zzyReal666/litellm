import { describe, expect, it } from "vitest";
import { consoleLoginUrl } from "./consoleEntry";

describe("consoleLoginUrl", () => {
  it("points at the login page and returns to the console afterwards", () => {
    expect(consoleLoginUrl("")).toBe("/ui/login/?redirect_to=%2Fui%2F&force_login=1");
  });

  it("keeps the proxy base path", () => {
    expect(consoleLoginUrl("/gateway")).toBe("/gateway/ui/login/?redirect_to=%2Fgateway%2Fui%2F&force_login=1");
  });

  it("treats a missing base url as root mounted", () => {
    expect(consoleLoginUrl(null)).toBe("/ui/login/?redirect_to=%2Fui%2F&force_login=1");
    expect(consoleLoginUrl(undefined)).toBe("/ui/login/?redirect_to=%2Fui%2F&force_login=1");
  });
});
