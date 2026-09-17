import { z } from "zod/v4";

import i18n from "@/lib/i18n";

export const ALL_TEAM_MODELS = "all-team-models";

const repeatsEarlierValue = (values: readonly string[], index: number): boolean =>
  values[index] !== "" && values.indexOf(values[index]) !== index;

const modelLimitSchema = z.object({
  model: z.string().min(1, {
    error: () => i18n.t("projects.projectBaseForm.missingModel", { defaultValue: "Missing model" }),
  }),
  tpm: z.number().optional(),
  rpm: z.number().optional(),
  itpm: z.number().optional(),
  otpm: z.number().optional(),
});

export const projectFormSchema = z
  .object({
    project_alias: z.string().min(1, {
      error: () =>
        i18n.t("projects.projectBaseForm.projectNameRequired", { defaultValue: "Please enter a project name" }),
    }),
    team_id: z
      .string()
      .nullable()
      .pipe(
        z
          .string({
            error: () => i18n.t("projects.projectBaseForm.teamRequired", { defaultValue: "Please select a team" }),
          })
          .min(1, {
            error: () => i18n.t("projects.projectBaseForm.teamRequired", { defaultValue: "Please select a team" }),
          }),
      ),
    description: z.string().optional(),
    models: z.array(z.string()),
    max_budget: z.number().nullish(),
    isBlocked: z.boolean(),
    guardrails: z.array(z.string()).optional(),
    modelLimits: z.array(modelLimitSchema).optional(),
    metadata: z
      .array(
        z.object({
          key: z.string().min(1, {
            error: () => i18n.t("projects.projectBaseForm.missingKey", { defaultValue: "Missing key" }),
          }),
          value: z.string().min(1, {
            error: () => i18n.t("projects.projectBaseForm.missingValue", { defaultValue: "Missing value" }),
          }),
        }),
      )
      .optional(),
  })
  .superRefine((values, ctx) => {
    const models = (values.modelLimits ?? []).map((entry) => entry.model);
    models.forEach((_, index) => {
      if (repeatsEarlierValue(models, index)) {
        ctx.addIssue({
          code: "custom",
          message: i18n.t("projects.projectBaseForm.duplicateModel", { defaultValue: "Duplicate model" }),
          path: ["modelLimits", index, "model"],
        });
      }
    });

    const keys = (values.metadata ?? []).map((entry) => entry.key);
    keys.forEach((_, index) => {
      if (repeatsEarlierValue(keys, index)) {
        ctx.addIssue({
          code: "custom",
          message: i18n.t("projects.projectBaseForm.duplicateKey", { defaultValue: "Duplicate key" }),
          path: ["metadata", index, "key"],
        });
      }
    });
  });

export type ProjectFormValues = z.input<typeof projectFormSchema>;
export type ProjectSubmitValues = z.output<typeof projectFormSchema>;

export const emptyProjectFormValues: ProjectFormValues = {
  project_alias: "",
  team_id: null,
  description: undefined,
  models: [],
  max_budget: undefined,
  isBlocked: false,
  guardrails: undefined,
  modelLimits: undefined,
  metadata: undefined,
};
