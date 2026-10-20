import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import { ClassifyTag } from "./LogDetailsDrawer/ClassifyTag";
import { OutputCard } from "./LogDetailsDrawer/OutputCard";
import { SectionHeader } from "./LogDetailsDrawer/SectionHeader";
import { VectorStoreViewer } from "./VectorStoreViewer";

vi.mock("../provider_info_helpers", () => ({
  getProviderLogoAndName: vi.fn(() => ({ logo: null, displayName: "Test Provider" })),
}));

describe("view_logs Chinese rendering", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the vector store viewer labels in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <VectorStoreViewer
        data={[
          {
            query: "refund policy",
            start_time: 1_700_000_000,
            end_time: 1_700_000_001,
            vector_store_id: "vs-1",
            custom_llm_provider: "openai",
            vector_store_search_response: {
              search_query: "refund policy",
              data: [{ score: 0.9123, content: [{ type: "text", text: "Refunds take 5 days" }] }],
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("向量存储请求")).toBeInTheDocument();
    expect(screen.getByText("查询：")).toBeInTheDocument();
    expect(screen.getByText("向量存储 ID：")).toBeInTheDocument();
    expect(screen.getByText("提供商：")).toBeInTheDocument();
    expect(screen.getByText("开始时间：")).toBeInTheDocument();
    expect(screen.getByText("结束时间：")).toBeInTheDocument();
    expect(screen.getByText("耗时：")).toBeInTheDocument();
    expect(screen.getByText("搜索结果")).toBeInTheDocument();
    expect(screen.getByText("结果 1")).toBeInTheDocument();
    expect(screen.getByText("得分：")).toBeInTheDocument();
    expect(screen.queryByText("Vector Store Requests")).not.toBeInTheDocument();
  });

  it("renders the input/output section header in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<SectionHeader type="input" tokens={1200} cost={0.5} onCopy={vi.fn()} turnCount={2} />);

    expect(screen.getByText("输入")).toBeInTheDocument();
    expect(screen.getByText("Token：1,200")).toBeInTheDocument();
    expect(screen.getByText("费用：$0.500000")).toBeInTheDocument();
    expect(screen.getByText("轮次：2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制输入" })).toBeInTheDocument();
  });

  it("renders the output card empty state in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<OutputCard message={null} />);

    expect(screen.getByText("输出")).toBeInTheDocument();
    expect(screen.getByText("暂无响应数据")).toBeInTheDocument();
  });

  it("renders the classify tag in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<ClassifyTag origin="autorouter_classifier" />);

    expect(screen.getByText("分类")).toBeInTheDocument();
    expect(screen.getByTitle("自动路由发起的档位分类调用，并非调用方发送的请求")).toBeInTheDocument();
  });
});
