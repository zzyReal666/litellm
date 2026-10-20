import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../../tests/test-utils";
import i18n from "@/lib/i18n";
import { KeyResponse } from "@/components/key_team_helpers/key_list";

import { ProjectKeysTable } from "./ProjectKeysTable";

vi.mock("@/components/common_components/DefaultProxyAdminTag", () => ({
  default: ({ userId }: { userId: string }) => <span data-testid="owner-tag">{userId}</span>,
}));

vi.mock("next/navigation", async () => ({
  ...(await vi.importActual("next/navigation")),
  useRouter: () => ({ push: vi.fn() }),
}));

const defaultProps = {
  totalCount: 0,
  isLoading: false,
  pagination: { pageIndex: 0, pageSize: 5 },
  onPaginationChange: vi.fn(),
};

const makeKey = (overrides: Partial<KeyResponse> = {}): KeyResponse =>
  ({
    token: "tok-abc123",
    key_alias: "Test Key",
    key_name: "sk-...abc",
    user_id: "owner-1",
    created_at: "2024-03-01T00:00:00Z",
    last_active: null,
    ...overrides,
  }) as unknown as KeyResponse;

describe("ProjectKeysTable in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the empty state and the column headers in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<ProjectKeysTable {...defaultProps} keys={[]} />);

    expect(screen.getByText("未找到密钥")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "密钥名称" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "所有者" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "创建时间" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "最后活跃" })).toBeInTheDocument();
  });

  it("renders the Last Active fallback in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<ProjectKeysTable {...defaultProps} keys={[makeKey()]} />);

    expect(screen.getByText("从未")).toBeInTheDocument();
  });

  it("renders the loading message in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<ProjectKeysTable {...defaultProps} keys={[]} isLoading />);

    expect(screen.getByText("正在加载密钥…")).toBeInTheDocument();
    expect(screen.queryByText("Loading keys…")).not.toBeInTheDocument();
  });
});
