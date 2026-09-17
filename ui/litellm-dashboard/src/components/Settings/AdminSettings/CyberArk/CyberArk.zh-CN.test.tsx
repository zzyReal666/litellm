import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import CyberArk from "./CyberArk";
import { FIELD_LABELS, FIELD_LABEL_KEYS, fieldLabel } from "./constants";
import { cleanup, renderWithProviders, screen } from "../../../../../tests/test-utils";

const mockUseAuthorized = vi.hoisted(() => vi.fn());
const mockUseCyberArkConfig = vi.hoisted(() => vi.fn());

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: mockUseAuthorized,
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useCyberArkConfig", () => ({
  useCyberArkConfig: mockUseCyberArkConfig,
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useDeleteCyberArkConfig", () => ({
  useDeleteCyberArkConfig: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useUpdateCyberArkConfig", () => ({
  useUpdateCyberArkConfig: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("./EditCyberArkModal", () => ({
  default: () => null,
}));

vi.mock("@/components/common_components/DeleteResourceModal", () => ({
  default: () => null,
}));

describe("CyberArk field labels zh-CN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthorized.mockReturnValue({ accessToken: "test-token" });
    const configuredResult = {
      data: { values: { cyberark_api_base: "https://conjur.example.com" } },
      isLoading: false,
      isError: false,
      error: null,
    };
    mockUseCyberArkConfig.mockReturnValue(configuredResult);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the field labels in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<CyberArk />);

    expect(screen.getByText("Conjur 服务器 URL")).toBeInTheDocument();
    expect(screen.getByText("认证方式")).toBeInTheDocument();
    expect(screen.getByText("https://conjur.example.com")).toBeInTheDocument();

    expect(screen.queryByText("Conjur Server URL")).not.toBeInTheDocument();
  });

  it("keeps every field label byte-identical in English", async () => {
    for (const fieldName of Object.keys(FIELD_LABELS)) {
      expect(FIELD_LABEL_KEYS[fieldName]).toBeDefined();
      expect(fieldLabel(fieldName, i18n.t)).toBe(FIELD_LABELS[fieldName]);
    }
  });
});
