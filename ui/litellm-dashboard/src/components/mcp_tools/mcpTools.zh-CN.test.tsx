import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/lib/i18n";
import { ByokCredentialModal } from "./ByokCredentialModal";
import MCPToolArgumentsForm, { type MCPToolArgumentsFormRef } from "./MCPToolArgumentsForm";
import McpCrudPermissionPanel from "./McpCrudPermissionPanel";
import { AUTH_TYPE, AUTH_TYPE_ITEMS, TRANSPORT, TRANSPORT_ITEMS, localizeSelectItems } from "./types";
import type { MCPTool, MCPServer } from "./types";

const zhBundle = i18n.getResourceBundle("zh-CN", "translation") as Record<string, unknown>;

const zhValue = (key: string): unknown =>
  key
    .split(".")
    .reduce<unknown>(
      (node, part) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[part] : undefined),
      zhBundle,
    );

const BYOK_SERVER = {
  server_id: "srv-1",
  alias: "Linear",
  server_name: "Linear",
  byok_description: ["Read issues"],
} as MCPServer;

beforeEach(async () => {
  await i18n.changeLanguage("zh-CN");
});

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
});

describe("MCP transport and auth option arrays in Chinese", () => {
  it("translates every option through its labelKey", () => {
    const authItems = localizeSelectItems(AUTH_TYPE_ITEMS, i18n.t.bind(i18n));
    const transportItems = localizeSelectItems(TRANSPORT_ITEMS, i18n.t.bind(i18n));

    expect(authItems.find((item) => item.value === AUTH_TYPE.API_KEY)?.label).toBe("API 密钥");
    expect(authItems.find((item) => item.value === AUTH_TYPE.TRUE_PASSTHROUGH)?.label).toBe(
      "真实透传（不使用 LiteLLM 认证）",
    );
    expect(authItems.find((item) => item.value === AUTH_TYPE.OAUTH_DELEGATE)?.label).toBe(
      "OAuth 委派（由客户端提供上游 Token）",
    );
    expect(transportItems.find((item) => item.value === TRANSPORT.STDIO)?.label).toBe("标准输入/输出（stdio）");
    expect(transportItems.find((item) => item.value === TRANSPORT.HTTP)?.label).toBe("Streamable HTTP（推荐）");
  });

  it("renders the original English labels in the en locale", async () => {
    await i18n.changeLanguage("en");

    expect(localizeSelectItems(AUTH_TYPE_ITEMS, i18n.t.bind(i18n))).toEqual([...AUTH_TYPE_ITEMS]);
    expect(localizeSelectItems(TRANSPORT_ITEMS, i18n.t.bind(i18n))).toEqual([...TRANSPORT_ITEMS]);
  });

  it("has a Chinese entry for every option labelKey", () => {
    for (const item of [...AUTH_TYPE_ITEMS, ...TRANSPORT_ITEMS]) {
      expect(zhValue(item.labelKey)).toBeTypeOf("string");
    }
  });
});

