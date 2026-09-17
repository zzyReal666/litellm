"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import SummaryCard from "@/components/shared/SummaryCard";
import {
  autorouterOf,
  cachingOf,
  compressionOf,
  gatewayAttributedCachingOf,
  SAVINGS_DRIVERS,
  savedTokensOf,
  sumOverDays,
  usd,
} from "@/app/(dashboard)/cost-optimization/_components/costOptimizationUtils";
import { DailyData } from "@/components/UsagePage/types";
import { formatNumberWithCommas } from "@/utils/dataUtils";

// The total sums SAVINGS_DRIVERS, so it is by construction the sum of what the
// charts plot; the donut and timelines derive from the same list in costOptimizationUtils.
const useSavingsTotals = (results: DailyData[]) =>
  useMemo(
    () => ({
      compression: sumOverDays(results, compressionOf),
      caching: sumOverDays(results, cachingOf),
      autorouter: sumOverDays(results, autorouterOf),
      gatewayAttributedCaching: sumOverDays(results, gatewayAttributedCachingOf),
      savedTokens: sumOverDays(results, savedTokensOf),
      total: SAVINGS_DRIVERS.reduce((sum, { of }) => sum + sumOverDays(results, of), 0),
    }),
    [results],
  );

const SavingsTiles = ({ results, isLoading }: { results: DailyData[]; isLoading: boolean }) => {
  const { t } = useTranslation();
  const totals = useSavingsTotals(results);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label={t("shared.savingsTiles.totalSaved", { defaultValue: "Total saved" })}
        value={usd(totals.total)}
        hint={
          isLoading
            ? t("shared.savingsTiles.loading", { defaultValue: "Loading..." })
            : t("shared.savingsTiles.totalSavedHint", { defaultValue: "Compression + prompt caching + auto-router" })
        }
        info={t("shared.savingsTiles.totalSavedInfo", {
          defaultValue:
            "The sum of the three tiles beside it. Its caching term is the LiteLLM-injected share, so this total is what the gateway itself delivered; caching that clients or providers brought on their own appears only in the caching tile's Total figure.",
        })}
      />
      <SummaryCard
        label={t("shared.savingsTiles.compressionSavings", { defaultValue: "Compression savings" })}
        value={usd(totals.compression)}
        hint={t("shared.savingsTiles.tokensCompressed", {
          count: formatNumberWithCommas(totals.savedTokens),
          defaultValue: "{{count}} tokens compressed",
        })}
        info={t("shared.savingsTiles.compressionSavingsInfo", {
          defaultValue: "Tokens Headroom removed before the call, priced at the model's input rate.",
        })}
      />
      <SummaryCard
        label={t("shared.savingsTiles.promptCachingSavings", { defaultValue: "Prompt caching savings" })}
        value={usd(totals.gatewayAttributedCaching)}
        hint={t("shared.savingsTiles.litellmInjected", { defaultValue: "LiteLLM injected" })}
        secondary={{
          label: t("shared.savingsTiles.total", { defaultValue: "Total" }),
          value: usd(totals.caching),
        }}
        info={t("shared.savingsTiles.promptCachingInfo", {
          defaultValue:
            "What caching saved against paying the input rate for every token: the discount on tokens served from cache, less the premium providers charge to write a cache entry. The headline figure is the share LiteLLM earned by inserting the breakpoints itself, through configured injection points or auto prompt caching. The total beside it also counts requests that arrived with their own cache_control and providers that cache implicitly. Either can be negative on traffic that writes more cache than it reuses, which is why the headline is not always the smaller of the two.",
        })}
      />
      <SummaryCard
        label={t("shared.savingsTiles.autoRouterSavings", { defaultValue: "Auto-router savings" })}
        value={usd(totals.autorouter)}
        hint={t("shared.savingsTiles.autoRouterHint", { defaultValue: "vs. the priciest model it could pick" })}
        info={t("shared.savingsTiles.autoRouterInfo", {
          defaultValue:
            "What this traffic would have cost had every request gone to the most expensive model the auto-router can route to, minus what it actually cost. Switching leaves the new model with a cold cache, so it pays to write the prompt again while the baseline is priced as already warm; a route that thrashes the cache can total below zero, and a genuine first turn, where neither side had anything cached, is undercounted.",
        })}
      />
    </div>
  );
};

export default SavingsTiles;
