import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import type { PiiEntityCategory } from "@/components/guardrails/types";
import PiiConfiguration from "./pii_configuration";

const entityCategories: PiiEntityCategory[] = [
  { category: "Financial", entities: ["CREDIT_CARD"] },
  { category: "Contact", entities: ["EMAIL"] },
];

const baseProps = {
  actions: ["MASK", "BLOCK"],
  selectedActions: {},
  onEntitySelect: vi.fn(),
  onActionSelect: vi.fn(),
  entityCategories,
};

describe("PiiConfiguration in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the protection header and the PII type table in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <PiiConfiguration
        {...baseProps}
        entities={["CREDIT_CARD", "EMAIL"]}
        selectedEntities={["CREDIT_CARD"]}
        selectedActions={{ CREDIT_CARD: "MASK" }}
      />,
    );

    expect(screen.getByText("配置 PII 保护")).toBeInTheDocument();
    expect(screen.getByText("按类别筛选")).toBeInTheDocument();
    expect(screen.getByText("快速操作")).toBeInTheDocument();
    expect(screen.getByText("PII 类型")).toBeInTheDocument();
    expect(screen.getByText("操作", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消全选" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全选并脱敏" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全选并拦截" })).toBeInTheDocument();
  });

  it("keeps entity identifiers untranslated and counts the selection in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(
      <PiiConfiguration
        {...baseProps}
        entities={["CREDIT_CARD", "EMAIL"]}
        selectedEntities={["CREDIT_CARD", "EMAIL"]}
        selectedActions={{ CREDIT_CARD: "MASK", EMAIL: "BLOCK" }}
      />,
    );

    expect(screen.getByText("CREDIT CARD")).toBeInTheDocument();
    expect(screen.getByText("EMAIL")).toBeInTheDocument();
    expect(screen.getByText("已选择 2 项")).toBeInTheDocument();
  });

  it("uses the singular selection wording for a single entity", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<PiiConfiguration {...baseProps} entities={["CREDIT_CARD"]} selectedEntities={["CREDIT_CARD"]} />);

    expect(screen.getByText("已选择 1 项")).toBeInTheDocument();
  });

  it("renders the empty state in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<PiiConfiguration {...baseProps} entities={[]} selectedEntities={[]} />);

    expect(screen.getByText("没有 PII 类型匹配您的筛选条件")).toBeInTheDocument();
    expect(screen.getByText("已选择 0 项")).toBeInTheDocument();
  });
});
