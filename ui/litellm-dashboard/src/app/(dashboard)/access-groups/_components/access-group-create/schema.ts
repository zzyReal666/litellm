import type { TFunction } from "i18next";
import { z } from "zod/v4";

export const getAccessGroupCreateSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .refine(
        (value) => value.trim() !== "",
        t("accessGroups.accessGroupBaseForm.nameRequired", { defaultValue: "Please enter the access group name" }),
      ),
    description: z.string(),
    modelIds: z.array(z.string()),
    mcpServerIds: z.array(z.string()),
    agentIds: z.array(z.string()),
  });

export type AccessGroupCreateFormValues = z.output<ReturnType<typeof getAccessGroupCreateSchema>>;
