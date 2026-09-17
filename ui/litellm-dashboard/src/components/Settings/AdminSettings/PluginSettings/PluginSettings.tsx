"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { getConfigFieldSetting, updateConfigFieldSetting } from "@/components/networking";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import { pluginSchema, type PluginFormValues } from "./schema";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const INLINE_CODE_CLASS = "rounded-sm bg-muted px-1 py-0.5 font-mono text-xs";

interface Plugin {
  name: string;
  display_name: string;
  url: string;
  plugin_key?: string;
}

const BLANK_PLUGIN: PluginFormValues = { name: "", display_name: "", url: "", plugin_key: undefined };

export default function PluginSettings() {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const form = useZodForm(pluginSchema, { defaultValues: BLANK_PLUGIN });

  useEffect(() => {
    if (!accessToken) return;
    getConfigFieldSetting(accessToken, "plugins")
      .then((data) => {
        const val = data?.field_value;
        setPlugins(Array.isArray(val) ? val : []);
      })
      .catch(() => setPlugins([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const save = async (updated: Plugin[]) => {
    if (!accessToken) return;
    setSaving(true);
    try {
      await updateConfigFieldSetting(accessToken, "plugins", updated);
      setPlugins(updated);
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditingIndex(null);
    setKeyVisible(false);
    form.reset(BLANK_PLUGIN);
    setModalOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditingIndex(idx);
    setKeyVisible(false);
    // plugin_key arrives redacted ("***"); start it blank so an untouched save
    // keeps the stored credential instead of overwriting it with the placeholder.
    form.reset({ ...plugins[idx], plugin_key: "" });
    setModalOpen(true);
  };

  const handleDelete = (idx: number) => {
    const updated = plugins.filter((_, i) => i !== idx);
    save(updated);
  };

  const handleOk = async (values: PluginFormValues) => {
    const updated =
      editingIndex !== null ? plugins.map((p, i) => (i === editingIndex ? values : p)) : [...plugins, values];
    await save(updated);
    setModalOpen(false);
  };

  const renderRows = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="py-6 text-center">
            <UiLoadingSpinner className="mx-auto size-6 text-muted-foreground" />
          </TableCell>
        </TableRow>
      );
    }

    if (plugins.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
            {t("common.noData", { defaultValue: "No data" })}
          </TableCell>
        </TableRow>
      );
    }

    return plugins.map((plugin, idx) => (
      <TableRow key={plugin.name}>
        <TableCell>
          <code className={INLINE_CODE_CLASS}>{plugin.name}</code>
        </TableCell>
        <TableCell>{plugin.display_name}</TableCell>
        <TableCell>
          <a href={plugin.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {plugin.url}
          </a>
        </TableCell>
        <TableCell>
          {plugin.plugin_key ? (
            <code className={INLINE_CODE_CLASS}>{"•".repeat(8)}</code>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={t("settingsPages.pluginSettings.editAriaLabel", {
                defaultValue: "Edit {{name}}",
                name: plugin.name,
              })}
              onClick={() => openEdit(idx)}
            >
              <Pencil />
            </Button>
            <Button
              variant="destructive"
              size="icon-sm"
              aria-label={t("settingsPages.pluginSettings.deleteAriaLabel", {
                defaultValue: "Delete {{name}}",
                name: plugin.name,
              })}
              onClick={() => handleDelete(idx)}
            >
              <Trash2 />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <h4 className="text-base font-semibold text-foreground">
          {t("settingsPages.pluginSettings.cardTitle", { defaultValue: "Plugins" })}
        </h4>
        <p className="text-sm text-foreground">
          {t("settingsPages.pluginSettings.description", {
            defaultValue:
              "Register external services as plugins. Once added, users can toggle to the plugin from the mode switcher in the top-left of the sidebar.",
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          <Trans
            i18nKey="settingsPages.pluginSettings.manifestHint"
            defaults="Each plugin must expose <code>GET /api/plugin-manifest</code> returning nav items and capabilities."
            components={{ code: <code className={INLINE_CODE_CLASS} /> }}
          />
        </p>
      </CardHeader>
      <CardContent>
        <Button className="mb-4" onClick={openAdd}>
          <Plus />
          {t("settingsPages.pluginSettings.addPlugin", { defaultValue: "Add Plugin" })}
        </Button>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name", { defaultValue: "Name" })}</TableHead>
              <TableHead>{t("settingsPages.pluginSettings.displayName", { defaultValue: "Display Name" })}</TableHead>
              <TableHead>{t("settingsPages.pluginSettings.urlColumn", { defaultValue: "URL" })}</TableHead>
              <TableHead>{t("settingsPages.pluginSettings.pluginKey", { defaultValue: "Plugin Key" })}</TableHead>
              <TableHead>{t("common.actions", { defaultValue: "Actions" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows()}</TableBody>
        </Table>
      </CardContent>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null
                ? t("settingsPages.pluginSettings.editPlugin", { defaultValue: "Edit Plugin" })
                : t("settingsPages.pluginSettings.addPlugin", { defaultValue: "Add Plugin" })}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => event.preventDefault()} noValidate style={{ marginTop: 16 }}>
            <FieldGroup>
              <FormField
                control={form.control}
                name="name"
                label={t("settingsPages.pluginSettings.nameLabel", { defaultValue: "Name (identifier)" })}
                description={t("settingsPages.pluginSettings.nameDescription", {
                  defaultValue: "Used in URLs and config. No spaces. E.g. litellm-platform-plugin",
                })}
              >
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="litellm-platform-plugin" />}
              </FormField>
              <FormField
                control={form.control}
                name="display_name"
                label={t("settingsPages.pluginSettings.displayName", { defaultValue: "Display Name" })}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("settingsPages.pluginSettings.displayNamePlaceholder", {
                      defaultValue: "Agent Control Plane",
                    })}
                  />
                )}
              </FormField>
              <FormField
                control={form.control}
                name="url"
                label={t("settingsPages.pluginSettings.urlColumn", { defaultValue: "URL" })}
                description={t("settingsPages.pluginSettings.urlDescription", {
                  defaultValue: "Base URL of the plugin service",
                })}
              >
                {({ ref, ...field }) => <Input {...field} ref={ref} placeholder="https://your-plugin.example.com" />}
              </FormField>
              <FormField
                control={form.control}
                name="plugin_key"
                label={t("settingsPages.pluginSettings.pluginKey", { defaultValue: "Plugin Key" })}
                description={t("settingsPages.pluginSettings.pluginKeyDescription", {
                  defaultValue:
                    "Optional. The plugin's own credential, injected as Authorization: Bearer <key> only when litellm reverse-proxies API calls to the plugin's backend (/plugin-proxy/<name>/*). Leave blank for plugins that use the forwarded litellm user token (e.g. iframe plugins) — that path uses the user's token, not this key.",
                })}
              >
                {({ ref, ...field }) => (
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      ref={ref}
                      type={keyVisible ? "text" : "password"}
                      value={field.value ?? ""}
                      placeholder={
                        editingIndex !== null
                          ? t("settingsPages.pluginSettings.keyPlaceholderEdit", {
                              defaultValue: "Leave blank to keep current key",
                            })
                          : t("settingsPages.pluginSettings.keyPlaceholderCreate", {
                              defaultValue: "sk-... (optional)",
                            })
                      }
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        onClick={() => setKeyVisible(!keyVisible)}
                        aria-label={
                          keyVisible
                            ? t("settingsPages.pluginSettings.hideKeyAriaLabel", { defaultValue: "Hide plugin key" })
                            : t("settingsPages.pluginSettings.showKeyAriaLabel", { defaultValue: "Show plugin key" })
                        }
                      >
                        {keyVisible ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                )}
              </FormField>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button onClick={form.handleSubmit(handleOk)} disabled={saving} aria-busy={saving}>
              {t("common.save", { defaultValue: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
