import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import PaginationStatusAlerts from "./PaginationStatusAlerts";

describe("PaginationStatusAlerts Chinese copy", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("names the default subject and the Stop button in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const { container } = render(
      <PaginationStatusAlerts
        isFetchingMore
        cancelled={false}
        progress={{ currentPage: 7, totalPages: 42 }}
        cancel={vi.fn()}
      />,
    );

    expect(screen.getByText(/正在抓取花费数据：已抓取 7 \/ 42 页/)).toBeInTheDocument();
    expect(screen.getByText(/图表会定期更新/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /在新标签页中打开/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "停止" })).toBeInTheDocument();
    expect(container.textContent).not.toContain("Currently fetching");
    expect(container.textContent).not.toContain("spend data");
  });

  it("renders the partial-data notice in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <PaginationStatusAlerts
        isFetchingMore={false}
        cancelled
        progress={{ currentPage: 7, totalPages: 42 }}
        cancel={vi.fn()}
      />,
    );

    expect(screen.getByText("显示部分花费数据（已加载 7/42 页）")).toBeInTheDocument();
  });

  it("keeps a caller-supplied subject as it is", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <PaginationStatusAlerts
        isFetchingMore
        cancelled={false}
        progress={{ currentPage: 1, totalPages: 3 }}
        cancel={vi.fn()}
        subject="agent data"
      />,
    );

    expect(screen.getByText(/正在抓取agent data：已抓取 1 \/ 3 页/)).toBeInTheDocument();
  });
});
