import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, renderWithProviders as render, screen, waitFor } from "@/../tests/test-utils";
import i18n from "@/lib/i18n";
import { userFilterUICall } from "@/components/networking";
import UserSearchModal from "./user_search_modal";

vi.mock("@/components/networking", () => ({
  userFilterUICall: vi.fn().mockResolvedValue([]),
}));

// The real control is a Base UI combobox whose value changes need real keyboard input. This
// harness exposes the same contract (value, onValueChange, placeholder, emptyText, inputId) as a
// plain input plus one button per option, so the assertions stay on the modal's own strings.
vi.mock("@/components/shared/PaginatedSearchSelect", () => ({
  PaginatedSearchSelect: ({
    options,
    onValueChange,
    onSearchChange,
    placeholder,
    emptyText,
    loadingText,
    inputId,
  }: {
    options: { value: string; label: string }[];
    onValueChange: (value: string | null) => void;
    onSearchChange: (query: string) => void;
    placeholder: string;
    emptyText: string;
    loadingText: string;
    inputId?: string;
  }) => (
    <div>
      <input
        id={inputId}
        placeholder={placeholder}
        onChange={(event) => onSearchChange(event.target.value)}
        readOnly={false}
      />
      <span>{options.length === 0 ? emptyText : loadingText}</span>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onValueChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

const users = [{ user_id: "user-1", user_email: "ada@example.com", role: "user" }];

const renderModal = (onSubmit: (values: unknown) => void | Promise<void> = vi.fn()) =>
  render(<UserSearchModal isVisible onCancel={vi.fn()} onSubmit={onSubmit} accessToken="sk-test" />);

const emailInput = () => screen.getByRole("textbox", { name: "邮箱" });

describe("UserSearchModal zh-CN", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
    vi.mocked(userFilterUICall).mockResolvedValue(users);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the modal title and field labels in Chinese", () => {
    renderModal();

    expect(screen.getByText("添加团队成员")).toBeInTheDocument();
    expect(screen.getByText("邮箱")).toBeInTheDocument();
    expect(screen.getByText("用户 ID")).toBeInTheDocument();
    expect(screen.getByText("成员角色")).toBeInTheDocument();
    expect(screen.getByText("或")).toBeInTheDocument();
    expect(screen.queryByText("Add Team Member")).not.toBeInTheDocument();
    expect(screen.queryByText("Member Role")).not.toBeInTheDocument();
  });

  it("renders the email search prompt and the add button in Chinese", () => {
    renderModal();

    expect(screen.getByPlaceholderText("按邮箱搜索")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加成员" })).toBeInTheDocument();
  });

  it("renders the selected user as a clickable option and the submitting label in Chinese", async () => {
    const onSubmit = vi.fn(() => new Promise<void>(() => {}));
    renderModal(onSubmit);

    fireEvent.change(emailInput(), { target: { value: "ada" } });

    const option = await screen.findByText("ada@example.com");
    fireEvent.click(option);
    await waitFor(() => expect(screen.getByRole("button", { name: "添加成员" })).toBeEnabled());

    fireEvent.click(screen.getByRole("button", { name: "添加成员" }));

    expect(await screen.findByText("添加中...")).toBeInTheDocument();
  });
});
