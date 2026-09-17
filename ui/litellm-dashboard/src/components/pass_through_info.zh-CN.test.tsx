import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import PassThroughInfoView from "./pass_through_info";

vi.mock("./networking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./networking")>()),
  updatePassThroughEndpoint: vi.fn(),
  deletePassThroughEndpointsCall: vi.fn().mockResolvedValue({}),
  getGuardrailsList: vi.fn().mockResolvedValue({ guardrails: [] }),
  getProxyBaseUrl: vi.fn().mockReturnValue("http://localhost:4000"),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn(), error: vi.fn() },
}));

const endpoint = {
  id: "ep-1",
  path: "/bria",
  target: "https://engine.prod.bria-api.com",
  headers: { Authorization: "Bearer abc" },
  include_subpath: true,
  cost_per_request: 2,
  timeout: 600,
  auth: false,
  methods: ["GET"],
};

const renderView = (isAdmin: boolean, data = endpoint) =>
  render(
    <PassThroughInfoView
      endpointData={data}
      onClose={vi.fn()}
      accessToken="test-token"
      isAdmin={isAdmin}
      premiumUser
    />,
  );

describe("pass_through_info in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the overview panel in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderView(false);

    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.getByText("← 返回")).toBeInTheDocument();
    expect(screen.getByText("透传端点：/bria")).toBeInTheDocument();
    expect(screen.getByText("路径")).toBeInTheDocument();
    expect(screen.getByText("目标")).toBeInTheDocument();
    expect(screen.getByText("配置")).toBeInTheDocument();
    expect(screen.getByText("包含子路径")).toBeInTheDocument();
    expect(screen.getByText("无需认证")).toBeInTheDocument();
    expect(screen.getByText("HTTP 方法：")).toBeInTheDocument();
    expect(screen.getByText("每次请求费用：$2")).toBeInTheDocument();
    expect(screen.getByText("请求头")).toBeInTheDocument();
    expect(screen.getByText("已配置 1 个请求头")).toBeInTheDocument();
  });

  it("renders the admin settings panel in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();
    renderView(true);

    await user.click(screen.getByRole("tab", { name: "设置" }));

    expect(screen.getByText("透传端点设置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除端点" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑设置" }));

    expect(await screen.findByLabelText("目标 URL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存更改" })).toBeInTheDocument();
    expect(screen.getByLabelText("请求超时（秒）")).toBeInTheDocument();
  });
});
