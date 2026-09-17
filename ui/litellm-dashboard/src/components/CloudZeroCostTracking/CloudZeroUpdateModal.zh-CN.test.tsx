import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import { renderWithProviders } from "../../../tests/test-utils";
import CloudZeroUpdateModal from "./CloudZeroUpdateModal";
import { CloudZeroSettings } from "./types";

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  __esModule: true,
  default: () => ({ accessToken: "test-token" }),
}));

vi.mock("@/app/(dashboard)/hooks/cloudzero/useCloudZeroSettings", () => ({
  useCloudZeroUpdateSettings: () => ({ mutate: vi.fn(), isPending: false }),
}));

const settings: CloudZeroSettings = {
  connection_id: "test-connection-id",
  api_key_masked: "****",
  timezone: "UTC",
  status: "Active",
};

describe("CloudZeroUpdateModal in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the title, fields and buttons in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<CloudZeroUpdateModal open={true} onOk={vi.fn()} onCancel={vi.fn()} settings={settings} />);

    expect(await screen.findByText("编辑 CloudZero 集成")).toBeInTheDocument();
    expect(screen.getByLabelText("CloudZero API 密钥")).toBeInTheDocument();
    expect(screen.getByLabelText("连接 ID")).toBeInTheDocument();
    expect(screen.getByLabelText("时区")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
  });
});
