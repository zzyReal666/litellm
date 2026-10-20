import React from "react";
import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import i18n from "@/lib/i18n";
import {
  ErrorCodeTooltip,
  ErrorDrilldownCard,
  groupErrorBuckets,
  type CacheActivityErrorBucket,
} from "./ErrorDrilldown";

const BUCKETS: CacheActivityErrorBucket[] = [
  { call_type: "acompletion", error_code: "401", error_class: "AuthenticationError", count: 50 },
  { call_type: "acompletion", error_code: "429", error_class: "RateLimitError", count: 120 },
  { call_type: "acompletion", error_code: "429", error_class: "InternalServerError", count: 30 },
  { call_type: "aembedding", error_code: "500", error_class: "InternalServerError", count: 999 },
];

describe("groupErrorBuckets", () => {
  it("keeps only the requested call_type, totals per code, and sorts codes and classes by count desc", () => {
    expect(groupErrorBuckets(BUCKETS, "acompletion")).toEqual([
      {
        error_code: "429",
        "Failed requests": 150,
        classes: [
          { error_class: "RateLimitError", count: 120 },
          { error_class: "InternalServerError", count: 30 },
        ],
      },
      {
        error_code: "401",
        "Failed requests": 50,
        classes: [{ error_class: "AuthenticationError", count: 50 }],
      },
    ]);
  });

  it("returns no data for a call_type without failures", () => {
    expect(groupErrorBuckets(BUCKETS, "atranscription")).toEqual([]);
  });
});

describe("ErrorCodeTooltip", () => {
  const datum = groupErrorBuckets(BUCKETS, "acompletion")[0];

  it("shows the code total and one row per error class on hover", () => {
    render(<ErrorCodeTooltip active label="429" payload={[{ payload: datum, value: 150, graphicalItemId: "bar" }]} />);

    expect(screen.getByText("Error code 429: 150 failed")).toBeInTheDocument();
    expect(screen.getByText("RateLimitError")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("InternalServerError")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("renders nothing when inactive", () => {
    const { container } = render(<ErrorCodeTooltip active={false} label="429" payload={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("ErrorDrilldown in Chinese", () => {
  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("labels the drilldown card in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    render(
      <ErrorDrilldownCard
        callType="acompletion"
        buckets={BUCKETS}
        valueFormatter={(value) => String(value)}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("按错误码统计的失败请求：acompletion")).toBeInTheDocument();
    expect(screen.getByText("将鼠标悬停在柱状图上，可查看该错误码对应的错误类别。")).toBeInTheDocument();
    expect(screen.getByLabelText("关闭错误明细")).toBeInTheDocument();
  });

  it("labels the error tooltip in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");

    render(
      <ErrorCodeTooltip
        active
        label="429"
        payload={[{ payload: groupErrorBuckets(BUCKETS, "acompletion")[0], value: 150, graphicalItemId: "bar" }]}
      />,
    );

    expect(screen.getByText("错误码 429：150 次失败")).toBeInTheDocument();
  });
});
