/* @vitest-environment jsdom */
import type { PaginationState, RowSelectionState } from "@tanstack/react-table";
import { cleanup, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import { HealthChecksTable } from "./HealthChecksTable";
import type { HealthCheckData, HealthStatus } from "./HealthChecksTableColumns";

const makeRow = (overrides: Partial<HealthCheckData> & { id: string }): HealthCheckData => {
  const { id, ...rest } = overrides;
  return {
    model_name: `model-${id}`,
    model_info: { id },
    health_status: "none",
    last_check: "None",
    last_success: "None",
    health_loading: false,
    ...rest,
  };
};

function Harness({
  data,
  modelHealthStatuses = {},
}: {
  data: HealthCheckData[];
  modelHealthStatuses?: Record<string, HealthStatus>;
}) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  return (
    <HealthChecksTable
      data={data}
      rowCount={data.length}
      isLoading={false}
      pagination={pagination}
      onPaginationChange={setPagination}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      modelHealthStatuses={modelHealthStatuses}
      getDisplayModelName={(model) => model.model_name}
      onRunHealthCheck={vi.fn()}
      onShowError={vi.fn()}
      onShowSuccess={vi.fn()}
    />
  );
}

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
});

it("renders the health checks table copy in Chinese", async () => {
  await i18n.changeLanguage("zh-CN");

  const { unmount } = render(<Harness data={[]} />);
  expect(screen.getByText("未找到模型")).toBeInTheDocument();
  unmount();

  render(<Harness data={[makeRow({ id: "busy", health_loading: true, health_status: "checking" })]} />);

  expect(screen.getByText("健康状态")).toBeInTheDocument();
  expect(screen.getByText("最近检查")).toBeInTheDocument();
  expect(screen.getByText("检查中...")).toBeInTheDocument();
  expect(screen.getByText("检查进行中...")).toBeInTheDocument();
});
