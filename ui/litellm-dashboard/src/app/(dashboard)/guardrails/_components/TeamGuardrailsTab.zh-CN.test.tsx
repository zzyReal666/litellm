import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/lib/i18n";
import { TeamGuardrailsTab } from "./TeamGuardrailsTab";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { listGuardrailSubmissions } from "@/components/networking";

vi.mock("@/components/networking", () => ({
  listGuardrailSubmissions: vi.fn(),
  approveGuardrailSubmission: vi.fn(),
  rejectGuardrailSubmission: vi.fn(),
  updateGuardrailCall: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/guardrails/useRegisterGuardrail", () => ({
  useRegisterGuardrail: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/components/common_components/team_dropdown", () => ({
  default: () => null,
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: vi.fn(),
}));

const pendingSubmission = {
  guardrail_id: "guard-1",
  guardrail_name: "test-pending-guardrail",
  status: "pending_review",
  team_id: "team-1",
  team_guardrail: true,
  litellm_params: {
    guardrail: "generic_guardrail_api",
    mode: "pre_call",
    api_base: "https://example.com/guard",
    headers: { "X-API-Key": "secret" },
    extra_headers: ["x-request-id"],
  },
  guardrail_info: {},
  submitted_at: "2026-05-09T00:00:00Z",
};

const mockUseAuthorized = vi.mocked(useAuthorized);

const renderTab = () => {
  mockUseAuthorized.mockReturnValue({
    token: "test-token",
    accessToken: "test-token",
    userId: "user-1",
    userEmail: "user@example.com",
    userRole: "Admin",
    premiumUser: false,
    disabledPersonalKeyCreation: null,
    showSSOBanner: false,
  } as ReturnType<typeof useAuthorized>);
  return renderWithProviders(<TeamGuardrailsTab accessToken="test-token" />);
};

describe("TeamGuardrailsTab zh-CN", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh-CN");
    vi.mocked(listGuardrailSubmissions).mockResolvedValue({
      submissions: [pendingSubmission],
      summary: { total: 1, pending_review: 1, active: 0, rejected: 0 },
    });
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the page header, add button, search box and stat cards in Chinese", async () => {
    renderTab();

    expect(await screen.findByRole("button", { name: /添加护栏/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("搜索护栏...")).toBeInTheDocument();
    expect(screen.getByText("已提交总数")).toBeInTheDocument();
    expect(screen.getAllByText("待审核").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已激活").length).toBeGreaterThan(0);
    expect(screen.getAllByText("已拒绝").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("按状态筛选")).toBeInTheDocument();
    expect(screen.queryByText("Total Submitted")).not.toBeInTheDocument();
  });

  it("renders the status filter choices in Chinese", async () => {
    renderTab();

    const filter = await screen.findByLabelText("按状态筛选");
    expect(within(filter).getByText("所有状态")).toBeInTheDocument();
  });

  it("renders the submission card and its review actions in Chinese", async () => {
    renderTab();

    expect(await screen.findByText("test-pending-guardrail")).toBeInTheDocument();
    expect(screen.getByText("审阅")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "批准" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "拒绝" })).toBeInTheDocument();
    expect(screen.getByText("团队：team-1")).toBeInTheDocument();
    expect(screen.getByText("提交时间：")).toBeInTheDocument();
  });

  it("renders the approve confirmation dialog in Chinese", async () => {
    renderTab();

    fireEvent.click(await screen.findByRole("button", { name: "批准" }));

    const title = await screen.findByText("批准护栏");
    const dialog = title.closest("div.fixed") as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText(/确定要批准/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "批准" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("renders the reject confirmation dialog in Chinese", async () => {
    renderTab();

    fireEvent.click(await screen.findByRole("button", { name: "拒绝" }));

    const title = await screen.findByText("拒绝护栏");
    const dialog = title.closest("div.fixed") as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText(/确定要拒绝/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "拒绝" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "取消" })).toBeInTheDocument();
  });
});
