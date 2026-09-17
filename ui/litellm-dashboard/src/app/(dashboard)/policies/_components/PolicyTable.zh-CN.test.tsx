import React from "react";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/../tests/test-utils";
import i18n from "@/lib/i18n";
import PolicyTable from "./PolicyTable";
import { Policy } from "@/components/policies/types";

const makePolicy = (overrides: Partial<Policy> = {}): Policy => ({
  policy_id: "policy-id-1",
  policy_name: "test-policy",
  inherit: null,
  description: null,
  guardrails_add: [],
  guardrails_remove: [],
  condition: null,
  ...overrides,
});

const defaultProps = {
  policies: [],
  isLoading: false,
  onDeleteClick: vi.fn(),
  onEditClick: vi.fn(),
  onViewClick: vi.fn(),
  isAdmin: true,
};

describe("PolicyTable in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the empty policy list in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<PolicyTable {...defaultProps} />);

    expect(screen.getByText("未找到策略")).toBeInTheDocument();
    expect(screen.getByText("护栏（添加）")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
  });

  it("renders the policy row actions in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderWithProviders(<PolicyTable {...defaultProps} policies={[makePolicy()]} />);

    await user.click(screen.getByTestId("policy-actions-policy-id-1"));

    expect(await screen.findByText("编辑策略")).toBeInTheDocument();
    expect(screen.getByText("删除策略")).toBeInTheDocument();
  });

  it("labels a policy with several versions in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(
      <PolicyTable
        {...defaultProps}
        policies={[
          makePolicy({ policy_id: "id-1", version_number: 1 }),
          makePolicy({ policy_id: "id-2", version_number: 2 }),
        ]}
      />,
    );

    expect(screen.getByText("2 个版本")).toBeInTheDocument();
  });

  it("falls back to the Chinese placeholder name for a policy without a name", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<PolicyTable {...defaultProps} policies={[makePolicy({ policy_name: "" })]} />);

    expect(screen.getByRole("button", { name: "未命名策略" })).toBeInTheDocument();
    expect(screen.queryByText("__unnamed__")).not.toBeInTheDocument();
  });
});
