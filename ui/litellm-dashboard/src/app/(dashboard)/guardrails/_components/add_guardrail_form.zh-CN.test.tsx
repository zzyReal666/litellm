import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import {
  getGuardrailProviderSpecificParams,
  getGuardrailUISettings,
  modelAvailableCall,
  modelHubCall,
} from "@/components/networking";
import AddGuardrailForm from "./add_guardrail_form";

vi.mock("@/components/networking", () => ({
  createGuardrailCall: vi.fn(),
  getGuardrailProviderSpecificParams: vi.fn(),
  getGuardrailUISettings: vi.fn(),
  modelAvailableCall: vi.fn(),
  modelHubCall: vi.fn(),
}));

const HEADROOM_PARAMS = {
  headroom: {
    optional_params: { description: "Optional parameters for the guardrail", required: false, type: "string" },
    api_base: {
      description:
        "Base URL for the headroom compression service (e.g. https://api.headroom.ai). Falls back to HEADROOM_API_BASE env var.",
      required: false,
      type: "string",
    },
    api_key: {
      description: "API key for the headroom compression service. Falls back to HEADROOM_API_KEY env var.",
      required: false,
      type: "string",
    },
    model: {
      description: "Model name forwarded to the headroom /v1/compress endpoint.",
      required: false,
      type: "string",
    },
    unreachable_fallback: {
      description:
        "Behavior when the headroom compression service is unreachable or errors. 'fail_closed' raises an error (default). 'fail_open' logs a critical error and forwards the request uncompressed instead of blocking it.",
      required: false,
      type: "select",
      options: ["fail_closed", "fail_open"],
      default_value: "fail_closed",
    },
    ccr_retrieval: {
      description: "Inject the Headroom retrieval tool for hashes declared by the compression service.",
      required: false,
      type: "boolean",
      default_value: true,
    },
    ui_friendly_name: "Headroom",
  },
};

const UI_SETTINGS = {
  supported_entities: [],
  supported_actions: ["MASK", "BLOCK"],
  supported_modes: ["pre_call", "during_call", "post_call", "logging_only"],
  pii_entity_categories: [],
};

const HEADROOM_PRESET = {
  provider: "Headroom",
  guardrailNameSuggestion: "zzz-headroom",
  mode: ["pre_call"],
  defaultOn: false,
};

const renderForm = (preset?: {
  provider: string;
  guardrailNameSuggestion: string;
  mode: string | string[];
  defaultOn: boolean;
}) =>
  renderWithProviders(
    <AddGuardrailForm visible={true} onClose={vi.fn()} accessToken="test-token" onSuccess={vi.fn()} preset={preset} />,
  );

describe("AddGuardrailForm zh-CN", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getGuardrailUISettings).mockResolvedValue(UI_SETTINGS);
    vi.mocked(getGuardrailProviderSpecificParams).mockResolvedValue({});
    vi.mocked(modelAvailableCall).mockResolvedValue({ data: [] });
    vi.mocked(modelHubCall).mockResolvedValue({ data: [] });
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the dialog title, step labels and footer buttons in Chinese", () => {
    renderForm();

    expect(screen.getByText("创建护栏")).toBeInTheDocument();
    expect(screen.getByText("基本信息")).toBeInTheDocument();
    expect(screen.getByText("提供商配置")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步" })).toBeInTheDocument();
    expect(screen.queryByText("Create guardrail")).not.toBeInTheDocument();
  });

  it("renders the basic info labels and the skip-message switches in Chinese", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByLabelText("护栏名称")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("为此护栏输入名称")).toBeInTheDocument();
    expect(screen.getByText("护栏提供商")).toBeInTheDocument();
    expect(screen.getByText("模式")).toBeInTheDocument();
    expect(screen.getByText("始终启用")).toBeInTheDocument();
    expect(screen.getByText("在护栏中跳过系统消息")).toBeInTheDocument();
    expect(screen.getByText("在护栏中跳过工具消息")).toBeInTheDocument();

    await user.click(screen.getByLabelText("始终启用"));
    expect(await screen.findByRole("option", { name: "是" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "否" })).toBeInTheDocument();
  });

  it("shows readable Chinese labels for mode and stream scope instead of raw API values", () => {
    renderForm();

    expect(screen.getByText("调用前")).toBeInTheDocument();
    expect(screen.getByText("调用前 适用于")).toBeInTheDocument();
    expect(screen.getByText("流式与非流式")).toBeInTheDocument();
    expect(screen.queryByText("pre_call")).not.toBeInTheDocument();
    expect(screen.queryByText("both")).not.toBeInTheDocument();
  });

  it("renders the always-on tri-state select as 是/否 instead of True/False", () => {
    renderForm();

    expect(screen.getByLabelText("始终启用")).toHaveTextContent("否");
    expect(screen.queryByText("No")).not.toBeInTheDocument();
    expect(screen.queryByText("True")).not.toBeInTheDocument();
  });

  it("renders the provider combobox placeholder and its empty state in Chinese", () => {
    renderForm();

    fireEvent.mouseDown(screen.getByLabelText("护栏提供商"));
    const input = screen.getByPlaceholderText("选择护栏提供商");
    fireEvent.change(input, { target: { value: "zzz-no-such-provider" } });

    expect(screen.getByText("没有匹配的提供商")).toBeInTheDocument();
  });

  it("localizes provider-specific parameter labels, descriptions, options and booleans", async () => {
    const user = userEvent.setup();
    vi.mocked(getGuardrailProviderSpecificParams).mockResolvedValue(HEADROOM_PARAMS);
    renderForm(HEADROOM_PRESET);

    expect(await screen.findByText("不可达回退策略")).toBeInTheDocument();
    expect(screen.getByText("API 基础地址")).toBeInTheDocument();
    expect(screen.getByText("API 密钥")).toBeInTheDocument();
    expect(screen.getByText("CCR 检索")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Headroom 压缩服务的基础 URL/)).toBeInTheDocument();

    expect(screen.getByLabelText("不可达回退策略")).toHaveTextContent("拦截（报错）");
    expect(screen.getByLabelText("CCR 检索")).toHaveTextContent("是");
    expect(screen.queryByText("fail_closed")).not.toBeInTheDocument();
    expect(screen.queryByText("True")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("不可达回退策略"));
    expect(await screen.findByRole("option", { name: "放行（不压缩）" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "拦截（报错）" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "fail_open" })).not.toBeInTheDocument();
  });
});
