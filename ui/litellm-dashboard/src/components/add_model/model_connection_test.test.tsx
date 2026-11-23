import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/lib/toast";
import { testConnectionRequest } from "../networking";
import { prepareModelAddRequest } from "./handle_add_model_submit";
import ModelConnectionTest from "./model_connection_test";

vi.mock("../networking", () => ({ testConnectionRequest: vi.fn() }));
vi.mock("./handle_add_model_submit", () => ({ prepareModelAddRequest: vi.fn() }));

const preparedRequest = [{ litellmParamsObj: { model: "openai/gpt-4o-mini" }, modelInfoObj: { mode: "chat" } }];

const finishConnectionTest = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
};

describe("ModelConnectionTest", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(prepareModelAddRequest).mockResolvedValue(preparedRequest as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tests the prepared model and shows a successful result", async () => {
    const onTestComplete = vi.fn();
    vi.mocked(testConnectionRequest).mockResolvedValue({ status: "success" } as never);

    render(
      <ModelConnectionTest
        formValues={{ model: "gpt-4o-mini" }}
        accessToken="sk-test"
        testMode="chat"
        modelName="GPT-4o mini"
        onTestComplete={onTestComplete}
      />,
    );

    expect(screen.getByText("Testing connection to GPT-4o mini...")).toBeInTheDocument();
    await finishConnectionTest();

    expect(prepareModelAddRequest).toHaveBeenCalledWith({ model: "gpt-4o-mini" }, "sk-test", null);
    expect(testConnectionRequest).toHaveBeenCalledWith(
      "sk-test",
      { model: "openai/gpt-4o-mini" },
      { mode: "chat" },
      "chat",
    );
    expect(screen.getByTestId("connection-success-msg")).toHaveTextContent("Connection to GPT-4o mini successful!");
    expect(toast.success).toHaveBeenCalledWith("Connection test successful!");
    expect(onTestComplete).toHaveBeenCalledTimes(1);
  });

  it("shows a cleaned provider error, request details, and copies the curl command", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    vi.mocked(testConnectionRequest).mockResolvedValue({
      status: "error",
      result: {
        error: "litellm.AuthenticationError: invalid api key stack trace: hidden",
        raw_request_typed_dict: {
          raw_request_api_base: "https://api.example.test/v1/chat/completions",
          raw_request_body: { model: "gpt-4o-mini" },
          raw_request_headers: { Authorization: "Bearer test" },
        },
      },
    } as never);

    render(
      <ModelConnectionTest
        formValues={{ model: "gpt-4o-mini" }}
        accessToken="sk-test"
        testMode="chat"
        modelName="GPT-4o mini"
      />,
    );
    await finishConnectionTest();

    expect(screen.getByTestId("connection-failure-msg")).toHaveTextContent("Connection to GPT-4o mini failed");
    expect(screen.getByText("invalid api key")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show Details" }));
    expect(screen.getByText("Troubleshooting Details")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Copy to Clipboard/ }));

    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("https://api.example.test/v1/chat/completions")),
    );
    const copiedCurl = writeText.mock.calls[0][0] as string;
    expect(copiedCurl).not.toContain("Bearer test");
    expect(copiedCurl).toContain("Authorization: ***");
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard");
  });

  it("falls back to execCommand when the async clipboard API rejects (HTTP deployments)", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard API unavailable"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });
    vi.mocked(testConnectionRequest).mockResolvedValue({
      status: "error",
      result: {
        error: "404 model not found",
        raw_request_typed_dict: {
          raw_request_api_base: "http://proxy.local/v1/chat/completions",
          raw_request_body: { model: "gpt-4o-mini" },
          raw_request_headers: {},
        },
      },
    } as never);

    render(<ModelConnectionTest formValues={{ model: "gpt-4o-mini" }} accessToken="sk-test" testMode="chat" />);
    await finishConnectionTest();

    fireEvent.click(screen.getByRole("button", { name: /Copy to Clipboard/ }));

    await vi.waitFor(() => expect(execCommand).toHaveBeenCalledWith("copy"));
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard");
  });

  it.each([
    ["401 invalid api key", "Authentication failed", /API key or credential is correct/],
    ["404 model not found", "Endpoint or model not found", /provider deploys this model name/],
    ["Request timed out after 30s", "Request timed out", /network connectivity/],
    ["429 rate limit exceeded", "Rate limited or quota exceeded", /account quota/],
  ])("explains a %s failure with a matching suggestion", async (providerError, title, suggestion) => {
    vi.mocked(testConnectionRequest).mockResolvedValue({
      status: "error",
      result: { error: providerError },
    } as never);

    render(<ModelConnectionTest formValues={{ model: "gpt-4o-mini" }} accessToken="sk-test" testMode="chat" />);
    await finishConnectionTest();

    expect(screen.getByTestId("connection-issue-title")).toHaveTextContent(title);
    expect(screen.getByTestId("connection-troubleshooting")).toHaveTextContent(suggestion);
  });

  it("shows the credential and duration for a prepared saved-model request", async () => {
    vi.mocked(testConnectionRequest).mockResolvedValue({ status: "success" } as never);

    render(
      <ModelConnectionTest
        accessToken="sk-test"
        testMode="chat"
        preparedRequest={{ litellmParamsObj: { model: "openai/gpt-4o-mini" }, modelInfoObj: { id: "model-1" } }}
        credentialName="prod-openai"
      />,
    );
    await finishConnectionTest();

    expect(testConnectionRequest).toHaveBeenCalledWith(
      "sk-test",
      { model: "openai/gpt-4o-mini" },
      { id: "model-1" },
      undefined,
    );
    expect(screen.getByTestId("connection-duration")).toBeInTheDocument();
  });

  it("shows a preparation failure without sending a connection request", async () => {
    vi.mocked(prepareModelAddRequest).mockResolvedValue(null as never);

    render(<ModelConnectionTest formValues={{}} accessToken="sk-test" testMode="chat" />);
    await finishConnectionTest();

    expect(screen.getByText("Failed to prepare model data. Please check your form inputs.")).toBeInTheDocument();
    expect(testConnectionRequest).not.toHaveBeenCalled();
  });
});
