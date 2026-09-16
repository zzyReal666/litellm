import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { DataTablePagination } from "./DataTablePagination";

const baseProps = {
  page: 0,
  pageSize: 25,
  rowCount: 100,
  onPageChange: () => {},
  onPageSizeChange: () => {},
};

describe("DataTablePagination", () => {
  it("renders the current range from plain props", () => {
    render(<DataTablePagination {...baseProps} />);
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 1-25 of 100");
  });

  it("computes the range for a middle page and clamps the end to rowCount", () => {
    render(<DataTablePagination {...baseProps} page={3} pageSize={30} rowCount={100} />);
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("Showing 91-100 of 100");
  });

  it("disables the previous controls on the first page", () => {
    render(<DataTablePagination {...baseProps} page={0} />);
    expect(screen.getByTestId("pagination-first")).toBeDisabled();
    expect(screen.getByTestId("pagination-prev")).toBeDisabled();
    expect(screen.getByTestId("pagination-next")).toBeEnabled();
  });

  it("disables the next controls on the last page", () => {
    render(<DataTablePagination {...baseProps} page={3} pageSize={25} rowCount={100} />);
    expect(screen.getByTestId("pagination-next")).toBeDisabled();
    expect(screen.getByTestId("pagination-last")).toBeDisabled();
    expect(screen.getByTestId("pagination-prev")).toBeEnabled();
  });

  it("advances by one page when next is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<DataTablePagination {...baseProps} page={1} onPageChange={onPageChange} />);
    await user.click(screen.getByTestId("pagination-next"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("jumps to the last page index when last is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<DataTablePagination {...baseProps} page={0} pageSize={25} rowCount={100} onPageChange={onPageChange} />);
    await user.click(screen.getByTestId("pagination-last"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("shows an empty state and disables all navigation when there are no rows", () => {
    render(<DataTablePagination {...baseProps} rowCount={0} />);
    expect(screen.getByTestId("pagination-range")).toHaveTextContent("No results");
    expect(screen.getByTestId("pagination-next")).toBeDisabled();
    expect(screen.getByTestId("pagination-prev")).toBeDisabled();
  });

  it("disables navigation while loading", () => {
    render(<DataTablePagination {...baseProps} page={1} isLoading />);
    expect(screen.getByTestId("pagination-next")).toBeDisabled();
    expect(screen.getByTestId("pagination-prev")).toBeDisabled();
  });

  describe("localisation", () => {
    afterEach(async () => {
      await i18n.changeLanguage("en");
    });

    it("renders the pagination chrome in the active language", async () => {
      await i18n.changeLanguage("zh-CN");
      render(<DataTablePagination {...baseProps} page={1} />);

      expect(screen.getByText("每页行数")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-range")).toHaveTextContent("显示第 26-50 条，共 100 条");
      expect(screen.getByTestId("pagination-page")).toHaveTextContent("第 2 页，共 4 页");
      expect(screen.getByRole("button", { name: "下一页" })).toBeInTheDocument();
    });

    it("translates the empty state of the range", async () => {
      await i18n.changeLanguage("zh-CN");
      render(<DataTablePagination {...baseProps} rowCount={0} />);

      expect(screen.getByTestId("pagination-range")).toHaveTextContent("无结果");
    });
  });
});
