import { describe, expect, it } from "vitest";

import type { ProductLicenseInfo } from "@/lib/http/productLicense";
import { buildLicenseRows, formatLicenseValue } from "./productLicenseRows";

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
  it("shows every authorization field in display order", () => {
    const rows = buildLicenseRows(licenseInfo);
    expect(rows.map((row) => row.label)).toEqual([
      "产品名称",
      "产品版本",
      "机器码",
      "设备序列号",
      "授权状态",
      "有效期",
      "授权日期",
      "授权版本",
      "授权用户数",
      "授权线程数",
      "用户描述",
      "授权文件",
    ]);
    expect(rows.find((row) => row.label === "机器码")?.value).toBe("0000-0000-0000-0000");
    expect(rows.find((row) => row.label === "设备序列号")?.value).toBe("DEV-0001");
    expect(rows.find((row) => row.label === "有效期")?.value).toBe("长期有效");
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
