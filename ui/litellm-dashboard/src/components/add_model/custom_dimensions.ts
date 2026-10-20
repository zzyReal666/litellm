import type { TFunction } from "i18next";
import { z } from "zod";
import i18n from "@/lib/i18n";
import { DIMENSION_LABELS } from "./heuristic_scoring_knobs";

const customDimensionShape = {
  name: z.string(),
  weight: z.number(),
  keywords: z.array(z.string()).optional(),
  patterns: z.array(z.string()).optional(),
  scoring_mode: z.enum(["binary", "match_count"]).optional(),
};
const customDimensionSchema = z.object(customDimensionShape);

export type CustomDimension = z.infer<typeof customDimensionSchema>;
export type CustomDimensionRow = CustomDimension & { id: string };

export const hydrateCustomDimensions = (raw: unknown): CustomDimensionRow[] | undefined => {
  if (raw === undefined) return undefined;
  const parsed = z.array(customDimensionSchema).safeParse(raw);
  return parsed.success ? parsed.data.map((row, index) => ({ ...row, id: `stored-${index}` })) : undefined;
};

export const serializeCustomDimensions = (rows: CustomDimensionRow[]): CustomDimension[] =>
  rows.map(({ id: _id, ...dimension }) => dimension);

export const customDimensionsError = (
  rows: CustomDimensionRow[] | undefined,
  builtinNames: string[] = Object.keys(DIMENSION_LABELS),
  t: TFunction = i18n.t,
): string | null => {
  if (!rows) return null;
  if (rows.length > 16)
    return t("addModel.customDimensions.tooManyDimensions", {
      defaultValue: "A router can have at most 16 custom dimensions",
    });
  const names = rows.map((row) => row.name.toLowerCase());
  for (const [index, row] of rows.entries()) {
    const dimensionIndex = index + 1;
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(row.name))
      return t("addModel.customDimensions.nameInvalid", {
        defaultValue:
          "Custom dimension {{index}}: use a name starting with a letter, followed by letters, numbers or underscores (64 characters max)",
        index: dimensionIndex,
      });
    if (builtinNames.some((name) => name.toLowerCase() === row.name.toLowerCase()))
      return t("addModel.customDimensions.nameConflictsWithBuiltIn", {
        defaultValue: "Custom dimension {{index}}: choose a name that is not already a built-in weight",
        index: dimensionIndex,
      });
    if (names.indexOf(row.name.toLowerCase()) !== index)
      return t("addModel.customDimensions.nameDuplicated", {
        defaultValue: "Custom dimension {{index}}: names must be unique",
        index: dimensionIndex,
      });
    if (!Number.isFinite(row.weight) || row.weight <= 0 || row.weight > 1)
      return t("addModel.customDimensions.weightOutOfRange", {
        defaultValue: "Custom dimension {{index}}: weight must be greater than 0 and at most 1",
        index: dimensionIndex,
      });
    const matchers = [...(row.keywords ?? []), ...(row.patterns ?? [])];
    if (!matchers.length || matchers.some((matcher) => !matcher.trim()))
      return t("addModel.customDimensions.matcherRequired", {
        defaultValue: "Custom dimension {{index}}: add at least one nonblank keyword or pattern",
        index: dimensionIndex,
      });
    if (
      matchers.length > 32 ||
      matchers.some((matcher) => [...matcher].length > 256) ||
      matchers.reduce((total, matcher) => total + [...matcher].length, 0) > 4096
    )
      return t("addModel.customDimensions.matcherLimitsExceeded", {
        defaultValue:
          "Custom dimension {{index}}: use at most 32 matchers, 256 characters each and 4096 characters combined",
        index: dimensionIndex,
      });
  }
  return null;
};
