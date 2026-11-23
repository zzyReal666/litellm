import i18n from "@/lib/i18n";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ProductLicenseInfo } from "@/lib/http/productLicense";
import { buildLicenseRows, formatLicenseValue, licenseTermOf } from "./productLicenseRows";

const licenseInfo: ProductLicenseInfo = {
  product_name: "AI Token网关",
  product_version: "1.2.3",
  serial_number: "AAAA-BBBB-CCCC-DDDD",
  status: "正式授权",
  time: "长期有效",
  create_time: "2026-01-01 00:00:00",
  auth_state: "authorized",
  machine_code: "0000-0000-0000-0000",
  device_serial: "DEV-0001",
  user_count: 100,
  thread_count: 50,
  user_desc: "授权用户",
  license_version: 1,
  native_available: true,
  license_file: "/app/data/product_license.lic",
  message: "授权有效",
};

describe("formatLicenseValue", () => {
  it("formats empty values as 暂无信息", () => {
    expect(formatLicenseValue(null)).toBe("暂无信息");
    expect(formatLicenseValue(undefined)).toBe("暂无信息");
    expect(formatLicenseValue("")).toBe("暂无信息");
  });

  it("stringifies numbers", () => {
    expect(formatLicenseValue(0)).toBe("0");
    expect(formatLicenseValue(100)).toBe("100");
  });
});

describe("buildLicenseRows", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("lists each distinct licence fact once, in display order", () => {
    const labels = buildLicenseRows(licenseInfo).map((row) => row.label);
    expect(labels).toEqual([
      "机器码",
      "设备序列号",
      "授权类型",
      "有效期",
      "授权日期",
      "授权版本",
      "授权用户数",
      "授权线程数",
      "用户描述",
    ]);
  });

  it("does not repeat facts already shown in the page header and status badge", () => {
    const labels = buildLicenseRows(licenseInfo).map((row) => row.label);
    expect(labels).not.toContain("产品名称");
    expect(labels).not.toContain("产品版本");
    expect(labels).not.toContain("授权状态");
  });

  it("never renders the licence file or its path", () => {
    const values = buildLicenseRows(licenseInfo).map((row) => row.value);
    expect(buildLicenseRows(licenseInfo).map((row) => row.label)).not.toContain("授权文件");
    expect(values.join(" ")).not.toContain(licenseInfo.license_file);
  });

  it("distinguishes a permanent licence from a temporary one", () => {
    expect(licenseTermOf(licenseInfo)).toBe("permanent");
    expect(buildLicenseRows(licenseInfo).find((row) => row.label === "授权类型")?.value).toBe("永久授权");

    const temporary: ProductLicenseInfo = {
      ...licenseInfo,
      time: "2026-01-01 00:00:00 至 2027-01-01 00:00:00",
    };
    expect(licenseTermOf(temporary)).toBe("temporary");
    expect(buildLicenseRows(temporary).find((row) => row.label === "授权类型")?.value).toBe("临时授权");
  });

  it("does not claim a licence term before the product is authorized", () => {
    const unauthorized: ProductLicenseInfo = {
      ...licenseInfo,
      auth_state: "unauthorized",
      time: "暂无信息",
    };
    expect(licenseTermOf(unauthorized)).toBe("unknown");
    expect(buildLicenseRows(unauthorized).find((row) => row.label === "授权类型")?.value).toBe("暂无信息");
  });

  it("falls back to 暂无信息 for missing optional fields", () => {
    const partiallyLicensed: ProductLicenseInfo = {
      ...licenseInfo,
      user_desc: null,
      user_count: null,
      license_version: null,
    };
    const rows = buildLicenseRows(partiallyLicensed);
    expect(rows.find((row) => row.label === "用户描述")?.value).toBe("暂无信息");
    expect(rows.find((row) => row.label === "授权用户数")?.value).toBe("暂无信息");
    expect(rows.find((row) => row.label === "授权版本")?.value).toBe("暂无信息");
  });
});

describe("buildLicenseRows device serial", () => {
  it("omits the device serial row when the license carries none", () => {
    const rows = buildLicenseRows({ ...licenseInfo, device_serial: null });
    expect(rows.map((row) => row.label)).not.toContain("设备序列号");
    expect(rows.map((row) => row.label)).toEqual(expect.arrayContaining(["机器码"]));
  });

  it("shows the device serial from the license when present", () => {
    const rows = buildLicenseRows({ ...licenseInfo, device_serial: "DEV-0001" });
    const row = rows.find((item) => item.label === "设备序列号");
    expect(row?.value).toBe("DEV-0001");
  });
});
