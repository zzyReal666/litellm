import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "@/components/shared/DataTable";
import i18n from "@/lib/i18n";

import { getPublicModelHubColumns, type ModelGroupInfo } from "./PublicModelHubTableColumns";

const mockModel: ModelGroupInfo = {
  model_group: "gpt-4o",
  providers: ["openai"],
  mode: "chat",
  max_input_tokens: 128000,
  max_output_tokens: 16000,
  input_cost_per_token: 0.0000025,
  output_cost_per_token: 0.00001,
  rpm: 100,
  tpm: 2000,
  supports_parallel_function_calling: false,
  supports_vision: true,
  supports_function_calling: true,
  health_status: "healthy",
};

function renderTable(data: ModelGroupInfo[]) {
  render(
    <DataTable
      data={data}
      columns={getPublicModelHubColumns({ onModelClick: vi.fn(), t: i18n.t.bind(i18n) })}
      getRowId={(model, index) => model.model_group || String(index)}
      sortingMode="client"
      size="compact"
    />,
  );
}

describe("PublicModelHubTableColumns in zh-CN", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the model hub column headers in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    renderTable([mockModel]);

    expect(screen.getByText("模型名称")).toBeInTheDocument();
    expect(screen.getByText("提供商")).toBeInTheDocument();
    expect(screen.getByText("最大输入")).toBeInTheDocument();
    expect(screen.getByText("健康状态")).toBeInTheDocument();
    expect(screen.getByText("限制")).toBeInTheDocument();
  });

  it("renders the model hub column headers in English again after switching back", async () => {
    renderTable([mockModel]);

    expect(screen.getByText("Model Name")).toBeInTheDocument();
    expect(screen.getByText("Max Output")).toBeInTheDocument();
  });
});
