"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ToolbarSeparator } from "@/components/shared/ToolbarSeparator";
import i18n from "@/lib/i18n";
import { getBreadcrumb } from "@/components/leftnav";
import ViewSwitcher from "@/components/Navbar/ViewSwitcher";
import LiteAdmin from "@/components/liteadmin/LiteAdmin";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";
import WorkerDropdown from "@/components/Navbar/WorkerDropdown/WorkerDropdown";
import { useWorker } from "@/hooks/useWorker";
import { clearTokenCookies } from "@/utils/cookieUtils";
import { clearStoredReturnUrl, getLoginUrl } from "@/utils/returnUrlUtils";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useMediaQuery } from "usehooks-ts";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { CommandPaletteTrigger } from "@/components/CommandPalette/CommandPaletteTrigger";

// Top bar for the dashboard shell. Sits only over the content column (the brand
// lives in the sidebar header); mirrors the design's breadcrumb-left / tools-right layout.
export function DashboardHeader({ navigationTrigger }: { navigationTrigger?: ReactNode }) {
  const { title } = getBreadcrumb(usePathname());
  const isDesktop = useMediaQuery("(min-width: 768px)", { initializeWithValue: false });
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  if (isDesktop && mobileToolsOpen) setMobileToolsOpen(false);
  const { isControlPlane, selectedWorker } = useWorker();
  const showWorkerSwitch = isControlPlane && selectedWorker !== null;

  const handleWorkerSwitch = (workerId: string) => {
    clearTokenCookies();
    clearStoredReturnUrl();
    localStorage.removeItem("litellm_selected_worker_id");
    localStorage.removeItem("litellm_worker_url");
    window.location.href = `${getLoginUrl()}?worker=${encodeURIComponent(workerId)}`;
  };

  return (
    <header className="flex h-14 flex-none items-center justify-between gap-4 border-b border-border bg-background px-4 max-md:gap-2 max-md:px-2">
      {navigationTrigger}
      <Breadcrumb className="min-w-0 max-md:flex-1">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="flex-none max-md:hidden">
            <ViewSwitcher />
          </BreadcrumbItem>
          <BreadcrumbSeparator className="max-md:hidden" />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <CommandPaletteTrigger />

      <div className="flex flex-none items-center gap-1 max-md:hidden">
        {showWorkerSwitch && (
          <>
            <WorkerDropdown onWorkerSwitch={handleWorkerSwitch} />
            <ToolbarSeparator />
          </>
        )}
        <LiteAdmin />
        <ToolbarSeparator />
        <ThemeToggle />
      </div>
      <div className="flex shrink-0 items-center gap-1 md:hidden">
        <CommandPaletteTrigger mobile />
        <Popover open={!isDesktop && mobileToolsOpen} onOpenChange={setMobileToolsOpen}>
          <PopoverTrigger render={<Button variant="ghost" size="icon" className="size-11" aria-label={i18n.t("dashboardHeader.more-options", { defaultValue: "More options" })} />}>
            <Ellipsis />
          </PopoverTrigger>
          <PopoverContent align="end" className="max-w-[calc(100vw-2rem)]">
            <PopoverTitle>{i18n.t("dashboardHeader.gateway-tools", { defaultValue: "Gateway tools" })}</PopoverTitle>
            <ViewSwitcher />
            {showWorkerSwitch && <WorkerDropdown onWorkerSwitch={handleWorkerSwitch} />}
            <div className="flex flex-wrap items-center gap-2">
              <LiteAdmin />
              <ThemeToggle />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

export default DashboardHeader;