describe("ByokCredentialModal in Chinese", () => {
  it("renders the connect step with interpolated server name", () => {
    render(<ByokCredentialModal server={BYOK_SERVER} open onClose={() => {}} onSuccess={() => {}} />);

    expect(screen.getByText("连接 Linear")).toBeInTheDocument();
    expect(screen.getByText("LiteLLM 需要访问 Linear 以完成您的请求。")).toBeInTheDocument();
    expect(screen.getByText("工作原理")).toBeInTheDocument();
    expect(
      screen.getByText("LiteLLM 充当安全桥梁。您的请求通过我们的 MCP 客户端直接路由到 Linear 的 API。"),
    ).toBeInTheDocument();
    expect(screen.getByText("请求的访问权限")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续进行认证" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("renders the API key step in Chinese", async () => {
    const user = userEvent.setup();
    render(<ByokCredentialModal server={BYOK_SERVER} open onClose={() => {}} onSuccess={() => {}} />);

    await user.click(screen.getByRole("button", { name: "继续进行认证" }));

    expect(screen.getByText("提供 API 密钥")).toBeInTheDocument();
    expect(screen.getByText("请输入您的 Linear API 密钥以授权此连接。")).toBeInTheDocument();
    expect(screen.getByLabelText("Linear API 密钥")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入您的 API 密钥")).toBeInTheDocument();
    expect(screen.getByText("保存密钥以供以后使用")).toBeInTheDocument();
    expect(screen.getByText("您的密钥已安全存储并通过 HTTPS 传输，不会与第三方共享。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "连接并授权" })).toBeInTheDocument();
  });

  it("falls back to the translated placeholder name when the server has no name", () => {
    render(
      <ByokCredentialModal server={{ server_id: "srv-2" } as MCPServer} open onClose={() => {}} onSuccess={() => {}} />,
    );

    expect(screen.getByText("连接 服务")).toBeInTheDocument();
  });
});

describe("McpCrudPermissionPanel in Chinese", () => {
  const renderPanel = () =>
    render(
      <McpCrudPermissionPanel
        tools={[
          { name: "get_rates", description: "Fetch rates" },
          { name: "delete_thing", description: "Remove a row" },
        ]}
        value={["get_rates"]}
        onChange={() => {}}
      />,
    );

  it("translates group headers, risk badges and toggle state", () => {
    renderPanel();

    expect(screen.getByText("读取")).toBeInTheDocument();
    expect(screen.getByText("删除")).toBeInTheDocument();
    expect(screen.getByText("安全")).toBeInTheDocument();
    expect(screen.getByText("高风险")).toBeInTheDocument();
    expect(screen.getByText("安全操作：获取、列表、搜索，无副作用。")).toBeInTheDocument();
    expect(screen.getByText("破坏性操作：移除、清除、销毁。")).toBeInTheDocument();
    expect(screen.getByText("已允许 1/1")).toBeInTheDocument();
    expect(screen.getByText("已允许 0/1")).toBeInTheDocument();
    expect(screen.getByText("全部开启")).toBeInTheDocument();
    expect(screen.getByText("全部关闭")).toBeInTheDocument();
    expect(screen.getByText("开")).toBeInTheDocument();
    expect(screen.getByText("关")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "允许所有读取工具" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "允许所有删除工具" })).toBeInTheDocument();
  });
});

describe("MCPToolArgumentsForm in Chinese", () => {
  const renderForm = (inputSchema: MCPTool["inputSchema"]) => {
    const ref = createRef<MCPToolArgumentsFormRef>();
    render(<MCPToolArgumentsForm ref={ref} tool={{ name: "demo", inputSchema } as MCPTool} />);
    return ref;
  };

  it("renders the single string input from the string shorthand schema", () => {
    renderForm("some string schema");

    expect(screen.getByText("输入")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("为此工具输入内容")).toBeInTheDocument();
  });

  it("renders per-field labels, placeholders and the boolean option labels", () => {
    renderForm({
      type: "object",
      properties: {
        name: { type: "string" },
        count: { type: "integer" },
        payload: { type: "object" },
        flag: { type: "boolean" },
        kind: { type: "string", enum: ["a", "b"] },
      },
      required: ["name"],
    } as unknown as MCPTool["inputSchema"]);

    expect(screen.getByPlaceholderText("输入 name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("输入 count")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("为 payload 输入 JSON 对象")).toBeInTheDocument();
    expect(screen.getByText("选择 kind")).toBeInTheDocument();
  });

  it("reports field errors in Chinese through getSubmitValues", async () => {
    const ref = renderForm({
      type: "object",
      properties: {
        name: { type: "string" },
        kind: { type: "string", enum: ["a", "b"], default: "zzz" },
      },
      required: ["name"],
    } as unknown as MCPTool["inputSchema"]);

    await expect(ref.current?.getSubmitValues()).rejects.toEqual({
      errorFields: [
        { name: ["name"], errors: ["请输入 name"] },
        { name: ["kind"], errors: ["请选择有效的 kind"] },
      ],
    });
  });

  it("labels the empty string enum option in Chinese", async () => {
    const user = userEvent.setup();
    renderForm({
      type: "object",
      properties: { kind: { type: "string", enum: ["", "a"] } },
    } as unknown as MCPTool["inputSchema"]);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findAllByText("空字符串")).not.toHaveLength(0);
  });
});
