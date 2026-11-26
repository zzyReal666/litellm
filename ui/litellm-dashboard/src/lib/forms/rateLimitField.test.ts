import { describe, expect, it } from "vitest";

import i18n from "@/lib/i18n";

import { isValidRateLimitValue, MAX_RATE_LIMIT, rateLimitField, rateLimitValidator } from "./rateLimitField";

describe("rateLimitField", () => {
  it.each([undefined, null, "", "0", "1000", 42])("accepts %s as an empty or usable limit", (value) => {
    expect(isValidRateLimitValue(value)).toBe(true);
  });

  it.each(["5555555555555555555555555555", Number.MAX_VALUE, "-1", "1.5", "abc", NaN, Infinity])(
    "rejects %s",
    (value) => {
      expect(isValidRateLimitValue(value)).toBe(false);
    },
  );

  it.each(["1", "1000", 1000])("parses %s into a number or null", (value) => {
    expect(rateLimitField(i18n).parse(value)).toBe(Number(value));
    expect(rateLimitField(i18n).parse("")).toBeNull();
  });

  it("rejects a number built from 28 digits instead of sending it to the proxy", () => {
    const parsed = rateLimitField(i18n).safeParse("5555555555555555555555555555");
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe(
        i18n.t("validation.rateLimitWholeNumber", {
          defaultValue: "Enter a non-negative whole number, or leave empty for unlimited",
        }),
      );
    }
  });

  it("keeps MAX_RATE_LIMIT usable for form validators", () => {
    expect(rateLimitValidator(i18n)(MAX_RATE_LIMIT)).toBe(true);
    expect(rateLimitValidator(i18n)(MAX_RATE_LIMIT + 1)).not.toBe(true);
  });
});
