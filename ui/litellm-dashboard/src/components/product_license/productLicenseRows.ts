import i18n from "@/lib/i18n";
import type { ProductLicenseInfo } from "@/lib/http/productLicense";

export interface LicenseRow {
  label: string;
  value: string;
}

export type LicenseTerm = "permanent" | "temporary" | "unknown";

const PERMANENT_TIME_TEXT = "长期有效";
const UNKNOWN_TIME_TEXT = "暂无信息";

export const formatLicenseValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "暂无信息";
  }
  return String(value);
};

// The proxy renders a permanent license's `time` as "长期有效" (t_start == t_end);
// a temporary one renders the start/end range instead.
export const licenseTermOf = (info: Pick<ProductLicenseInfo, "auth_state" | "time">): LicenseTerm => {
  if (info.auth_state !== "authorized" || info.time === UNKNOWN_TIME_TEXT || info.time === "") {
    return "unknown";
  }
  return info.time === PERMANENT_TIME_TEXT ? "permanent" : "temporary";
};

const licenseTermLabel = (term: LicenseTerm): string => {
  if (term === "permanent") {
    return i18n.t("productLicense.licenseTypePermanent", { defaultValue: "Permanent" });
  }
  if (term === "temporary") {
    return i18n.t("productLicense.licenseTypeTemporary", { defaultValue: "Temporary" });
  }
  return formatLicenseValue(null);
};

export const buildLicenseRows = (info: ProductLicenseInfo): LicenseRow[] => [
  { label: "机器码", value: formatLicenseValue(info.machine_code) },
  ...(info.device_serial ? [{ label: "设备序列号", value: formatLicenseValue(info.device_serial) }] : []),
  {
    label: i18n.t("productLicense.licenseTypeLabel", { defaultValue: "License type" }),
    value: licenseTermLabel(licenseTermOf(info)),
  },
  { label: "有效期", value: formatLicenseValue(info.time) },
  { label: "授权日期", value: formatLicenseValue(info.create_time) },
  { label: "授权版本", value: formatLicenseValue(info.license_version) },
  { label: "授权用户数", value: formatLicenseValue(info.user_count) },
  { label: "授权线程数", value: formatLicenseValue(info.thread_count) },
  { label: "用户描述", value: formatLicenseValue(info.user_desc) },
];
