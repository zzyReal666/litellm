import { z } from "zod";

export const MAX_RATE_LIMIT: number = Number.MAX_SAFE_INTEGER;

type TranslateOptions = { readonly defaultValue?: string; readonly max?: number };
type Translate = (key: string, options?: TranslateOptions) => string;
type TranslateSource = Translate | { readonly t: Translate };

const toTranslate = (source: TranslateSource): Translate =>
  typeof source === "function" ? source : (key, options) => source.t(key, options);

const messageFor = (source: TranslateSource): string =>
  toTranslate(source)("validation.rateLimitWholeNumber", {
    defaultValue: "Enter a non-negative whole number no greater than {{max}}",
    max: MAX_RATE_LIMIT,
  });

const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || String(value).trim() === "";

export const isValidRateLimitValue = (value: unknown): boolean => {
  if (isBlank(value)) {
    return true;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) && Number.isInteger(numeric) && numeric >= 0 && numeric <= MAX_RATE_LIMIT;
};

export const rateLimitField = (source: TranslateSource) => {
  const message = messageFor(source);
  return z
    .union([z.string(), z.number()])
    .nullish()
    .transform((value) =>
      value === undefined
        ? undefined
        : value === null || isBlank(value)
          ? null
          : Number(value),
    )
    .pipe(z.number({ error: message }).int(message).nonnegative(message).max(MAX_RATE_LIMIT, message).nullable().optional());
};

export const rateLimitInputField = (source: TranslateSource) => {
  const message = messageFor(source);
  return z
    .union([z.string(), z.number()])
    .nullish()
    .refine((value) => isValidRateLimitValue(value), { message });
};

export const boundedAmountField = (source: TranslateSource) => {
  const message = messageFor(source);
  return z
    .union([z.string(), z.number()])
    .nullish()
    .transform((value) =>
      value === undefined
        ? undefined
        : value === null || isBlank(value)
          ? null
          : Number(value),
    )
    .pipe(z.number({ error: message }).nonnegative(message).max(MAX_RATE_LIMIT, message).nullable().optional());
};

export const rateLimitValidator = (source: TranslateSource) => (value: unknown): true | string =>
  isValidRateLimitValue(value) ? true : messageFor(source);
