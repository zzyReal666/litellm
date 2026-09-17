import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import TagTable from "./TagTable";

const defaultProps = {
  data: [],
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onSelectTag: vi.fn(),
};

describe("TagTable Chinese copy", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders the empty state and the table chrome in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<TagTable {...defaultProps} />);

    expect(screen.getByText("暂无标签")).toBeInTheDocument();
    expect(screen.getByText("创建标签即可开始路由并限制模型用量。")).toBeInTheDocument();
    expect(screen.getByText("标签名称")).toBeInTheDocument();
    expect(screen.getByText("允许的模型")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.queryByText("No tags yet")).not.toBeInTheDocument();
  });

  it("renders the loading message in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<TagTable {...defaultProps} isLoading />);

    expect(screen.getByText("正在加载标签…")).toBeInTheDocument();
  });
});
