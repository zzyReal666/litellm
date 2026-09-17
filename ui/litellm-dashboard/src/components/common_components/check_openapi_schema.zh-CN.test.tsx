import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderWithProviders as render, screen } from "@/../tests/test-utils";
import { useForm } from "react-hook-form";
import i18n from "@/lib/i18n";
import SchemaFormFields from "./check_openapi_schema";
import { MountedFormProvider, useMountRegistry, type MountedFormValues } from "./MountedFormField";

vi.mock("../networking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../networking")>()),
  getOpenAPISchema: vi.fn(),
}));

const { getOpenAPISchema } = await import("../networking");

const schema = {
  components: {
    schemas: {
      Team: {
        required: ["max_budget"],
        properties: {
          max_budget: { type: "number", title: "Max Budget" },
          duration: { type: "string", title: "Duration" },
          metadata: { type: "string", title: "Metadata", format: "json" },
        },
      },
    },
  },
};

const Harness = () => {
  const form = useForm<MountedFormValues>({ defaultValues: {} });
  const registry = useMountRegistry();
  return (
    <MountedFormProvider value={{ control: form.control, registry }}>
      <SchemaFormFields schemaComponent="Team" setValue={form.setValue} />
    </MountedFormProvider>
  );
};

describe("SchemaFormFields zh-CN", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh-CN");
    vi.mocked(getOpenAPISchema).mockResolvedValue(schema);
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the per-field help text in Chinese", async () => {
    render(<Harness />);

    expect(await screen.findByText("输入最大预算（美元，例如：100.50）")).toBeInTheDocument();
    expect(screen.getByText("输入时长（例如：30s、24h、7d）")).toBeInTheDocument();
    expect(screen.queryByText("Enter maximum budget in USD (e.g., 100.50)")).not.toBeInTheDocument();
  });

  it("renders the duration placeholder and the JSON field chrome in Chinese", async () => {
    render(<Harness />);

    expect(await screen.findByPlaceholderText("例如：30s、30h、30d")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("以 JSON 格式输入")).toBeInTheDocument();
    expect(screen.getByText(/必须为有效的 JSON 格式/)).toBeInTheDocument();
  });
});
