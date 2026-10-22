"use client";

import { Plus } from "lucide-react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Button } from "@/components/ui/button";
import { Page } from "@/components/shared/Page";
import { PageHeader, PageHeaderControls, PageHeaderTitle } from "@/components/shared/PageHeader";
import { uiHref } from "@/utils/uiHref";
import { Leaderboard, useBreakdown } from "@/app/(dashboard)/usage/_components/components/overview/BreakdownChart";
import { Panel } from "@/app/(dashboard)/usage/_components/components/overview/Primitives";
import UsageStatStrip from "@/app/(dashboard)/usage/_components/components/overview/UsageStatStrip";
import { HOME_USAGE_DAYS, useHomeUsage } from "./useHomeUsage";

const LEADERBOARD = { metric: "tokens", dimension: "model_groups" } as const;

export default function HomePage() {
  const { isViewOnly } = useAuthorized();
  const usage = useHomeUsage();
  const { series, ranking } = useBreakdown(usage.results, LEADERBOARD, 8);

  return (
    <Page>
      <PageHeader>
        <PageHeaderTitle>Home</PageHeaderTitle>
        {!isViewOnly && (
          <PageHeaderControls>
            <Button render={<a href={uiHref("api-keys?create=true")} />}>
              <Plus />
              Create New Virtual Key
            </Button>
          </PageHeaderControls>
        )}
      </PageHeader>

      <section aria-label={`Usage, last ${HOME_USAGE_DAYS} days`}>
        {usage.failed ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
            <span className="text-destructive">Failed to load usage</span>
            <Button variant="outline" size="sm" onClick={usage.retry}>
              Retry
            </Button>
          </div>
        ) : (
          <UsageStatStrip
            results={usage.results}
            totals={usage.totals}
            loading={usage.loading}
            requestCountsPending={usage.requestCountsPending}
            budget={usage.budget}
          />
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Leaderboard"
            subtitle={`Share of tokens over the last ${HOME_USAGE_DAYS} days, with the change between the first and second half of the period`}
            testId="home-leaderboard"
          >
            <Leaderboard
              ranking={ranking}
              series={series}
              metric={LEADERBOARD.metric}
              dimension={LEADERBOARD.dimension}
              columns={2}
              limit={10}
            />
          </Panel>
        </div>
      </div>
    </Page>
  );
}
