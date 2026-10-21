import type { TFunction } from "i18next";
import { tByEnglish } from "@/lib/tByEnglish";
const STRATEGY_LABELS: Readonly<Record<string, string>> = {
  "simple-shuffle": "Simple Shuffle",
  "least-busy": "Least Busy",
  "usage-based-routing": "Usage Based",
  "latency-based-routing": "Latency Based",
  priority: "Priority",
};

export const formatStrategyLabel = (strategy: string, t?: TFunction): string => {
  const fallback = STRATEGY_LABELS[strategy] ?? strategy;
  return t ? tByEnglish(t, fallback) : fallback;
};
