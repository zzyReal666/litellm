import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import { SearchToolView } from "./SearchToolView";
import { AvailableSearchProvider, SearchTool } from "./types";

vi.mock("@/utils/dataUtils", () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

vi.mock("./SearchToolTester", () => ({
  SearchToolTester: () => <div data-testid="search-tool-tester" />,
}));

const searchTool: SearchTool = {
  search_tool_id: "test-tool-id-123",
  search_tool_name: "Test Search Tool",
  litellm_params: {
    search_provider: "perplexity",
    api_key: "sk-test-key",
  },
  search_tool_info: {
    description: "Test description",
  },
  created_at: "2024-01-15T10:30:00Z",
};

const availableProviders: AvailableSearchProvider[] = [
  { provider_name: "perplexity", ui_friendly_name: "Perplexity AI" },
];

const renderView = (tool: SearchTool = searchTool) =>
  render(
    <SearchToolView
      searchTool={tool}
      onBack={vi.fn()}
      isEditing={false}
      accessToken="test-token"
      availableProviders={availableProviders}
    />,
  );

describe("SearchToolView in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the search tool summary fields in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderView();

    expect(screen.getByText("返回所有搜索工具")).toBeInTheDocument();
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.getByText("API 密钥")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.getByText("描述")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制搜索工具名称" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制搜索工具 ID" })).toBeInTheDocument();
  });

  it("renders the missing API key state in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderView({ ...searchTool, litellm_params: { search_provider: "perplexity", api_key: undefined } });

    expect(screen.getByText("未设置")).toBeInTheDocument();
  });
});
