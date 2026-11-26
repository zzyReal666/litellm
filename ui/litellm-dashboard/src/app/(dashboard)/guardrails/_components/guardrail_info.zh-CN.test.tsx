import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import { cleanup, renderWithProviders } from "@/../tests/test-utils";
import { getGuardrailInfo, getGuardrailProviderSpecificParams, getGuardrailUISettings } from "@/components/networking";
import GuardrailInfoView from "./guardrail_info";
import { populateGuardrailProviderMap, populateGuardrailProviders } from "./guardrail_info_helpers";

vi.mock("@/components/networking", () => ({
  getGuardrailInfo: vi.fn(),
  getGuardrailUISettings: vi.fn(),
  getGuardrailProviderSpecificParams: vi.fn(),
  updateGuardrailCall: vi.fn(),
  decisionsTestCall: vi.fn(),
}));

vi.mock("./content_filter/ContentFilterManager", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-content-filter-manager" />,
  formatContentFilterDataForAPI: (patterns: unknown[], blockedWords: unknown[], categories?: unknown[]) => ({
    patterns,
    blocked_words: blockedWords,
    categories: categories ?? [],
  }),
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

const renderInfo = () =>
  renderWithProviders(
    <GuardrailInfoView guardrailId="123" onClose={vi.fn()} accessToken="test-token" isAdmin={true} />,
  );

const GUARDRAIL_INFO_RESPONSE = {
  guardrail_id: "123",
  guardrail_name: "Test Guardrail",
  litellm_params: {
    guardrail: "headroom",
    mode: ["pre_call", "post_call"],
    default_on: true,
    stream_scope: "both",
    skip_system_message_in_guardrail: true,
    pii_entities_config: { EMAIL_ADDRESS: "MASK" },
  },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  guardrail_definition_location: "database",
};

const UI_SETTINGS = {
  supported_entities: [],
  supported_actions: ["MASK", "BLOCK"],
  supported_modes: ["pre_call", "during_call", "post_call", "logging_only"],
  pii_entity_categories: [],
};

describe("GuardrailInfoView zh-CN", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(getGuardrailInfo).mockResolvedValue(GUARDRAIL_INFO_RESPONSE);
    vi.mocked(getGuardrailUISettings).mockResolvedValue(UI_SETTINGS);
    vi.mocked(getGuardrailProviderSpecificParams).mockResolvedValue(HEADROOM_PARAMS);
    populateGuardrailProviders(HEADROOM_PARAMS);
    populateGuardrailProviderMap(HEADROOM_PARAMS);
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the detail view tabs and back button in Chinese", async () => {
    renderInfo();

    expect(await screen.findByText("返回护栏列表")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "概览" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "设置" })).toBeInTheDocument();
    expect(screen.queryByText("Back to Guardrails")).not.toBeInTheDocument();
  });

  it("renders mode, stream scope and PII actions with readable Chinese labels", async () => {
    renderInfo();

    expect(await screen.findByText("返回护栏列表")).toBeInTheDocument();
    expect(screen.getAllByText("调用前, 调用后").length).toBeGreaterThan(0);
    expect(screen.getAllByText("流式与非流式").length).toBeGreaterThan(0);
    expect(screen.getByText("掩码")).toBeInTheDocument();
    expect(screen.queryByText("pre_call, post_call")).not.toBeInTheDocument();
    expect(screen.queryByText("both")).not.toBeInTheDocument();
    expect(screen.queryByText("MASK")).not.toBeInTheDocument();
  });

  it("shows readable Chinese labels in the edit form for boolean and provider-specific fields", async () => {
    const user = userEvent.setup();
    renderInfo();

    await screen.findByText("返回护栏列表");
    await user.click(screen.getByRole("tab", { name: "设置" }));
    await user.click(await screen.findByRole("button", { name: "编辑设置" }));

    expect(await screen.findByText("不可达回退策略")).toBeInTheDocument();
    expect(screen.getByText("API 基础地址")).toBeInTheDocument();
    expect(screen.getByLabelText("默认启用")).toHaveTextContent("是");
    expect(screen.getByLabelText("不可达回退策略")).toHaveTextContent("拦截（报错）");
    expect(screen.getByLabelText("CCR 检索")).toHaveTextContent("是");
    expect(screen.queryByText("fail_closed")).not.toBeInTheDocument();
    expect(screen.queryByText("True")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("不可达回退策略"));
    const options = await screen.findAllByRole("option", { name: /放行（不压缩）|拦截（报错）/ });
    expect(options.map((option) => option.textContent)).toEqual(
      expect.arrayContaining(["拦截（报错）", "放行（不压缩）"]),
    );
    expect(screen.queryByRole("option", { name: "fail_open" })).not.toBeInTheDocument();
  });

  it("renders the skip-message selects with the global-default option in Chinese", async () => {
    renderInfo();

    await screen.findByText("返回护栏列表");
    await userEvent.click(screen.getByRole("tab", { name: "设置" }));
    await userEvent.click(await screen.findByRole("button", { name: "编辑设置" }));

    expect(await screen.findByText("在护栏中跳过系统消息")).toBeInTheDocument();
    const systemSelect = screen.getByLabelText("在护栏中跳过系统消息");
    expect(within(systemSelect).queryByText("inherit")).not.toBeInTheDocument();
    expect(systemSelect).toHaveTextContent("是");
  });
});
