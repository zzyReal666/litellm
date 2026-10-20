import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { Plugin } from "@/components/claude_code_plugins/types";

import PluginTable from "./PluginTable";

const mockPlugins: Plugin[] = [
  {
    id: "plugin-id-newer",
    name: "newer-skill",
    version: "1.2.0",
    description: "A skill for testing",
    source: { source: "github", repo: "org/newer-skill" },
    category: "development",
    enabled: true,
    created_at: "2025-01-15T10:30:00Z",
  },
  {
    id: "plugin-id-older",
    name: "older-skill",
    source: { source: "github", repo: "org/older-skill" },
    enabled: false,
    created_at: "2024-01-10T09:15:00Z",
  },
];

const defaultProps = {
  pluginsList: mockPlugins,
  isLoading: false,
  onDeleteClick: vi.fn(),
  isAdmin: true,
  onPluginClick: vi.fn(),
};

describe("PluginTable in zh-CN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<PluginTable {...defaultProps} />);

    for (const header of ["技能名称", "版本", "描述", "分类", "是否公开", "创建时间"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
    expect(screen.getByText("未分类")).toBeInTheDocument();
    expect(screen.getByText("暂无描述")).toBeInTheDocument();
  });

  it("renders the public flag and empty state in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<PluginTable {...defaultProps} pluginsList={[]} />);

    expect(screen.getByText("未找到技能")).toBeInTheDocument();
    expect(screen.getByText("添加一个技能即可开始使用。")).toBeInTheDocument();

    cleanup();
    render(<PluginTable {...defaultProps} />);
    expect(screen.getByText("是")).toBeInTheDocument();
    expect(screen.getByText("否")).toBeInTheDocument();
  });
});
