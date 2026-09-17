import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/lib/i18n";
import ToolPermissionRulesEditor, { type ToolPermissionConfig } from "./ToolPermissionRulesEditor";

const configWithRule: ToolPermissionConfig = {
  rules: [{ id: "allow_bash", tool_name: "Bash", decision: "allow" }],
  default_action: "deny",
  on_disallowed_action: "block",
  violation_message_template: "",
};

const StatefulEditor = ({ initial }: { initial: ToolPermissionConfig }) => {
  const [config, setConfig] = useState(initial);
  return <ToolPermissionRulesEditor value={config} onChange={setConfig} />;
};

describe("ToolPermissionRulesEditor in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the guardrail header and rule field labels in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<StatefulEditor initial={configWithRule} />);

    expect(screen.getByText("LiteLLM 工具权限护栏")).toBeInTheDocument();
    expect(
      screen.getByText("为工具名称或类型提供正则表达式模式（例如 ^mcp__github_.*$），并可选择性地约束载荷字段。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加规则" })).toBeInTheDocument();
    expect(screen.getByText("规则 1")).toBeInTheDocument();
    expect(screen.getByText("规则 ID")).toBeInTheDocument();
    expect(screen.getByText("工具名称（可选）")).toBeInTheDocument();
    expect(screen.getByText("工具类型（可选）")).toBeInTheDocument();
    expect(screen.getByText("决策")).toBeInTheDocument();
    expect(screen.getByText("默认动作")).toBeInTheDocument();
    expect(screen.getByText("禁止时的处理")).toBeInTheDocument();
    expect(screen.getByText("违规消息（可选）")).toBeInTheDocument();
  });

  it("translates the allow, deny, block and rewrite options", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<StatefulEditor initial={configWithRule} />);

    expect(screen.getByText("允许")).toBeInTheDocument();
    expect(screen.getByText("拒绝")).toBeInTheDocument();
    expect(screen.getByText("拦截")).toBeInTheDocument();
  });

  it("keeps the regex and tool name values untranslated", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<StatefulEditor initial={configWithRule} />);

    expect(screen.getByDisplayValue("Bash")).toBeInTheDocument();
    expect(screen.getByDisplayValue("allow_bash")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("^mcp__github_.*$")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("^function$")).toBeInTheDocument();
  });

  it("renders the empty state in Chinese and numbers a new rule in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<StatefulEditor initial={{ ...configWithRule, rules: [] }} />);

    expect(screen.getByText("尚未添加工具规则")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "添加规则" }));

    expect(screen.getByText("规则 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ 限制工具参数（可选）" })).toBeInTheDocument();
  });
});
