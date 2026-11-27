import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import ChangePasswordForm from "./ChangePasswordForm";

const mockChangePasswordCall = vi.fn();
const mockToastSuccess = vi.fn();
const mockClearTokenCookies = vi.fn();
let mockPasswordResetRequired = false;

vi.mock("@/components/networking", () => ({
  changePasswordCall: (...args: unknown[]) => mockChangePasswordCall(...args),
  getProxyBaseUrl: () => "",
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({ accessToken: "sk-session-token", passwordResetRequired: mockPasswordResetRequired }),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    fromError: vi.fn(),
  },
}));

vi.mock("@/utils/cookieUtils", () => ({
  clearTokenCookies: (...args: unknown[]) => mockClearTokenCookies(...args),
}));

const fillForm = (values: { current: string; next: string; confirm: string }) => {
  fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: values.current } });
  fireEvent.change(screen.getByLabelText("New Password"), { target: { value: values.next } });
  fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: values.confirm } });
};

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Change Password" }));

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPasswordResetRequired = false;
  });

  it("sends the current and new password to the change endpoint and resets on success", async () => {
    mockChangePasswordCall.mockResolvedValue({ user_id: "user-123", message: "Password updated successfully." });
    render(<ChangePasswordForm />);

    fillForm({ current: "OldP@ssw0rd-2026", next: "NewP@ssw0rd-2026", confirm: "NewP@ssw0rd-2026" });
    submit();

    expect(await screen.findByLabelText("Current Password")).toHaveValue("");
    expect(mockChangePasswordCall).toHaveBeenCalledWith("sk-session-token", "OldP@ssw0rd-2026", "NewP@ssw0rd-2026");
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("blocks submission when the confirmation does not match", async () => {
    render(<ChangePasswordForm />);

    fillForm({ current: "OldP@ssw0rd-2026", next: "NewP@ssw0rd-2026", confirm: "Different-2026" });
    submit();

    expect(await screen.findByText("New passwords do not match")).toBeInTheDocument();
    expect(mockChangePasswordCall).not.toHaveBeenCalled();
  });

  it("shows the password rules and rejects reusing the current password", async () => {
    render(<ChangePasswordForm />);

    expect(screen.getByText(/meets this proxy's password policy/)).toBeInTheDocument();

    fillForm({ current: "SameP@ssw0rd-2026", next: "SameP@ssw0rd-2026", confirm: "SameP@ssw0rd-2026" });
    submit();

    expect(await screen.findByText("New password must be different from the current password")).toBeInTheDocument();
    expect(mockChangePasswordCall).not.toHaveBeenCalled();
  });

  it("tells the user to sign in again after a successful change", async () => {
    mockChangePasswordCall.mockResolvedValue({ user_id: "user-123", message: "Password updated successfully." });
    render(<ChangePasswordForm />);

    fillForm({ current: "OldP@ssw0rd-2026", next: "NewP@ssw0rd-2026", confirm: "NewP@ssw0rd-2026" });
    submit();

    await waitFor(() =>
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Password updated. Please sign in again with your new password.",
      ),
    );
  });

  it("shows the proxy's rejection message unwrapped", async () => {
    mockChangePasswordCall.mockRejectedValue(new Error("{'error': 'Current password is incorrect.'}"));
    render(<ChangePasswordForm />);

    fillForm({ current: "wrong-password", next: "NewP@ssw0rd-2026", confirm: "NewP@ssw0rd-2026" });
    submit();

    expect(await screen.findByText("Current password is incorrect.")).toBeInTheDocument();
    expect(mockToastSuccess).not.toHaveBeenCalled();
  });


  it("lists the unmet password rules instead of a generic policy message", async () => {
    await i18n.changeLanguage("zh-CN");
    mockChangePasswordCall.mockRejectedValue(
      new Error(
        "{'error': 'Password does not meet the required policy: must be at least 12 characters long, include an uppercase letter, include a number, include a special character.'}",
      ),
    );
    render(<ChangePasswordForm />);

    fireEvent.change(screen.getByLabelText(/当前密码|Current Password/), { target: { value: "OldP@ssw0rd-2026" } });
    fireEvent.change(screen.getByLabelText(/^新密码|^New Password/), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText(/确认新密码|Confirm New Password/), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: /修改密码|Change Password/ }));

    expect(await screen.findByText(/新密码不符合密码策略要求/)).toBeInTheDocument();
    expect(screen.getByText(/长度至少 12 个字符/)).toBeInTheDocument();
    expect(screen.getByText(/包含大写字母/)).toBeInTheDocument();
    expect(screen.getByText(/包含数字/)).toBeInTheDocument();
    expect(screen.getByText(/包含特殊字符/)).toBeInTheDocument();
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  describe("forced password reset", () => {
    it("shows the forced-reset warning only when the session is flagged", () => {
      mockPasswordResetRequired = true;
      render(<ChangePasswordForm />);

      expect(screen.getByText(/must be changed before you can use the dashboard/)).toBeInTheDocument();
    });

    it("hides the forced-reset warning for a normal session", () => {
      render(<ChangePasswordForm />);

      expect(screen.queryByText(/must be changed before you can use the dashboard/)).not.toBeInTheDocument();
    });

    it("signs the user out to re-login after a successful forced change", async () => {
      mockPasswordResetRequired = true;
      mockChangePasswordCall.mockResolvedValue({ user_id: "user-123", message: "Password updated successfully." });
      const replaceMock = vi.fn();
      const realLocation = window.location;
      Object.defineProperty(window, "location", { configurable: true, value: { replace: replaceMock } });

      try {
        render(<ChangePasswordForm />);
        fillForm({ current: "OldP@ssw0rd-2026", next: "NewP@ssw0rd-2026", confirm: "NewP@ssw0rd-2026" });
        submit();

        await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/ui/login/"));
        expect(mockClearTokenCookies).toHaveBeenCalled();
      } finally {
        Object.defineProperty(window, "location", { configurable: true, value: realLocation });
      }
    });
  });
});
