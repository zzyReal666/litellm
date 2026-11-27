import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/lib/i18n";

import { localizePasswordError } from "./passwordPolicyError";

const POLICY_MESSAGE =
  "Password does not meet the required policy: must be at least 12 characters long, include an uppercase letter, include a lowercase letter, include a number, include a special character.";

describe("localizePasswordError", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("spells out every unmet password rule in Chinese instead of a generic message", async () => {
    await i18n.changeLanguage("zh-CN");

    const message = localizePasswordError(POLICY_MESSAGE);

    expect(message).toContain("新密码不符合密码策略要求");
    expect(message).toContain("长度至少 12 个字符");
    expect(message).toContain("包含大写字母");
    expect(message).toContain("包含小写字母");
    expect(message).toContain("包含数字");
    expect(message).toContain("包含特殊字符");
  });

  it("keeps the unmet rules visible when only some of them fail", async () => {
    await i18n.changeLanguage("zh-CN");

    const message = localizePasswordError(
      "Password does not meet the required policy: must be at least 16 characters long, include a special character.",
    );

    expect(message).toContain("长度至少 16 个字符");
    expect(message).toContain("包含特殊字符");
    expect(message).not.toContain("包含数字");
  });

  it("keeps the detailed rules in English for the English UI", async () => {
    const message = localizePasswordError(POLICY_MESSAGE);

    expect(message).toContain("The new password does not meet the password policy");
    expect(message).toContain("at least 12 characters long");
    expect(message).toContain("a special character");
  });

  it("maps the current-password, reuse and breach errors", async () => {
    await i18n.changeLanguage("zh-CN");

    expect(localizePasswordError("Current password is incorrect.")).toBe("当前密码不正确");
    expect(localizePasswordError("New password must be different from the current password.")).toBe(
      "新密码不能与当前密码相同",
    );
    expect(
      localizePasswordError(
        "This password appears in known data breaches and cannot be used. Please choose a different password.",
      ),
    ).toContain("已知数据泄露");
  });

  it("leaves an unrelated error untouched", () => {
    expect(localizePasswordError("Something else broke")).toBe("Something else broke");
  });
});
