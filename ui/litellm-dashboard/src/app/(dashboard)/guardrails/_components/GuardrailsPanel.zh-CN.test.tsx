import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import GuardrailsPanel from "./GuardrailsPanel";
import { getGuardrailsList, deleteGuardrailCall } from "@/components/networking";
import { cleanup, fireEvent, renderWithProviders, screen, within } from "@/../tests/test-utils";

vi.mock("@/components/networking", () => ({
  getGuardrailsList: vi.fn(),
  deleteGuardrailCall: vi.fn(),
}));

vi.mock("./guardrail_garden", () => ({
  __esModule: true,
  default: () => <div>Mock Guardrail Garden</div>,
}));

vi.mock("./guardrail_table", () => ({
  __esModule: true,
  default: ({ guardrailsList, onDeleteClick }: any) => (
    <div>
      <div>Mock Guardrail Table</div>
      {guardrailsList.length > 0 && (
        <button
          data-testid="delete-button"
          onClick={() => onDeleteClick(guardrailsList[0].guardrail_id, guardrailsList[0].guardrail_name)}
        >
          Delete
        </button>
      )}
    </div>
  ),
}));

vi.mock("./GuardrailTestPlayground", () => ({
  __esModule: true,
  default: () => <div>Mock Guardrail Test Playground</div>,
}));

vi.mock("./TeamGuardrailsTab", () => ({
  TeamGuardrailsTab: () => <div>Mock Team Guardrails Tab</div>,
}));

vi.mock("./guardrail_info_helpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./guardrail_info_helpers")>()),
  getGuardrailLogoAndName: vi.fn(() => ({ logo: null, displayName: "Test Provider" })),
}));

describe("GuardrailsPanel zh-CN", () => {
  const mockGetGuardrailsList = vi.mocked(getGuardrailsList);
  const mockDeleteGuardrailCall = vi.mocked(deleteGuardrailCall);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGuardrailsList.mockResolvedValue({
      guardrails: [
        {
          guardrail_id: "test-guardrail-1",
          guardrail_name: "Test Guardrail",
          litellm_params: {
            guardrail: "test-provider",
            mode: "async",
            default_on: true,
          },
          guardrail_info: null,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          guardrail_definition_location: "database" as any,
        },
      ],
    });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the guardrails tabs and add button in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<GuardrailsPanel accessToken="test-token" userRole="proxy_admin" />);

    expect(await screen.findByText("护栏库")).toBeInTheDocument();
    expect(screen.getByText("测试 Playground")).toBeInTheDocument();
    expect(screen.getByText("已提交的护栏")).toBeInTheDocument();
    expect(screen.getByText("+ 添加新护栏")).toBeInTheDocument();
    expect(screen.queryByText("Guardrail Garden")).not.toBeInTheDocument();
  });

  it("localizes the guardrail delete confirmation dialog", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<GuardrailsPanel accessToken="test-token" userRole="proxy_admin" />);

    fireEvent.click(await screen.findByTestId("delete-button"));

    const modal = within(await screen.findByRole("dialog"));
    expect(modal.getByText("删除护栏")).toBeInTheDocument();
    expect(modal.getByText("Test Guardrail")).toBeInTheDocument();
    expect(modal.getByText("Test Provider")).toBeInTheDocument();
    expect(modal.getByText("默认启用")).toBeInTheDocument();

    fireEvent.click(modal.getByRole("button", { name: "删除" }));

    await vi.waitFor(() => {
      expect(mockDeleteGuardrailCall).toHaveBeenCalledWith("test-token", "test-guardrail-1");
    });
  });
});
