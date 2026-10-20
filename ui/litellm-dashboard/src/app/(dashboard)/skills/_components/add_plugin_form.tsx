import React, { useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { CircleHelp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { toast } from "@/lib/toast";
import { registerClaudeCodePlugin } from "@/components/networking";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import {
  validatePluginName,
  isValidSemanticVersion,
  isValidEmail,
  parseKeywords,
  parseSkillSource,
  isValidSubPath,
  isValidSha256,
  SkillSourcePreview,
} from "@/components/claude_code_plugins/helpers";
import { PluginAuthor, PluginSource, SkillRegisterRequest } from "@/components/claude_code_plugins/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddPluginFormProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

const addPluginShape = (t: TFunction) => ({
  skillUrl: z.string().min(
    1,
    t("claudeCodePluginsPage.addPluginForm.sourceUrlRequired", {
      defaultValue: "Please enter a repository or zip archive URL",
    }),
  ),
  subPath: z.string().refine(
    (value) => !value || isValidSubPath(value),
    t("claudeCodePluginsPage.addPluginForm.subPathInvalid", {
      defaultValue:
        "Subfolder must be a relative path like plugins/my-skill (letters, numbers, dots, hyphens, underscores)",
    }),
  ),
  sha256: z.string().refine(
    isValidSha256,
    t("claudeCodePluginsPage.addPluginForm.sha256Invalid", {
      defaultValue: "SHA-256 must be a 64-character hex digest",
    }),
  ),
  name: z
    .string()
    .min(1, t("claudeCodePluginsPage.addPluginForm.skillNameRequired", { defaultValue: "Please enter skill name" }))
    .regex(
      /^[a-z0-9-]+$/,
      t("claudeCodePluginsPage.addPluginForm.skillNamePattern", {
        defaultValue: "Name must be kebab-case (lowercase, numbers, hyphens only)",
      }),
    ),
  domain: z.string(),
  namespace: z.string(),
  description: z.string(),
  category: z.string().nullable(),
  keywords: z.string(),
  version: z.string(),
  authorName: z.string(),
  authorEmail: z
    .string()
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      t("claudeCodePluginsPage.addPluginForm.authorEmailRule", { defaultValue: "Please enter a valid email" }),
    ),
});

const addPluginSchema = (t: TFunction) => z.object(addPluginShape(t));

type AddPluginFormValues = z.infer<ReturnType<typeof addPluginSchema>>;

const EMPTY_VALUES: AddPluginFormValues = {
  skillUrl: "",
  subPath: "",
  sha256: "",
  name: "",
  domain: "",
  namespace: "",
  description: "",
  category: null,
  keywords: "",
  version: "",
  authorName: "",
  authorEmail: "",
};

const buildAuthor = (values: AddPluginFormValues): PluginAuthor | undefined => {
  const name = values.authorName.trim();
  const email = values.authorEmail.trim();
  if (!name) {
    return undefined;
  }
  return email ? { name, email } : { name };
};

const archiveUrlOf = (preview: SkillSourcePreview | null): string | undefined =>
  preview?.parsed.source === "archive" ? preview.parsed.url : undefined;

const withArchiveDigest = (source: PluginSource, sha256: string): PluginSource => {
  const digest = sha256.trim();
  return source.source === "archive" && digest ? { ...source, sha256: digest.toLowerCase() } : source;
};

const buildRegisterRequest = (values: AddPluginFormValues, source: PluginSource): SkillRegisterRequest => {
  const author = buildAuthor(values);
  return {
    name: values.name.trim(),
    source: withArchiveDigest(source, values.sha256),
    ...(values.version ? { version: values.version.trim() } : {}),
    ...(values.description ? { description: values.description.trim() } : {}),
    ...(author ? { author } : {}),
    ...(values.category ? { category: values.category } : {}),
    ...(values.keywords ? { keywords: parseKeywords(values.keywords) } : {}),
    ...(values.domain ? { domain: values.domain.trim() } : {}),
    ...(values.namespace ? { namespace: values.namespace.trim() } : {}),
  };
};

const PREDEFINED_CATEGORIES = [
  "Development",
  "Productivity",
  "Learning",
  "Security",
  "Data & Analytics",
  "Integration",
  "Testing",
  "Documentation",
];

const SUB_PATH_LOCK_REASON = (t: TFunction) =>
  ({
    "git-subdir": t("claudeCodePluginsPage.addPluginForm.subPathLockGitSubdir", {
      defaultValue: "The URL already points to a subfolder, so this field is disabled",
    }),
    archive: t("claudeCodePluginsPage.addPluginForm.subPathLockArchive", {
      defaultValue: "A zip archive is installed as a whole, so this field is disabled",
    }),
  }) as const;

type SubPathLock = keyof ReturnType<typeof SUB_PATH_LOCK_REASON>;

const subPathLockFor = (source: PluginSource["source"] | undefined): SubPathLock | null =>
  source === "git-subdir" || source === "archive" ? source : null;

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

const AddPluginForm: React.FC<AddPluginFormProps> = ({ visible, onClose, accessToken, onSuccess }) => {
  const { t } = useTranslation();
  const form = useZodForm(
    useMemo(() => addPluginSchema(t), [t]),
    { defaultValues: EMPTY_VALUES },
  );
  const subPathLockReason = SUB_PATH_LOCK_REASON(t);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlPreview, setUrlPreview] = useState<SkillSourcePreview | null>(null);
  const [subPathLock, setSubPathLock] = useState<SubPathLock | null>(null);

  const recomputePreview = (skillUrl: string, subPath: string) => {
    const lock = subPathLockFor(parseSkillSource(skillUrl)?.parsed.source);
    setSubPathLock(lock);
    if (lock && form.getValues("subPath")) {
      form.setValue("subPath", "");
    }
    const preview = parseSkillSource(skillUrl, lock ? undefined : subPath);
    if (archiveUrlOf(preview) !== archiveUrlOf(urlPreview) && form.getValues("sha256")) {
      form.setValue("sha256", "");
    }
    setUrlPreview(preview);
    if (preview && !form.getValues("name")) {
      form.setValue("name", preview.suggestedName);
    }
  };

  const handleSubmit = async (values: AddPluginFormValues) => {
    if (!accessToken) {
      toast.error(t("ssoModals.noAccessToken", { defaultValue: "No access token available" }));
      return;
    }

    if (!urlPreview) {
      toast.error(
        t("claudeCodePluginsPage.addPluginForm.sourceUrlInvalid", {
          defaultValue: "Please enter a valid repository or zip archive URL",
        }),
      );
      return;
    }

    if (!validatePluginName(values.name)) {
      toast.error(
        t("claudeCodePluginsPage.addPluginForm.invalidSkillName", {
          defaultValue: "Skill name must be kebab-case (lowercase letters, numbers, and hyphens only)",
        }),
      );
      return;
    }

    if (values.version && !isValidSemanticVersion(values.version)) {
      toast.error(
        t("claudeCodePluginsPage.addPluginForm.invalidVersion", {
          defaultValue: "Version must be in semantic versioning format (e.g., 1.0.0)",
        }),
      );
      return;
    }

    if (values.authorEmail && !isValidEmail(values.authorEmail)) {
      toast.error(t("claudeCodePluginsPage.addPluginForm.invalidEmail", { defaultValue: "Invalid email format" }));
      return;
    }

    setIsSubmitting(true);
    try {
      await registerClaudeCodePlugin(accessToken, buildRegisterRequest(values, urlPreview.parsed));
      toast.success(
        t("claudeCodePluginsPage.addPluginForm.registerSuccess", { defaultValue: "Skill registered successfully" }),
      );
      form.reset(EMPTY_VALUES);
      setUrlPreview(null);
      setSubPathLock(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error registering skill:", error);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("claudeCodePluginsPage.addPluginForm.registerFailed", { defaultValue: "Failed to register skill" }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset(EMPTY_VALUES);
    setUrlPreview(null);
    setSubPathLock(null);
    onClose();
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="top-8 max-h-[calc(100dvh-4rem)] translate-y-0 overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {t("claudeCodePluginsPage.addPluginForm.modalTitle", { defaultValue: "Add New Skill" })}
          </DialogTitle>
        </DialogHeader>
        <TooltipProvider>
          <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="mt-4">
            <FieldGroup>
              <FormField
                control={form.control}
                name="skillUrl"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.sourceUrlLabel", { defaultValue: "Source URL" }),
                  t("claudeCodePluginsPage.addPluginForm.sourceUrlTooltip", {
                    defaultValue:
                      "Paste an HTTPS git repository URL from GitHub, GitLab, Bitbucket, or a self-hosted host (e.g. github.com/org/repo or github.com/org/repo/tree/main/my-skill), or an HTTPS link to a .zip archive of the skill hosted on S3 or any static file server.",
                  }),
                )}
              >
                {({ ref, onChange, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("claudeCodePluginsPage.addPluginForm.sourceUrlPlaceholder", {
                      defaultValue: "https://github.com/org/repo or https://bucket.s3.amazonaws.com/my-skill.zip",
                    })}
                    className="rounded-lg"
                    onChange={(event) => {
                      onChange(event);
                      recomputePreview(event.target.value, form.getValues("subPath"));
                    }}
                  />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="subPath"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.subPathLabel", { defaultValue: "Subfolder path (Optional)" }),
                  t("claudeCodePluginsPage.addPluginForm.subPathTooltip", {
                    defaultValue:
                      "Path within the repository where the skill lives (e.g., plugins/my-skill). Leave empty if the skill is at the repo root.",
                  }),
                )}
                description={subPathLock ? subPathLockReason[subPathLock] : undefined}
              >
                {({ ref, onChange, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("claudeCodePluginsPage.addPluginForm.subPathPlaceholder", {
                      defaultValue: "plugins/my-skill",
                    })}
                    className="rounded-lg"
                    onChange={(event) => {
                      onChange(event);
                      recomputePreview(form.getValues("skillUrl"), event.target.value);
                    }}
                    disabled={subPathLock !== null}
                  />
                )}
              </FormField>

              {urlPreview?.parsed.source === "archive" && (
                <FormField
                  control={form.control}
                  name="sha256"
                  label={labelWithHint(
                    t("claudeCodePluginsPage.addPluginForm.sha256Label", {
                      defaultValue: "Archive SHA-256 (Optional)",
                    }),
                    t("claudeCodePluginsPage.addPluginForm.sha256Tooltip", {
                      defaultValue:
                        "Hex digest of the zip file. Claude Code refuses to install the archive if its checksum does not match.",
                    }),
                  )}
                >
                  {({ ref, ...field }) => (
                    <Input
                      {...field}
                      ref={ref}
                      placeholder={t("claudeCodePluginsPage.addPluginForm.sha256Placeholder", {
                        defaultValue: "64 hex characters",
                      })}
                      className="rounded-lg font-mono"
                    />
                  )}
                </FormField>
              )}

              {urlPreview && (
                <div className="rounded-lg border border-info/20 bg-info/10 px-3 py-2 text-sm text-info">
                  {t("claudeCodePluginsPage.addPluginForm.detected", {
                    label: urlPreview.label,
                    defaultValue: "Detected: {{label}}",
                  })}
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.skillNameLabel", { defaultValue: "Skill Name" }),
                  t("claudeCodePluginsPage.addPluginForm.skillNameTooltip", {
                    defaultValue: "Unique identifier in kebab-case format (e.g., my-skill)",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("claudeCodePluginsPage.addPluginForm.namePlaceholder", { defaultValue: "my-skill" })}
                    className="rounded-lg"
                  />
                )}
              </FormField>

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="domain"
                  label={labelWithHint(
                    t("claudeCodePluginsPage.addPluginForm.domainLabel", { defaultValue: "Domain (Optional)" }),
                    t("claudeCodePluginsPage.addPluginForm.domainTooltip", {
                      defaultValue: "Top-level grouping in the Skill Hub (e.g., Productivity)",
                    }),
                  )}
                  className="flex-1"
                >
                  {({ ref, ...field }) => (
                    <Input
                      {...field}
                      ref={ref}
                      placeholder={t("claudeCodePluginsPage.addPluginForm.domainPlaceholder", {
                        defaultValue: "Productivity",
                      })}
                      className="rounded-lg"
                    />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="namespace"
                  label={labelWithHint(
                    t("claudeCodePluginsPage.addPluginForm.namespaceLabel", { defaultValue: "Namespace (Optional)" }),
                    t("claudeCodePluginsPage.addPluginForm.namespaceTooltip", {
                      defaultValue: "Sub-grouping within domain (e.g., workflows)",
                    }),
                  )}
                  className="flex-1"
                >
                  {({ ref, ...field }) => (
                    <Input
                      {...field}
                      ref={ref}
                      placeholder={t("claudeCodePluginsPage.addPluginForm.namespacePlaceholder", {
                        defaultValue: "workflows",
                      })}
                      className="rounded-lg"
                    />
                  )}
                </FormField>
              </div>

              <FormField
                control={form.control}
                name="description"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.descriptionLabel", { defaultValue: "Description (Optional)" }),
                  t("claudeCodePluginsPage.addPluginForm.descriptionTooltip", {
                    defaultValue: "Brief description of what the skill does",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Textarea
                    {...field}
                    ref={ref}
                    rows={3}
                    placeholder={t("claudeCodePluginsPage.addPluginForm.descriptionPlaceholder", {
                      defaultValue: "A skill that helps with...",
                    })}
                    maxLength={500}
                    className="rounded-lg"
                  />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="category"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.categoryLabel", { defaultValue: "Category (Optional)" }),
                  t("claudeCodePluginsPage.addPluginForm.categoryTooltip", {
                    defaultValue: "Select a category or enter a custom one",
                  }),
                )}
              >
                {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                  <Combobox items={PREDEFINED_CATEGORIES} value={value} onValueChange={onChange}>
                    <ComboboxInput
                      id={id}
                      aria-invalid={ariaInvalid}
                      aria-describedby={ariaDescribedBy}
                      placeholder={t("claudeCodePluginsPage.addPluginForm.categoryPlaceholder", {
                        defaultValue: "Select or type a category",
                      })}
                      className="w-full rounded-lg"
                      showClear={value != null && value !== ""}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>
                        {t("guardrails.piiComponents.noMatchingCategories", { defaultValue: "No matching categories" })}
                      </ComboboxEmpty>
                      <ComboboxList>
                        {(category: string) => (
                          <ComboboxItem key={category} value={category}>
                            {category}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )}
              </FormField>

              <FormField
                control={form.control}
                name="keywords"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.keywordsLabel", { defaultValue: "Keywords (Optional)" }),
                  t("claudeCodePluginsPage.addPluginForm.keywordsTooltip", {
                    defaultValue: "Comma-separated list of keywords for search",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("claudeCodePluginsPage.addPluginForm.keywordsPlaceholder", {
                      defaultValue: "search, web, api",
                    })}
                    className="rounded-lg"
                  />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="version"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.versionLabel", { defaultValue: "Version (Optional)" }),
                  t("claudeCodePluginsPage.addPluginForm.versionTooltip", {
                    defaultValue: "Semantic version (e.g., 1.0.0)",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("claudeCodePluginsPage.addPluginForm.versionPlaceholder", { defaultValue: "1.0.0" })}
                    className="rounded-lg"
                  />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="authorName"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.authorNameLabel", { defaultValue: "Author Name (Optional)" }),
                  t("claudeCodePluginsPage.addPluginForm.authorNameTooltip", {
                    defaultValue: "Name of the skill author or organization",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("claudeCodePluginsPage.addPluginForm.authorNamePlaceholder", {
                      defaultValue: "Your Name or Organization",
                    })}
                    className="rounded-lg"
                  />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="authorEmail"
                label={labelWithHint(
                  t("claudeCodePluginsPage.addPluginForm.authorEmailLabel", {
                    defaultValue: "Author Email (Optional)",
                  }),
                  t("claudeCodePluginsPage.addPluginForm.authorEmailTooltip", {
                    defaultValue: "Contact email for the skill author",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    type="email"
                    placeholder={t("claudeCodePluginsPage.addPluginForm.authorEmailPlaceholder", {
                      defaultValue: "author@example.com",
                    })}
                    className="rounded-lg"
                  />
                )}
              </FormField>
            </FieldGroup>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting && <UiLoadingSpinner className="size-4" />}
                {isSubmitting
                  ? t("claudeCodePluginsPage.addPluginForm.adding", { defaultValue: "Adding..." })
                  : t("claudeCodePluginsPage.addPluginForm.addSkill", { defaultValue: "Add Skill" })}
              </Button>
            </div>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

export default AddPluginForm;
