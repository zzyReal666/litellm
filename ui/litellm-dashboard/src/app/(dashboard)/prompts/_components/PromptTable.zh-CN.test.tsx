import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import PromptTable from "./PromptTable";

vi.mock("@/components/networking", () => ({
  modelHubCall: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const defaultProps = {
  promptsList: [],
  isLoading: false,
  onPromptClick: vi.fn(),
  onDeleteClick: vi.fn(),
  accessToken: null,
  isAdmin: true,
};

describe("PromptTable in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the prompt table in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<PromptTable {...defaultProps} />);

    for (const header of ["提示词 ID", "模型", "创建时间", "更新时间", "环境", "创建者", "类型"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });
});
