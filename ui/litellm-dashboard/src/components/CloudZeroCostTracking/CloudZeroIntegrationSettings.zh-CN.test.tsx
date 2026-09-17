import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { renderWithProviders } from "../../../tests/test-utils";
import { CloudZeroIntegrationSettings } from "./CloudZeroIntegrationSettings";
import { CloudZeroSettings } from "./types";

const state = vi.hoisted(() => ({ dryRunData: null as Record<string, unknown> | null }));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  __esModule: true,
  default: () => ({ accessToken: "test-token" }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroDryRun", () => ({
  useCloudZeroDryRun: () => ({ mutate: vi.fn(), isPending: false, data: state.dryRunData }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroExport", () => ({
  useCloudZeroExport: () => ({ mutate: vi.fn(), isPending: false }),
}));

const configuredSettings: CloudZeroSettings = {
  connection_id: "test-connection-id",
  api_key_masked: "cz-****",
  timezone: "UTC",
  status: null,
};

const bareSettings: CloudZeroSettings = {
  connection_id: null,
  api_key_masked: null,
  timezone: null,
  status: "Active",
};

const renderSettings = (settings: CloudZeroSettings) =>
  renderWithProviders(<CloudZeroIntegrationSettings settings={settings} onSettingsUpdated={vi.fn()} />);

describe("CloudZeroIntegrationSettings in Chinese", () => {
  beforeEach(() => {
    state.dryRunData = null;
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the card, rows and actions in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderSettings(configuredSettings);

    expect(await screen.findByText("CloudZero 配置")).toBeInTheDocument();
    expect(screen.getByText("API 密钥（已脱敏）")).toBeInTheDocument();
    expect(screen.getByText("连接 ID")).toBeInTheDocument();
    expect(screen.getByText("时区")).toBeInTheDocument();
    expect(screen.getByText("操作")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "运行试运行模拟" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "立即导出数据" })).toBeInTheDocument();
  });

  it("falls back to the Chinese active status when the settings carry none", async () => {
    await i18n.changeLanguage("zh-CN");
    renderSettings(configuredSettings);

    expect(await screen.findByText("活跃")).toBeInTheDocument();
  });

  it("renders the Chinese placeholders for missing optional settings", async () => {
    await i18n.changeLanguage("zh-CN");
    renderSettings(bareSettings);

    expect(await screen.findAllByText("未配置")).toHaveLength(2);
    expect(screen.getByText("默认 (UTC)")).toBeInTheDocument();
  });

  it("renders the export confirmation dialog in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderSettings(configuredSettings);

    await user.click(await screen.findByRole("button", { name: "立即导出数据" }));

    expect(await screen.findByText("将数据导出至 CloudZero")).toBeInTheDocument();
    expect(screen.getByText("此操作将把当前累计的成本数据推送至 CloudZero。是否继续？")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出" })).toBeInTheDocument();
  });

  it("renders the delete confirmation dialog in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderSettings(configuredSettings);

    await user.click(await screen.findByRole("button", { name: "删除" }));

    expect(await screen.findByText("删除 CloudZero 集成？")).toBeInTheDocument();
    expect(screen.getByText("确定要删除此 CloudZero 集成吗？所有相关设置和配置将被永久移除。")).toBeInTheDocument();
    expect(screen.getByText("集成详情")).toBeInTheDocument();
  });

  it("renders the dry run results in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    state.dryRunData = { records: 12 };
    renderSettings(configuredSettings);

    expect(await screen.findByText("试运行结果")).toBeInTheDocument();
    expect(screen.getByText("连接 test-connection-id 的模拟输出")).toBeInTheDocument();
  });
});
