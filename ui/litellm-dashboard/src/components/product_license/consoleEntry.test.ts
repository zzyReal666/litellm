import { describe, expect, it } from "vitest";
import { consoleLoginUrl } from "./consoleEntry";

describe("consoleLoginUrl", () => {
  it("points at the login page and returns to the console afterwards", () => {
    expect(consoleLoginUrl("")).toBe("/ui/login/?redirect_to=%2Fui%2F");
  });

  it("keeps the proxy base path", () => {
    expect(consoleLoginUrl("/gateway")).toBe("/gateway/ui/login/?redirect_to=%2Fgateway%2Fui%2F");
  });

  it("treats a missing base url as root mounted", () => {
    expect(consoleLoginUrl(null)).toBe("/ui/login/?redirect_to=%2Fui%2F");
    expect(consoleLoginUrl(undefined)).toBe("/ui/login/?redirect_to=%2Fui%2F");
  });
});
