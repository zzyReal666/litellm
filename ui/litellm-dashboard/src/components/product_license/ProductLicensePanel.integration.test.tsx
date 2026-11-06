import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "../../../tests/test-utils";
import { ProductLicenseInfo } from "@/lib/http/productLicense";
import ProductLicensePanel from "./ProductLicensePanel";

const licensedInfo: ProductLicenseInfo = {
  product_name: "中安云科 AI 安全网关",
  product_version: "1.106.0",
  serial_number: "17E4-95EC-8553-2F54",
  status: "正式授权",
  time: "长期有效",
  create_time: "2026-11-06 08:54:40",
  auth_state: "authorized",
  machine_code: "17E4-95EC-8553-2F54",
  device_serial: "niubi-666",
  user_count: 110,
  thread_count: 0,
  user_desc: "AI 安全网关（AIG）",
  license_version: 1,
  native_available: true,
  license_file: "/app/data/product_license.lic",
  message: "授权有效",
};

const unlicensedInfo: ProductLicenseInfo = {
  ...licensedInfo,
  status: "未授权",
  time: "暂无信息",
  create_time: "暂无信息",
  auth_state: "unauthorized",
  user_count: null,
  thread_count: null,
  user_desc: null,
  license_version: null,
  device_serial: null,
  message: "产品尚未授权",
};

const { licenseInfo } = vi.hoisted(() => ({
  licenseInfo: { current: null as ProductLicenseInfo | null },
}));

vi.mock("@/app/(dashboard)/hooks/productLicense/useProductLicenseInfo", () => ({
  useProductLicenseInfo: () => ({
    data: licenseInfo.current,
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/lib/http/productLicense", () => ({
  downloadProductLicenseRequest: vi.fn(),
  importProductLicense: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), fromError: vi.fn() },
}));

vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return { ...actual, getProxyBaseUrl: () => "" };
});

const consoleLink = () => screen.queryByRole("link", { name: "登录管理控制台" });

describe("ProductLicensePanel console entry", () => {
  it("sends the operator to the login page with a return path once licensed", () => {
    licenseInfo.current = licensedInfo;
    renderWithProviders(<ProductLicensePanel standalone />);

    const link = consoleLink();
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute("href")).toBe("/ui/login/?redirect_to=%2Fui%2F&force_login=1");
  });

  it("hides the console entry before the product is licensed", () => {
    licenseInfo.current = unlicensedInfo;
    renderWithProviders(<ProductLicensePanel standalone />);

    expect(consoleLink()).not.toBeInTheDocument();
  });

  it("keeps the console entry out of the license details view", () => {
    licenseInfo.current = licensedInfo;
    renderWithProviders(<ProductLicensePanel />);

    expect(consoleLink()).not.toBeInTheDocument();
  });
});
