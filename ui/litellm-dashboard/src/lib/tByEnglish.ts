import type { TFunction } from "i18next";
import en from "@/locales/en.json";

type Catalog = Record<string, unknown>;

const flatten = (source: Catalog, prefix = ""): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") {
      Object.assign(out, flatten(value as Catalog, path));
    } else if (typeof value === "string") {
      out[path] = value;
    }
  }
  return out;
};

const EN_TO_KEY: Record<string, string> = Object.entries(flatten(en as Catalog)).reduce<Record<string, string>>(
  (acc, [key, text]) => {
    if (!(text in acc)) {
      acc[text] = key;
    }
    return acc;
  },
  {},
);

export const tByEnglish = (t: TFunction, text: string): string => {
  const key = EN_TO_KEY[text];
  return key ? t(key, { defaultValue: text }) : text;
};
