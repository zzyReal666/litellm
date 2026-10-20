import React from "react";
import { useTranslation } from "react-i18next";
import { BarChart, CustomLegend, CustomTooltip } from "@/components/shared/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricWithMetadata } from "@/components/UsagePage/types";

interface EndpointUsageBarChartProps {
  endpointData?: Record<string, MetricWithMetadata>;
}

const EndpointUsageBarChart: React.FC<EndpointUsageBarChartProps> = ({ endpointData }) => {
  const { t } = useTranslation();
  // Transform endpoint data into chart format
  const chartData = React.useMemo(() => {
    return Object.entries(endpointData || {}).map(([endpoint, data]) => ({
      endpoint,
      "metrics.successful_requests": data.metrics.successful_requests,
      "metrics.failed_requests": data.metrics.failed_requests,
      metrics: {
        successful_requests: data.metrics.successful_requests,
        failed_requests: data.metrics.failed_requests,
      },
    }));
  }, [endpointData]);

  const valueFormatter = (value: number) => value.toLocaleString();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">
            {t("usagePage.endpointUsageBarChart.title", { defaultValue: "Success vs Failed Requests by Endpoint" })}
          </CardTitle>
          <CustomLegend
            categories={["metrics.successful_requests", "metrics.failed_requests"]}
            colors={["green", "red"]}
          />
        </div>
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          index="endpoint"
          categories={["metrics.successful_requests", "metrics.failed_requests"]}
          colors={["green", "red"]}
          valueFormatter={valueFormatter}
          customTooltip={CustomTooltip}
          showLegend={false}
          stack={true}
          yAxisWidth={60}
        />
      </CardContent>
    </Card>
  );
};

export default EndpointUsageBarChart;
