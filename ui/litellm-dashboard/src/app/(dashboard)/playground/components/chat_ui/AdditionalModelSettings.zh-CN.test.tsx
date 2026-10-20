import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import AdditionalModelSettings from "./AdditionalModelSettings";

describe("AdditionalModelSettings zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("should render the model settings sidebar in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    render(<AdditionalModelSettings onMockTestFallbacksChange={vi.fn()} />);

    expect(screen.getByText("最大 Token 数")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "使用高级参数" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "模拟失败以测试回退" })).toBeInTheDocument();
  });

  it("should render the streaming toggle and its help label in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    render(<AdditionalModelSettings onStreamingChange={vi.fn()} onMockTestFallbacksChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "流式响应" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "帮助：模拟失败以测试回退" })).toBeInTheDocument();
  });

  it("should render the model settings sidebar in English by default", async () => {
    render(<AdditionalModelSettings onMockTestFallbacksChange={vi.fn()} />);

    expect(screen.getByText("Temperature")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Use Advanced Parameters" })).toBeInTheDocument();
  });
});
