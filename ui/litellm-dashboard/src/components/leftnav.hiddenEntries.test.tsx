import { describe, expect, it } from "vitest";

import { menuGroups, visibleMenuGroups, type MenuVisibilityContext } from "./leftnav";

const adminContext: MenuVisibilityContext = {
  userRole: "Admin",
  isViewOnly: false,
  isOrgAdmin: true,
  isTeamAdmin: false,
};

const flatKeys = (groups: ReturnType<typeof visibleMenuGroups>): string[] =>
  groups.flatMap((group) => group.items.flatMap((item) => [item.key, ...(item.children ?? []).map((c) => c.key)]));

describe("temporarily hidden navigation entries", () => {
  it("drops the developer tools group and the organizations entry", () => {
    const groups = visibleMenuGroups(menuGroups, adminContext);

    expect(groups.map((group) => group.groupLabel)).not.toContain("DEVELOPER TOOLS");
    expect(flatKeys(groups)).not.toContain("organizations");
  });

  it("drops the temporarily hidden product entries", () => {
    const keys = flatKeys(visibleMenuGroups(menuGroups, adminContext));

    for (const hiddenKey of ["agentic", "mcp-servers", "skills", "policies", "tools", "lens"]) {
      expect(keys).not.toContain(hiddenKey);
    }
  });

  it("keeps the remaining product entries visible", () => {
    const keys = flatKeys(visibleMenuGroups(menuGroups, adminContext));

    expect(keys).toEqual(expect.arrayContaining(["home", "api-keys", "models", "guardrails", "logs"]));
  });

  it("keeps the remaining access control entries visible", () => {
    const keys = flatKeys(visibleMenuGroups(menuGroups, adminContext));

    expect(keys).toEqual(expect.arrayContaining(["teams", "users", "access-groups", "budgets"]));
  });
});
