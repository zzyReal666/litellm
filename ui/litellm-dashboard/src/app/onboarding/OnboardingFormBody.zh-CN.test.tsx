import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import { OnboardingFormBody } from "./OnboardingFormBody";

const defaultProps = {
  variant: "signup" as const,
  userEmail: "user@example.com",
  isPending: false,
  claimError: null,
  onSubmit: vi.fn(),
};

describe("OnboardingFormBody in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the invite sign-up page in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<OnboardingFormBody {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "注册" })).toBeInTheDocument();
    expect(screen.getByText("认领您的用户账号以登录管理后台。")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByText("为您的账号设置密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "注册" })).toBeInTheDocument();
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
  });

  it("renders the reset-password page in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<OnboardingFormBody {...defaultProps} variant="reset_password" />);

    expect(screen.getByRole("heading", { name: "重置密码" })).toBeInTheDocument();
    expect(screen.getByText("重置密码以访问管理后台。")).toBeInTheDocument();
    expect(screen.getByText("请输入新密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "重置密码" })).toBeInTheDocument();
  });

  it("validates the password with a Chinese message", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<OnboardingFormBody {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: "注册" }));

    expect(await screen.findByText("请设置登录密码")).toBeInTheDocument();
  });
});