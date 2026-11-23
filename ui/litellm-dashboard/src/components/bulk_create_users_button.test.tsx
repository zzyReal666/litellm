import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, it, expect, vi } from "vitest";

import BulkCreateUsersButton from "./bulk_create_users_button";

const { userCreateCall, invitationCreateCall } = vi.hoisted(() => ({
  userCreateCall: vi.fn(),
  invitationCreateCall: vi.fn(),
}));

vi.mock("./networking", () => ({
  userCreateCall,
  invitationCreateCall,
  getProxyUISettings: vi.fn().mockResolvedValue({
    PROXY_BASE_URL: null,
    PROXY_LOGOUT_URL: null,
    DEFAULT_TEAM_DISABLED: false,
    SSO_ENABLED: false,
  }),
}));

const readBlobText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

const csvFile = () =>
  new File(["user_email,user_role\nnew.hire@example.com,internal_user\n"], "users.csv", { type: "text/csv" });

const openUploadStep = async () => {
  const user = userEvent.setup();
  render(<BulkCreateUsersButton accessToken="test-token" teams={[]} possibleUIRoles={null} />);
  await user.click(screen.getByText("+ Bulk Invite Users"));
  return user;
};

describe("BulkCreateUsersButton", () => {
  it("should render", () => {
    render(<BulkCreateUsersButton accessToken="test-token" teams={[]} possibleUIRoles={null} />);
    expect(screen.getByText("+ Bulk Invite Users")).toBeInTheDocument();
  });

  it("parses a CSV chosen through the file input", async () => {
    await openUploadStep();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [csvFile()] } });

    expect(await screen.findByText("new.hire@example.com")).toBeInTheDocument();
  });

  it("parses a CSV dropped onto the drop zone", async () => {
    await openUploadStep();

    const dropZone = screen.getByLabelText(/drag and drop your csv file here/i).closest("label");
    fireEvent.drop(dropZone as HTMLLabelElement, { dataTransfer: { files: [csvFile()], types: ["Files"] } });

    expect(await screen.findByText("new.hire@example.com")).toBeInTheDocument();
  });

  it("exposes the drop zone as a label for a keyboard-reachable file input", async () => {
    await openUploadStep();

    const fileInput = screen.getByLabelText(/drag and drop your csv file here/i) as HTMLInputElement;
    expect(fileInput).toHaveAttribute("type", "file");
    expect(fileInput).toHaveAttribute("accept", ".csv");
    expect(fileInput).toBeVisible();

    const dropZone = fileInput.closest("label") as HTMLLabelElement;
    expect(fileInput.id).not.toBe("");
    expect(dropZone.htmlFor).toBe(fileInput.id);

    const danglingLabels = [...document.querySelectorAll("label[for]")].filter(
      (label) => document.getElementById(label.getAttribute("for") as string) === null,
    );
    expect(danglingLabels).toEqual([]);
  });

  it("downloads a CSV template that matches the documented columns", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:template");
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = await openUploadStep();

    await user.click(screen.getByRole("button", { name: /download csv template/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:template");
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const lines = (await readBlobText(blob)).replace(/^\uFEFF/, "").trim().split("\n");
    expect(lines[0]).toBe("user_email,user_role,teams,max_budget,budget_duration,models");
    expect(lines).toHaveLength(2);
    expect(lines[1].split(",")[0]).toContain("@");
    clickSpy.mockRestore();
  });
});


describe("BulkCreateUsersButton import safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userCreateCall.mockResolvedValue({ data: { user_id: "new-user-1" } });
    invitationCreateCall.mockResolvedValue({ id: "inv-1", user_id: "new-user-1" });
  });

  const upload = async (csv: string) => {
    const user = userEvent.setup();
    render(<BulkCreateUsersButton accessToken="test-token" teams={[]} possibleUIRoles={null} />);
    await user.click(screen.getByText("+ Bulk Invite Users"));
    const file = new File([csv], "users.csv", { type: "text/csv" });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    await screen.findByText(/@example\.com/, undefined, { timeout: 3000 });
    return user;
  };

  it("does not send a budget for rows where max_budget is blank and calls out the row", async () => {
    const user = await upload(
      "user_email,user_role,max_budget\nnew.hire@example.com,internal_user,\n",
    );

    expect(screen.getByText(/Rows 2 have no max_budget/)).toBeInTheDocument();

    const createButton = screen.getAllByRole("button", { name: /Create 1 Users/i }).at(-1) as HTMLElement;
    expect(createButton).toBeEnabled();
    fireEvent.click(createButton);

    await waitFor(() => expect(userCreateCall).toHaveBeenCalledTimes(1));
    const payload = userCreateCall.mock.calls[0][2] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("max_budget");
    expect(payload).toMatchObject({ user_email: "new.hire@example.com", user_role: "internal_user" });
  });

  it("keeps an explicitly provided budget", async () => {
    const user = await upload(
      "user_email,user_role,max_budget\nnew.hire@example.com,internal_user,100\n",
    );

    const createButton = screen.getAllByRole("button", { name: /Create 1 Users/i }).at(-1) as HTMLElement;
    expect(createButton).toBeEnabled();
    fireEvent.click(createButton);

    await waitFor(() => expect(userCreateCall).toHaveBeenCalledTimes(1));
    expect(userCreateCall.mock.calls[0][2]).toMatchObject({ max_budget: 100 });
    expect(screen.queryByText(/have no max_budget/)).not.toBeInTheDocument();
  });

  it("lists failing row numbers in the parse error", async () => {
    await upload(
      "user_email,user_role\nok@example.com,internal_user\nnot-an-email,internal_user\n",
    );

    expect(await screen.findByText(/rows: 3/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Create 1 Users/i }).length).toBeGreaterThan(0);
  });

  it("stops showing the processing state after parsing and after cancel", async () => {
    const user = await upload("user_email,user_role\nnew.hire@example.com,internal_user\n");

    await waitFor(() => expect(screen.queryByText("Processing...")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByText("+ Bulk Invite Users"));
    expect(screen.getByText(/Drag and drop your CSV file here/i)).toBeInTheDocument();
    expect(screen.queryByText("Processing...")).not.toBeInTheDocument();
  });
});
