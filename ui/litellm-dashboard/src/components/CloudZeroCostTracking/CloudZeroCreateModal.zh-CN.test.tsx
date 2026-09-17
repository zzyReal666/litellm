import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { renderWithProviders } from "../../../tests/test-utils";
import CloudZeroCreationModal from "./CloudZeroCreateModal";

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  __esModule: true,
  default: () => ({ accessToken: "test-token" }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroCreate", () => ({
  useCloudZeroCreate: () => ({ mutate: vi.fn(), isPending: false }),
}));

const renderModal = () => renderWithProviders(<CloudZeroCreationModal open={true} onOk={vi.fn()} onCancel={vi.fn()} />);

describe("CloudZeroCreateModal in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the title, fields and buttons in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderModal();

    expect(await screen.findByText("创建 CloudZero 集成")).toBeInTheDocument();
    expect(screen.getByLabelText("CloudZero API 密钥")).toBeInTheDocument();
    expect(screen.getByLabelText("连接 ID")).toBeInTheDocument();
    expect(screen.getByLabelText("时区")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建" })).toBeInTheDocument();
  });

  it("shows the required field messages in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: "创建" }));

    expect(await screen.findByText("请输入您的 CloudZero API 密钥")).toBeInTheDocument();
    expect(screen.getByText("请输入您的 CloudZero 连接 ID")).toBeInTheDocument();
  });

  it("labels the API key visibility toggle in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: "显示 API 密钥" }));

    expect(screen.getByRole("button", { name: "隐藏 API 密钥" })).toBeInTheDocument();
  });
});
