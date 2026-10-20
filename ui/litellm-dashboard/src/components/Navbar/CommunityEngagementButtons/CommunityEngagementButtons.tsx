import { useDisableShowPrompts } from "@/app/(dashboard)/hooks/useDisableShowPrompts";
import { buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cva.config";
import { Github, Slack } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

const COMMUNITY_LINKS = [
  {
    href: "https://www.litellm.ai/support",
    labelKey: "navbar.joinSlack",
    label: "Join Slack",
    tooltipKey: "navbar.slackCommunity",
    tooltip: "LiteLLM Slack community",
    Icon: Slack,
  },
  {
    href: "https://github.com/BerriAI/litellm",
    labelKey: "navbar.githubRepo",
    label: "LiteLLM on GitHub",
    tooltipKey: "navbar.githubRepo",
    tooltip: "LiteLLM on GitHub",
    Icon: Github,
  },
] as const;

export const CommunityEngagementButtons: React.FC = () => {
  const { t } = useTranslation();
  const disableShowPrompts = useDisableShowPrompts();

  if (disableShowPrompts) {
    return null;
  }

  return (
    <TooltipProvider>
      <ButtonGroup aria-label={t("navbar.communityLinks", { defaultValue: "Community links" })}>
        {COMMUNITY_LINKS.map(({ href, label, labelKey, tooltip, tooltipKey, Icon }) => (
          <Tooltip key={href}>
            <TooltipTrigger
              render={
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(labelKey, { defaultValue: label })}
                  className={cn(buttonVariants({ variant: "outline", size: "icon" }), "text-muted-foreground")}
                />
              }
            >
              <Icon />
            </TooltipTrigger>
            <TooltipContent>{t(tooltipKey, { defaultValue: tooltip })}</TooltipContent>
          </Tooltip>
        ))}
      </ButtonGroup>
    </TooltipProvider>
  );
};
