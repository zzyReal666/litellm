import type { ProductLicenseInfo } from "@/lib/http/productLicense";

export interface LicenseRow {
  label: string;
  value: string;
}

export const formatLicenseValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "暂无信息";
  }
  return String(value);
};

export const buildLicenseRows = (info: ProductLicenseInfo): LicenseRow[] => [
  { label: "产品名称", value: formatLicenseValue(info.product_name) },
  { label: "产品版本", value: formatLicenseValue(info.product_version) },
  { label: "产品序列号", value: formatLicenseValue(info.serial_number) },
  { label: "机器码", value: formatLicenseValue(info.machine_code) },
  { label: "授权状态", value: formatLicenseValue(info.status) },
  { label: "有效期", value: formatLicenseValue(info.time) },
  { label: "授权日期", value: formatLicenseValue(info.create_time) },
  { label: "授权版本", value: formatLicenseValue(info.license_version) },
  { label: "授权用户数", value: formatLicenseValue(info.user_count) },
  { label: "授权线程数", value: formatLicenseValue(info.thread_count) },
  { label: "用户描述", value: formatLicenseValue(info.user_desc) },
  { label: "授权文件", value: formatLicenseValue(info.license_file) },
];
