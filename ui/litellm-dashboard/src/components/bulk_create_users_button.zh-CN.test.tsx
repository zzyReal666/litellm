import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import BulkCreateUsersButton from "./bulk_create_users_button";

vi.mock("./networking", () => ({
  userCreateCall: vi.fn(),
  invitationCreateCall: vi.fn(),
  getProxyUISettings: vi.fn().mockResolvedValue({
    PROXY_BASE_URL: null,
    PROXY_LOGOUT_URL: null,
    DEFAULT_TEAM_DISABLED: false,
    SSO_ENABLED: false,
  }),
}));

const renderButton = () => render(<BulkCreateUsersButton accessToken="test-token" teams={[]} possibleUIRoles={null} />);

describe("BulkCreateUsersButton in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the trigger button and the upload step in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderButton();

    expect(screen.getByText("+ 批量邀请用户")).toBeInTheDocument();

    await user.click(screen.getByText("+ 批量邀请用户"));

    expect(screen.getByText("批量邀请用户")).toBeInTheDocument();
    expect(screen.getByText("下载并填写模板")).toBeInTheDocument();
    expect(screen.getByText("上传填写好的 CSV")).toBeInTheDocument();
    expect(screen.getByText("将 CSV 文件拖拽到此处")).toBeInTheDocument();
    expect(screen.getByText("浏览文件")).toBeInTheDocument();
    expect(screen.getByText("模板列名说明")).toBeInTheDocument();
    expect(screen.getByText("用户邮箱地址（必填）")).toBeInTheDocument();
  });
});
