import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@/../tests/test-utils";

import i18n from "@/lib/i18n";

import { getBudgetDurationLabel, NEVER_RESETS_BUDGET_DURATION } from "./budget_duration_dropdown";

const label = (value: string | null | undefined): string => getBudgetDurationLabel(value, i18n.t.bind(i18n));

describe("getBudgetDurationLabel", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders every duration in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    expect(label("1h")).toBe("每小时");
    expect(label("24h")).toBe("每天");
    expect(label("7d")).toBe("每周");
    expect(label("30d")).toBe("每月");
    expect(label(NEVER_RESETS_BUDGET_DURATION)).toBe("永不重置");
    expect(label(null)).toBe("未设置");
    expect(label(undefined)).toBe("未设置");
  });

  it("keeps the English labels byte for byte", () => {
    expect(label("1h")).toBe("hourly");
    expect(label("24h")).toBe("daily");
    expect(label("7d")).toBe("weekly");
    expect(label("30d")).toBe("monthly");
    expect(label(NEVER_RESETS_BUDGET_DURATION)).toBe("Never resets");
    expect(label(null)).toBe("Not set");
  });

  it("passes an unknown duration through untouched", async () => {
    await i18n.changeLanguage("zh-CN");

    expect(label("42d")).toBe("42d");
  });
});
