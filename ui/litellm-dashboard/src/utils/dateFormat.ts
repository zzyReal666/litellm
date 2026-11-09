import i18n from "@/lib/i18n";

const isChinese = () => (i18n.language || "zh-CN").toLowerCase().startsWith("zh");

const pad = (value: number): string => String(value).padStart(2, "0");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const formatDateTime = (value: string | number | Date | null | undefined): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (isChinese()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const formatDateOnly = (value: string | number | Date | null | undefined): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (isChinese()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export const formatShortDay = (value: string | number | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  if (isChinese()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
};

export const formatTableDateTime = (value: string | number | Date): string | null => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (isChinese()) return formatDateTime(date);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
