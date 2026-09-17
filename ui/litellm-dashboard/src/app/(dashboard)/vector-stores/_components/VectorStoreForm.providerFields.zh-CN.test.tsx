import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("@/components/llm_calls/fetch_models", () => ({
  fetchAvailableModels: vi.fn().mockResolvedValue([{ model_group: "text-embedding-3-small", mode: "embedding" }]),
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

const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 });

const chooseProvider = async (user: ReturnType<typeof userEvent.setup>, providerLabel: string) => {
  const trigger = screen.getAllByRole("combobox")[0];
  await user.click(trigger);
  if (trigger.getAttribute("aria-expanded") !== "true") {
    trigger.focus();
    await user.keyboard("{Enter}");
  }
  const options = await screen.findAllByText(providerLabel);
  await user.click(options[options.length - 1]);
};

describe("VectorStoreForm provider fields in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the provider field labels and placeholders in Chinese", async () => {
    const user = setupUser();
    await i18n.changeLanguage("zh-CN");
    renderForm();

    await chooseProvider(user, "Milvus");

    expect(await screen.findByLabelText("API 基础 URL")).toBeInTheDocument();
    expect(screen.getByLabelText("API 密钥")).toBeInTheDocument();
    expect(screen.getByLabelText("嵌入模型")).toBeInTheDocument();
    expect(screen.queryByLabelText("Embedding Model")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("用户名:密码 或 API 密钥")).toBeInTheDocument();
  });

  it("renders a provider field tooltip in Chinese", async () => {
    const user = setupUser();
    await i18n.changeLanguage("zh-CN");
    renderForm();

    await chooseProvider(user, "Milvus");

    await screen.findByLabelText("嵌入模型");
    const hint = within(screen.getByText("嵌入模型")).getByLabelText("question-circle");

    await user.hover(hint);

    expect(await screen.findByText("选择要使用的嵌入模型")).toBeInTheDocument();
  });
});
