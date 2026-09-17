import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "@/lib/i18n";
import KeysPanel from "./KeysPanel";
import MCPCredentialsTab from "./MCPCredentialsTab";

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), fromError: vi.fn() },
}));

vi.mock("../networking", () => ({
  keyListCall: vi.fn(async () => ({
    keys: [{ token: "hashed-token-1", key_name: "sk-abc1234567890", key_alias: "demo", spend: 1.5, expires: null }],
  })),
  regenerateKeyCall: vi.fn(),
  listMCPUserCredentials: vi.fn(async () => [
    {
      server_id: "srv-1",
      server_name: "GitHub",
      alias: null,
      credential_type: "oauth2",
      has_credential: true,
      expires_at: null,
      connected_at: new Date().toISOString(),
    },
  ]),
  deleteMCPOAuthUserCredential: vi.fn(),
}));

const renderWithClient = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

describe("chat panels in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the keys panel heading, columns and rotate action in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    renderWithClient(<KeysPanel accessToken="tok" userId="user-1" premiumUser />);

    expect(await screen.findByText("我的 API 密钥")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent?.startsWith("查看您的虚拟密钥和花费") === true),
    ).toHaveTextContent("轮换密钥可生成新的凭证");
    expect(screen.getByText("密钥")).toBeInTheDocument();
    expect(screen.getByText("花费")).toBeInTheDocument();
    expect(screen.getByText("到期时间")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();

    const rotate = await screen.findByRole("button", { name: "轮换" });
    expect(rotate).toHaveAttribute("title", "轮换密钥");
  });

  it("renders the credentials tab pitch, table and revoke dialog in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    renderWithClient(<MCPCredentialsTab accessToken="tok" />);

    expect(await screen.findByText("应用凭证")).toBeInTheDocument();
    expect(screen.getByText("您已保存的 OAuth 连接；在对话中自动使用")).toBeInTheDocument();
    expect(screen.getByText("应用")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();

    const revoke = await screen.findByRole("button", { name: "撤销连接" });
    expect(screen.getByText("GitHub")).toBeInTheDocument();

    fireEvent.click(revoke);

    expect(await screen.findByText("撤销连接？")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.textContent?.startsWith("这将删除为 GitHub 保存的 OAuth 凭证。") === true,
      ),
    ).toHaveTextContent("您需要重新连接才能在对话中再次使用");
  });
});
