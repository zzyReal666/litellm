import type { TFunction } from "i18next";

export const formatStrategyLabel = (strategy: string, t: TFunction): string => {
  switch (strategy) {
    case "simple-shuffle":
      return t("routingGroups.routingGroupsTable.strategySimpleShuffle", { defaultValue: "Simple Shuffle" });
    case "least-busy":
      return t("routingGroups.routingGroupsTable.strategyLeastBusy", { defaultValue: "Least Busy" });
    case "usage-based-routing":
      return t("routingGroups.routingGroupsTable.strategyUsageBased", { defaultValue: "Usage Based" });
    case "latency-based-routing":
      return t("routingGroups.routingGroupsTable.strategyLatencyBased", { defaultValue: "Latency Based" });
    default:
      return strategy;
  }
};
