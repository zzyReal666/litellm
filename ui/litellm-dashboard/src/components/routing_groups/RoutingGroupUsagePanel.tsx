"use client";

import { Code2 } from "lucide-react";
import React from "react";
import { Trans, useTranslation } from "react-i18next";

import CodeBlock from "@/components/CodeBlock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { formatStrategyLabel } from "./strategy";
import type { RoutingGroup } from "./types";

interface RoutingGroupUsagePanelProps {
  group: RoutingGroup;
  baseUrl: string;
}

const exampleModel = (group: RoutingGroup): string => group.models[0] ?? "<your-model>";

const buildCurlSnippet = (group: RoutingGroup, baseUrl: string): string =>
  `curl -X POST '${baseUrl}/v1/chat/completions' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer $LITELLM_API_KEY' \\
  -d '{
    "model": "${exampleModel(group)}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

const buildPythonSnippet = (group: RoutingGroup, baseUrl: string): string =>
  `from openai import OpenAI

client = OpenAI(
    api_key="$LITELLM_API_KEY",
    base_url="${baseUrl}",
)

response = client.chat.completions.create(
    model="${exampleModel(group)}",
    messages=[{"role": "user", "content": "Hello!"}],
)

print(response)`;

const buildJsSnippet = (group: RoutingGroup, baseUrl: string): string =>
  `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LITELLM_API_KEY,
  baseURL: "${baseUrl}",
});

const response = await client.chat.completions.create({
  model: "${exampleModel(group)}",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(response);`;

const SNIPPET_TABS = [
  {
    value: "curl",
    key: "routingGroups.routingGroupsTable.tabCurl",
    defaultValue: "cURL",
    language: "bash",
    build: buildCurlSnippet,
  },
  {
    value: "python",
    key: "routingGroups.routingGroupsTable.tabPython",
    defaultValue: "Python (OpenAI SDK)",
    language: "python",
    build: buildPythonSnippet,
  },
  {
    value: "javascript",
    key: "routingGroups.routingGroupsTable.tabJavascript",
    defaultValue: "JavaScript (OpenAI SDK)",
    language: "javascript",
    build: buildJsSnippet,
  },
] as const;

export function RoutingGroupUsagePanel({ group, baseUrl }: RoutingGroupUsagePanelProps) {
  const { t } = useTranslation();
  return (
    <div className="border-y bg-muted/40 px-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <Code2 className="size-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {t("routingGroups.routingGroupsTable.howRoutingWorksTitle", {
            defaultValue: "How routing works for this group",
          })}
        </span>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        <Trans
          i18nKey="routingGroups.routingGroupsTable.howRoutingWorksDesc"
          defaults="Callers request any model in the group by name; LiteLLM picks a deployment behind the scenes using the <strong>{{strategy}}</strong> strategy."
          values={{ strategy: formatStrategyLabel(group.routing_strategy, t) }}
          components={{ strong: <span className="font-medium text-foreground" /> }}
        />
      </p>
      <Tabs defaultValue="curl">
        <TabsList variant="line" className="h-auto w-full justify-start rounded-none border-b p-0">
          {SNIPPET_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-none rounded-none px-4 py-2">
              {t(tab.key, { defaultValue: tab.defaultValue })}
            </TabsTrigger>
          ))}
        </TabsList>
        {SNIPPET_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-3">
            <CodeBlock language={tab.language} code={tab.build(group, baseUrl)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
