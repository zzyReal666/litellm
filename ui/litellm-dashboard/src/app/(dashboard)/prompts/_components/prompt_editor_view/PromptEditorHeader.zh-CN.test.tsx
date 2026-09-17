import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import PromptEditorHeader from "./PromptEditorHeader";

vi.mock("./PromptCodeSnippets", () => ({
  default: () => <button>Get Code</button>,
}));

describe("PromptEditorHeader in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the prompt editor header in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <PromptEditorHeader
        promptName="welcome"
        onNameChange={vi.fn()}
        onBack={vi.fn()}
        onSave={vi.fn()}
        isSaving={false}
        accessToken="token"
        environment="development"
        onEnvironmentChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "返回" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
    expect(screen.getByText("草稿")).toBeInTheDocument();
    expect(screen.getByText("有未保存的更改")).toBeInTheDocument();
    expect(screen.getByText("开发")).toBeInTheDocument();
  });
});
