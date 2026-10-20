import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, renderWithProviders as render, screen } from "@/../tests/test-utils";
import React from "react";
import { z } from "zod/v4";

import i18n from "@/lib/i18n";
import { useZodForm } from "@/lib/forms/useZodForm";

import MetadataKeyValueFields, { createMetadataPairsSchema, type MetadataPair } from "./MetadataKeyValueFields";

// The zh-CN catalog entries for these two messages land in a separate commit, so register them here
// when they are still missing. Once the catalog carries them this block is a no-op.
if (i18n.getResource("zh-CN", "translation", "commonComponents.metadataKeyValueFields.missingKey") === undefined) {
  i18n.addResourceBundle(
    "zh-CN",
    "translation",
    {
      commonComponents: {
        metadataKeyValueFields: { missingKey: "键名为必填项", duplicateKey: "键名重复" },
      },
    },
    true,
    true,
  );
}

interface HarnessProps {
  onFinish: (values: { metadata?: MetadataPair[] }) => void;
}

const Harness: React.FC<HarnessProps> = ({ onFinish }) => {
  const schema = z.object({ metadata: createMetadataPairsSchema(i18n.t.bind(i18n)) });
  const form = useZodForm(schema, { defaultValues: { metadata: [] } });
  return (
    <form onSubmit={form.handleSubmit((values) => onFinish(values))}>
      <MetadataKeyValueFields control={form.control} getValues={form.getValues} name="metadata" />
      <button type="submit">Save</button>
    </form>
  );
};

const addRow = () => fireEvent.click(screen.getByRole("button", { name: "添加键值对" }));

describe("MetadataKeyValueFields validation messages zh-CN", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the field placeholders in Chinese", () => {
    render(<Harness onFinish={vi.fn()} />);

    addRow();

    expect(screen.getByPlaceholderText("键")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("值")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加键值对" })).toBeInTheDocument();
  });

  it("reports a duplicate metadata key in Chinese", async () => {
    render(<Harness onFinish={vi.fn()} />);

    addRow();
    fireEvent.change(screen.getAllByPlaceholderText("键")[0], { target: { value: "cost_center" } });
    addRow();
    fireEvent.change(screen.getAllByPlaceholderText("键")[1], { target: { value: "cost_center" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findAllByText("键名重复")).not.toHaveLength(0);
  });

  it("reports a missing metadata key in Chinese", async () => {
    render(<Harness onFinish={vi.fn()} />);

    addRow();
    fireEvent.change(screen.getByPlaceholderText("值"), { target: { value: "orphan" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("键名为必填项")).toBeInTheDocument();
  });
});
