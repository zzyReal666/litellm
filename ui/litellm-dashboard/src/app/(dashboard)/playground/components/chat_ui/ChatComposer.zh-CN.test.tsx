import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import { ChatComposer, CodeInterpreterToggle } from "./ChatComposer";

describe("ChatComposer zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("should label the send button and the code interpreter toggle in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    render(
      <ChatComposer
        value="hello"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        placeholder="Type your message..."
        tools={<CodeInterpreterToggle enabled={false} onToggle={vi.fn()} />}
      />,
    );

    expect(screen.getByRole("button", { name: "发送消息" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "启用代码解释器" })).toBeInTheDocument();
  });

  it("should label the stop button in Chinese while a request is in flight", async () => {
    await i18n.changeLanguage("zh-CN");

    render(
      <ChatComposer
        value="hello"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isLoading
        placeholder="Type your message..."
      />,
    );

    expect(screen.getByRole("button", { name: "停止请求" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "发送消息" })).not.toBeInTheDocument();
  });

  it("should label the enabled code interpreter toggle in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    render(<CodeInterpreterToggle enabled onToggle={vi.fn()} />);

    expect(screen.getByRole("button", { name: "代码解释器已启用（点击可禁用）" })).toBeInTheDocument();
  });

  it("should fall back to the English labels in en", async () => {
    render(
      <ChatComposer
        value="hello"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        placeholder="Type your message..."
        tools={<CodeInterpreterToggle enabled={false} onToggle={vi.fn()} />}
      />,
    );

    expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable Code Interpreter" })).toBeInTheDocument();
  });
});
