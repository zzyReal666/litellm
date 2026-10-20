import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { CredentialItem } from "@/components/networking";

import VectorStoreForm from "./VectorStoreForm";

vi.mock("@/components/networking");

vi.mock("@/components/molecules/notifications_manager", () => ({
  __esModule: true,
  default: {
    success: vi.fn(),
    fromBackend: vi.fn(),
  },
}));

const renderForm = () =>
  render(
    <VectorStoreForm
      isVisible={true}
      onCancel={vi.fn()}
      onSuccess={vi.fn()}
      accessToken="test-token"
      credentials={[] as CredentialItem[]}
    />,
  );

describe("VectorStoreForm in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the dialog title, field labels and actions in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderForm();

    expect(screen.getByText("添加新向量存储")).toBeInTheDocument();
    expect(screen.getByText("向量存储 ID")).toBeInTheDocument();
    expect(screen.getByText("向量存储名称")).toBeInTheDocument();
    expect(screen.getByText("元数据")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });
});
