import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import AddGuardrailForm from "./add_guardrail_form";

vi.mock("@/components/networking", () => ({
  createGuardrailCall: vi.fn(),
  getGuardrailProviderSpecificParams: vi.fn().mockResolvedValue({}),
  getGuardrailUISettings: vi.fn().mockResolvedValue({}),
  modelAvailableCall: vi.fn().mockResolvedValue({ data: [] }),
}));

const renderForm = () =>
  renderWithProviders(<AddGuardrailForm visible={true} onClose={vi.fn()} accessToken={null} onSuccess={vi.fn()} />);

describe("AddGuardrailForm zh-CN", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the dialog title, step labels and footer buttons in Chinese", () => {
    renderForm();

    expect(screen.getByText("创建护栏")).toBeInTheDocument();
    expect(screen.getByText("基本信息")).toBeInTheDocument();
    expect(screen.getByText("提供商配置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
    expect(screen.queryByText("Create guardrail")).not.toBeInTheDocument();
  });

  it("renders the basic info labels and the skip-message switches in Chinese", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByLabelText("护栏名称")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("为此护栏输入名称")).toBeInTheDocument();
    expect(screen.getByText("护栏提供商")).toBeInTheDocument();
    expect(screen.getByText("模式")).toBeInTheDocument();
    expect(screen.getByText("始终启用")).toBeInTheDocument();
    expect(screen.getByText("在护栏中跳过系统消息")).toBeInTheDocument();
    expect(screen.getByText("在护栏中跳过工具消息")).toBeInTheDocument();

    await user.click(screen.getByLabelText("始终启用"));
    expect(await screen.findByRole("option", { name: "是" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "否" })).toBeInTheDocument();
  });

  it("renders the provider combobox placeholder and its empty state in Chinese", () => {
    renderForm();

    fireEvent.mouseDown(screen.getByLabelText("护栏提供商"));
    const input = screen.getByPlaceholderText("选择护栏提供商");
    fireEvent.change(input, { target: { value: "zzz-no-such-provider" } });

    expect(screen.getByText("没有匹配的提供商")).toBeInTheDocument();
  });
});
