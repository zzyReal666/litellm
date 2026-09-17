import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { VectorStore } from "@/components/vector_store_management/types";

import VectorStoreTable from "./VectorStoreTable";

vi.mock("@/components/vector_store_providers", () => ({
  getVectorStoreProviderLogoAndName: (provider: string) => ({ displayName: provider, logo: "" }),
}));

const mockVectorStores: VectorStore[] = [
  {
    vector_store_id: "vs-zh",
    custom_llm_provider: "openai",
    vector_store_name: "中文向量存储",
    vector_store_description: "用于中文测试的向量存储",
    vector_store_metadata: {
      ingested_files: [
        { filename: "a.pdf", ingested_at: "2024-01-15T10:00:00Z" },
        { filename: "b.pdf", ingested_at: "2024-01-15T10:00:00Z" },
      ],
    },
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T11:00:00Z",
  },
];

const defaultProps = {
  data: mockVectorStores,
  onView: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe("VectorStoreTable in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the column headers and file count in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<VectorStoreTable {...defaultProps} />);

    for (const header of ["向量存储 ID", "名称", "描述", "文件", "提供商", "创建时间", "更新时间"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
    expect(screen.getByText("2 个文件")).toBeInTheDocument();
  });

  it("renders the empty state in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<VectorStoreTable {...defaultProps} data={[]} />);

    expect(screen.getByText("暂无向量存储")).toBeInTheDocument();
    expect(screen.getByText("连接向量存储即可启用检索增强生成。")).toBeInTheDocument();
  });
});
