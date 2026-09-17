import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n";
import HashicorpVault from "./HashicorpVault";
import { FIELD_LABELS, FIELD_LABEL_KEYS, fieldLabel } from "./constants";
import { cleanup, renderWithProviders, screen } from "../../../../../tests/test-utils";

const mockUseAuthorized = vi.hoisted(() => vi.fn());
const mockUseHashicorpVaultConfig = vi.hoisted(() => vi.fn());

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: mockUseAuthorized,
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useHashicorpVaultConfig", () => ({
  useHashicorpVaultConfig: mockUseHashicorpVaultConfig,
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useDeleteHashicorpVaultConfig", () => ({
  useDeleteHashicorpVaultConfig: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/app/(dashboard)/hooks/configOverrides/useUpdateHashicorpVaultConfig", () => ({
  useUpdateHashicorpVaultConfig: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("./EditHashicorpVaultModal", () => ({
  default: () => null,
}));

vi.mock("@/components/common_components/DeleteResourceModal", () => ({
  default: () => null,
}));

describe("HashicorpVault field labels zh-CN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthorized.mockReturnValue({ accessToken: "test-token" });
    const configuredResult = {
      data: { values: { vault_addr: "https://vault.example.com" } },
      isLoading: false,
      isError: false,
      error: null,
    };
    mockUseHashicorpVaultConfig.mockReturnValue(configuredResult);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the field labels in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderWithProviders(<HashicorpVault />);

    expect(screen.getByText("Vault 地址")).toBeInTheDocument();
    expect(screen.getByText("认证方式")).toBeInTheDocument();
    expect(screen.getByText("https://vault.example.com")).toBeInTheDocument();

    expect(screen.queryByText("Vault Address")).not.toBeInTheDocument();
  });

  it("keeps every field label byte-identical in English", async () => {
    for (const fieldName of Object.keys(FIELD_LABELS)) {
      expect(FIELD_LABEL_KEYS[fieldName]).toBeDefined();
      expect(fieldLabel(fieldName, i18n.t)).toBe(FIELD_LABELS[fieldName]);
    }
  });

  it("falls back to the raw field name for an unknown field", () => {
    expect(fieldLabel("some_unknown_field", i18n.t)).toBe("some_unknown_field");
  });
});
