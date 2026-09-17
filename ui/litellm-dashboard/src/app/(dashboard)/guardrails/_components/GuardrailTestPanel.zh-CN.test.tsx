import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "@/lib/i18n";
import { GuardrailTestPanel } from "./GuardrailTestPanel";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const renderPanel = (guardrailNames: string[]) =>
  render(
    <GuardrailTestPanel
      guardrailNames={guardrailNames}
      onSubmit={vi.fn()}
      isLoading={false}
      results={null}
      errors={null}
      onClose={vi.fn()}
    />,
  );

const keyboardHint = (expected: string) =>
  screen.getByText((_content, element) => element?.textContent?.trim() === expected);

describe("GuardrailTestPanel zh-CN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the panel labels and counts in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    renderPanel(["test-guardrail-1", "test-guardrail-2"]);

    expect(screen.getByRole("heading", { name: "测试护栏：" })).toBeInTheDocument();
    expect(screen.getByText("输入文本")).toBeInTheDocument();
    expect(screen.getByText("元数据（可选）")).toBeInTheDocument();
    expect(screen.getByText("字符数：0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试 2 个护栏" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入要用护栏测试的文本...")).toBeInTheDocument();
  });

  it("renders the singular Chinese button label for a single guardrail", async () => {
    await i18n.changeLanguage("zh-CN");

    renderPanel(["only-guardrail"]);

    expect(screen.getByRole("button", { name: "测试 1 个护栏" })).toBeInTheDocument();
    expect(screen.getByText("测试护栏并比较结果")).toBeInTheDocument();
  });

  it("keeps the keyboard hint shortcut keys and updates the character count in Chinese", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh-CN");

    renderPanel(["test-guardrail-1"]);

    const textarea = screen.getByPlaceholderText("输入要用护栏测试的文本...");
    await user.type(textarea, "abc");

    expect(screen.getByText("字符数：3")).toBeInTheDocument();
    expect(screen.getByText("Enter", { selector: "kbd" })).toBeInTheDocument();
    expect(screen.getByText("Shift+Enter", { selector: "kbd" })).toBeInTheDocument();
    expect(screen.getByText(/提交/)).toBeInTheDocument();
  });

  it("renders the copy button and the invalid JSON error in Chinese", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("zh-CN");

    renderPanel(["test-guardrail-1"]);

    await user.type(screen.getByPlaceholderText("输入要用护栏测试的文本..."), "hello");
    expect(screen.getByRole("button", { name: "复制输入" })).toBeInTheDocument();

    const metadataField = screen.getByPlaceholderText('{"forbidden_topics": ["tax", "finance"]}');
    await user.click(metadataField);
    await user.paste("{not json");
    await user.click(screen.getByRole("button", { name: "测试 1 个护栏" }));

    expect(await screen.findByText("JSON 格式无效")).toBeInTheDocument();
  });

  it("keeps the English copy of every prompt on the default language", async () => {
    const user = userEvent.setup();

    renderPanel(["test-guardrail-1"]);

    expect(screen.getByRole("heading", { name: "Test Guardrails:" })).toBeInTheDocument();
    expect(screen.getByText("Input Text")).toBeInTheDocument();
    expect(screen.getByText("Metadata (optional)")).toBeInTheDocument();
    expect(screen.getByText("Characters: 0")).toBeInTheDocument();
    expect(screen.getByText("Test guardrail and compare results")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Test 1 guardrail" })).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText("Enter text to test with guardrails...");
    await user.type(textarea, "abc");
    expect(screen.getByText("Characters: 3")).toBeInTheDocument();
    expect(keyboardHint("Press Enter to submit • Shift+Enter for new line")).toBeInTheDocument();
  });
});
