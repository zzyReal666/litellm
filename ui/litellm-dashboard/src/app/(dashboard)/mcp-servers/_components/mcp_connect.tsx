/* eslint-disable react/no-unescaped-entities */

import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CopyIcon,
  Code,
  Terminal,
  Globe,
  CheckIcon,
  ExternalLinkIcon,
  Info,
  KeyIcon,
  ServerIcon,
  Zap,
} from "lucide-react";
import { getProxyBaseUrl } from "@/components/networking";
import { copyToClipboard as utilCopyToClipboard } from "@/utils/dataUtils";

interface CodeBlockProps {
  code: string;
  title?: string;
  copyKey: string;
  className?: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  serverName?: string;
  accessGroups?: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  children,
  serverName,
  accessGroups = ["dev-group"],
}) => {
  const { t } = useTranslation();
  const [useServerHeader, setUseServerHeader] = useState(false);
  const serverHeaderToggleId = useId();
  const headerToggleTitles = [
    t("mcpTools.mcpConnect.implementationExample", { defaultValue: "Implementation Example" }),
    t("mcpTools.mcpConnect.configuration", { defaultValue: "Configuration" }),
  ];

  const getHeadersConfig = () => {
    const headers: Record<string, any> = {
      "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
    };
    if (useServerHeader && serverName) {
      const formattedServerName = serverName.replace(/\s+/g, "_");
      // Include both server name and access groups in the same header (comma-separated string)
      const serverAndGroups = [formattedServerName, ...accessGroups].join(",");
      headers["x-mcp-servers"] = serverAndGroups;
    }
    return headers;
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2 rounded-lg bg-muted">{icon}</span>
          <div>
            <h5 className="mb-0 text-base font-semibold text-foreground">{title}</h5>
            <span className="text-muted-foreground">{description}</span>
          </div>
        </div>
        {serverName && headerToggleTitles.includes(title) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Switch
                id={serverHeaderToggleId}
                size="sm"
                checked={useServerHeader}
                onCheckedChange={setUseServerHeader}
              />
              <Label htmlFor={serverHeaderToggleId} className="font-normal leading-normal">
                {t("mcpTools.mcpConnect.limitToolsText", {
                  defaultValue: "Limit tools to specific MCP servers or MCP groups by passing the",
                })}{" "}
                <code>x-mcp-servers</code> {t("mcpTools.mcpConnect.headerSuffix", { defaultValue: "header" })}
              </Label>
            </div>
            {useServerHeader && (
              <Alert className="mt-2" variant="info">
                <Info />
                <AlertTitle>{t("mcpTools.mcpConnect.twoOptions", { defaultValue: "Two Options" })}</AlertTitle>
                <AlertDescription>
                  <div>
                    <p>
                      <strong>{t("mcpTools.mcpConnect.option1Label", { defaultValue: "Option 1:" })}</strong>{" "}
                      {t("mcpTools.mcpConnect.option1Desc", { defaultValue: "Get a specific server:" })}{" "}
                      <code>"{serverName.replace(/\s+/g, "_")}"</code>
                    </p>
                    <p>
                      <strong>{t("mcpTools.mcpConnect.option2Label", { defaultValue: "Option 2:" })}</strong>{" "}
                      {t("mcpTools.mcpConnect.option2Desc", { defaultValue: "Get a group of MCPs:" })}{" "}
                      <code>"dev-group"</code>
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("mcpTools.mcpConnect.mixBothText", { defaultValue: "You can also mix both:" })}{" "}
                      <code>"Server1,dev-group"</code>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        {React.Children.map(children, (child) => {
          if (
            React.isValidElement<CodeBlockProps>(child) &&
            child.props.hasOwnProperty("code") &&
            child.props.hasOwnProperty("copyKey")
          ) {
            const code = child.props.code;
            if (code && code.includes('"headers":')) {
              return React.cloneElement(child, {
                code: code.replace(/"headers":\s*{[^}]*}/, `"headers": ${JSON.stringify(getHeadersConfig(), null, 8)}`),
              });
            }
          }
          return child;
        })}
      </CardContent>
    </Card>
  );
};

interface MCPConnectProps {
  currentServerAccessGroups?: string[];
}

const MCPConnect: React.FC<MCPConnectProps> = ({ currentServerAccessGroups = [] }) => {
  const { t } = useTranslation();
  const proxyBaseUrl = getProxyBaseUrl();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [currentServer] = useState("Zapier_MCP"); // This should match the current server being viewed

  const copyToClipboard = async (text: string, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const CodeBlock: React.FC<{
    code: string;
    copyKey: string;
    title?: string;
    className?: string;
  }> = ({ code, copyKey, title, className = "" }) => (
    <div className="relative group">
      {title && (
        <div className="flex items-center gap-2 mb-2">
          <Code size={16} className="text-info" />
          <strong className="font-semibold text-foreground">{title}</strong>
        </div>
      )}
      <Card className={`relative bg-muted ${className}`}>
        <CardContent>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => copyToClipboard(code, copyKey)}
            className={`absolute top-2 right-2 z-raised transition-all duration-200 ${
              copiedStates[copyKey]
                ? "text-success bg-success/10 border-success/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {copiedStates[copyKey] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          </Button>
          <pre className="text-sm overflow-x-auto pr-10 text-foreground font-mono leading-relaxed">{code}</pre>
        </CardContent>
      </Card>
    </div>
  );

  const StepCard: React.FC<{
    step: number;
    title: string;
    children: React.ReactNode;
  }> = ({ step, title, children }) => (
    <div className="flex gap-4">
      <div className="shrink-0">
        <div className="w-8 h-8 bg-info text-info-foreground rounded-full flex items-center justify-center text-sm font-semibold">
          {step}
        </div>
      </div>
      <div className="flex-1">
        <strong className="mb-2 block font-semibold text-foreground">{title}</strong>
        {children}
      </div>
    </div>
  );

  const LiteLLMProxyTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-success/15 to-success/5 p-6 rounded-lg border border-success/15">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="text-success" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-success">
            {t("mcpTools.mcpConnect.litellmProxyApiIntegration", { defaultValue: "LiteLLM Proxy API Integration" })}
          </h4>
        </div>
        <span className="text-success">
          {t("mcpTools.mcpConnect.litellmProxyDesc", {
            defaultValue:
              "Connect to LiteLLM Proxy Responses API for seamless tool integration with multiple model providers",
          })}
        </span>
      </div>

      <div className="flex w-full flex-col gap-6">
        <FeatureCard
          icon={<KeyIcon className="text-success" size={16} />}
          title={t("mcpTools.mcpConnect.virtualKeySetup", { defaultValue: "Virtual Key Setup" })}
          description={t("mcpTools.mcpConnect.virtualKeySetupDesc", {
            defaultValue: "Configure your LiteLLM Proxy Virtual Key for authentication",
          })}
        >
          <div className="flex w-full flex-col gap-4">
            <div>
              <span>
                {t("mcpTools.mcpConnect.getVirtualKeyText", {
                  defaultValue: "Get your Virtual Key from your LiteLLM Proxy dashboard or contact your administrator",
                })}
              </span>
            </div>
            <CodeBlock
              title={t("mcpTools.mcpConnect.environmentVariable", { defaultValue: "Environment Variable" })}
              code='export LITELLM_API_KEY="sk-..."'
              copyKey="litellm-env"
            />
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<ServerIcon className="text-success" size={16} />}
          title={t("mcpTools.mcpConnect.mcpServerInformation", { defaultValue: "MCP Server Information" })}
          description={t("mcpTools.mcpConnect.mcpServerInformationDesc", {
            defaultValue: "Connection details for your LiteLLM MCP server",
          })}
        >
          <CodeBlock
            title={t("mcpTools.mcpConnect.serverUrl", { defaultValue: "Server URL" })}
            code={`${proxyBaseUrl}/mcp`}
            copyKey="litellm-server-url"
          />
        </FeatureCard>

        <FeatureCard
          icon={<Code className="text-success" size={16} />}
          title={t("mcpTools.mcpConnect.implementationExample", { defaultValue: "Implementation Example" })}
          description={t("mcpTools.mcpConnect.litellmImplementationDesc", {
            defaultValue: "Complete cURL example for using the LiteLLM Proxy Responses API",
          })}
          serverName={currentServer}
          accessGroups={["dev-group"]}
        >
          <CodeBlock
            code={`curl --location '${proxyBaseUrl}/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $LITELLM_VIRTUAL_KEY" \\
--data '{
    "model": "gpt-4",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "litellm_proxy",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_VIRTUAL_KEY",
                "x-mcp-servers": "Zapier_MCP,dev-group"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'`}
            copyKey="litellm-curl"
            className="text-xs"
          />
        </FeatureCard>
      </div>
    </div>
  );

  const OpenAITab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-info/15 to-info/5 p-6 rounded-lg border border-info/15">
        <div className="flex items-center gap-3 mb-3">
          <Code className="text-info" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-info">
            {t("mcpTools.mcpConnect.openaiResponsesApiIntegration", {
              defaultValue: "OpenAI Responses API Integration",
            })}
          </h4>
        </div>
        <span className="text-info">
          {t("mcpTools.mcpConnect.openaiDesc", {
            defaultValue: "Connect OpenAI Responses API to your LiteLLM MCP server for seamless tool integration",
          })}
        </span>
      </div>

      <div className="flex w-full flex-col gap-6">
        <FeatureCard
          icon={<KeyIcon className="text-info" size={16} />}
          title={t("mcpTools.mcpConnect.apiKeySetup", { defaultValue: "API Key Setup" })}
          description={t("mcpTools.mcpConnect.apiKeySetupDesc", {
            defaultValue: "Configure your OpenAI API key for authentication",
          })}
        >
          <div className="flex w-full flex-col gap-4">
            <div>
              <span>
                {t("mcpTools.mcpConnect.getApiKeyText", { defaultValue: "Get your API key from the" })}{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info hover:text-info/80 inline-flex items-center gap-1"
                >
                  {t("mcpTools.mcpConnect.openaiPlatformLink", { defaultValue: "OpenAI platform" })}{" "}
                  <ExternalLinkIcon size={12} />
                </a>
              </span>
            </div>
            <CodeBlock
              title={t("mcpTools.mcpConnect.environmentVariable", { defaultValue: "Environment Variable" })}
              code='export OPENAI_API_KEY="sk-..."'
              copyKey="openai-env"
            />
          </div>
        </FeatureCard>

        <FeatureCard
          icon={<ServerIcon className="text-info" size={16} />}
          title={t("mcpTools.mcpConnect.mcpServerInformation", { defaultValue: "MCP Server Information" })}
          description={t("mcpTools.mcpConnect.mcpServerInformationDesc", {
            defaultValue: "Connection details for your LiteLLM MCP server",
          })}
        >
          <CodeBlock
            title={t("mcpTools.mcpConnect.serverUrl", { defaultValue: "Server URL" })}
            code={`${proxyBaseUrl}/mcp`}
            copyKey="openai-server-url"
          />
        </FeatureCard>

        <FeatureCard
          icon={<Code className="text-info" size={16} />}
          title={t("mcpTools.mcpConnect.implementationExample", { defaultValue: "Implementation Example" })}
          description={t("mcpTools.mcpConnect.openaiImplementationDesc", {
            defaultValue: "Complete cURL example for using the Responses API",
          })}
          serverName="Zapier Gmail"
          accessGroups={["dev-group"]}
        >
          <CodeBlock
            code={`curl --location 'https://api.openai.com/v1/responses' \\
--header 'Content-Type: application/json' \\
--header "Authorization: Bearer $OPENAI_API_KEY" \\
--data '{
    "model": "gpt-4.1",
    "tools": [
        {
            "type": "mcp",
            "server_label": "litellm",
            "server_url": "${proxyBaseUrl}/mcp",
            "require_approval": "never",
            "headers": {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
                "x-mcp-servers": "Zapier_MCP,dev-group"
            }
        }
    ],
    "input": "Run available tools",
    "tool_choice": "required"
}'`}
            copyKey="openai-curl"
            className="text-xs"
          />
        </FeatureCard>
      </div>
    </div>
  );

  const CursorTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-100 dark:from-purple-950 dark:to-blue-950 dark:border-purple-900">
        <div className="flex items-center gap-3 mb-3">
          <Terminal className="text-purple-600 dark:text-purple-400" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-purple-900 dark:text-purple-100">
            {t("mcpTools.mcpConnect.cursorIdeIntegration", { defaultValue: "Cursor IDE Integration" })}
          </h4>
        </div>
        <span className="text-purple-700 dark:text-purple-300">
          {t("mcpTools.mcpConnect.cursorDesc", {
            defaultValue:
              "Use tools directly from Cursor IDE with LiteLLM MCP. Enable your AI assistant to perform real-world tasks without leaving your coding environment.",
          })}
        </span>
      </div>

      <Card>
        <CardContent>
          <h5 className="mb-4 text-base font-semibold text-foreground">
            {t("mcpTools.mcpConnect.setupInstructions", { defaultValue: "Setup Instructions" })}
          </h5>
          <div className="flex w-full flex-col gap-6">
            <StepCard step={1} title={t("mcpTools.mcpConnect.step1Title", { defaultValue: "Open Cursor Settings" })}>
              <span className="text-muted-foreground">
                {t("mcpTools.mcpConnect.step1Desc", { defaultValue: "Use the keyboard shortcut" })}{" "}
                <code className="bg-muted px-2 py-1 rounded-sm">
                  {t("mcpTools.mcpConnect.shortcutMac", { defaultValue: "⇧+⌘+J" })}
                </code>{" "}
                {t("mcpTools.mcpConnect.macSuffix", { defaultValue: "(Mac)" })}{" "}
                {t("mcpTools.mcpConnect.orText", { defaultValue: "or" })}{" "}
                <code className="bg-muted px-2 py-1 rounded-sm">
                  {t("mcpTools.mcpConnect.shortcutWindows", { defaultValue: "Ctrl+Shift+J" })}
                </code>{" "}
                {t("mcpTools.mcpConnect.windowsLinuxSuffix", { defaultValue: "(Windows/Linux)" })}
              </span>
            </StepCard>

            <StepCard step={2} title={t("mcpTools.mcpConnect.step2Title", { defaultValue: "Navigate to MCP Tools" })}>
              <span className="text-muted-foreground">
                {t("mcpTools.mcpConnect.step2Desc", {
                  defaultValue: 'Go to the "MCP Tools" tab and click "New MCP Server"',
                })}
              </span>
            </StepCard>

            <StepCard step={3} title={t("mcpTools.mcpConnect.step3Title", { defaultValue: "Add Configuration" })}>
              <span className="mb-3 text-muted-foreground">
                {t("mcpTools.mcpConnect.step3Desc", {
                  defaultValue: "Copy the JSON configuration below and paste it into Cursor, then save with",
                })}{" "}
                <code className="bg-muted px-2 py-1 rounded-sm">
                  {t("mcpTools.mcpConnect.shortcutSaveMac", { defaultValue: "Cmd+S" })}
                </code>{" "}
                {t("mcpTools.mcpConnect.orText", { defaultValue: "or" })}{" "}
                <code className="bg-muted px-2 py-1 rounded-sm">
                  {t("mcpTools.mcpConnect.shortcutSaveWindows", { defaultValue: "Ctrl+S" })}
                </code>
              </span>
              <FeatureCard
                icon={<Code className="text-purple-600 dark:text-purple-400" size={16} />}
                title={t("mcpTools.mcpConnect.configuration", { defaultValue: "Configuration" })}
                description={t("mcpTools.mcpConnect.cursorConfigDesc", { defaultValue: "Cursor MCP configuration" })}
                serverName="Zapier Gmail"
                accessGroups={["dev-group"]}
              >
                <CodeBlock
                  code={`{
    "mcpServers": {
      "Zapier_MCP": {
        "url": "${proxyBaseUrl}/mcp",
        "headers": {
          "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
          "x-mcp-servers": "Zapier_MCP,dev-group"
        }
      }
    }
  }`}
                  copyKey="cursor-config"
                  className="text-xs"
                />
              </FeatureCard>
            </StepCard>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StreamableHTTPTab = () => (
    <div className="flex w-full flex-col gap-6">
      <div className="bg-linear-to-r from-success/15 to-success/5 p-6 rounded-lg border border-success/15">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="text-success" size={24} />
          <h4 className="mb-0 text-xl font-semibold text-success">
            {t("mcpTools.mcpConnect.streamableHttpTransport", { defaultValue: "Streamable HTTP Transport" })}
          </h4>
        </div>
        <span className="text-success">
          {t("mcpTools.mcpConnect.streamableHttpDesc", {
            defaultValue:
              "Connect to LiteLLM MCP using HTTP transport. Compatible with any MCP client that supports HTTP streaming.",
          })}
        </span>
      </div>

      <FeatureCard
        icon={<Globe className="text-success" size={16} />}
        title={t("mcpTools.mcpConnect.universalMcpConnection", { defaultValue: "Universal MCP Connection" })}
        description={t("mcpTools.mcpConnect.universalMcpConnectionDesc", {
          defaultValue: "Use this URL with any MCP client that supports HTTP transport",
        })}
      >
        <div className="flex w-full flex-col gap-4">
          <div>
            <span>
              {t("mcpTools.mcpConnect.transportMethodText", {
                defaultValue:
                  "Each MCP client supports different transports. Refer to your client documentation to determine the appropriate transport method.",
              })}
            </span>
          </div>
          <CodeBlock
            title={t("mcpTools.mcpConnect.serverUrl", { defaultValue: "Server URL" })}
            code={`${proxyBaseUrl}/mcp`}
            copyKey="http-server-url"
          />
          <CodeBlock
            title={t("mcpTools.mcpConnect.headersConfiguration", { defaultValue: "Headers Configuration" })}
            code={JSON.stringify(
              {
                "x-litellm-api-key": "Bearer YOUR_LITELLM_API_KEY",
              },
              null,
              2,
            )}
            copyKey="http-headers"
          />
          <div className="mt-4">
            <Button
              variant="link"
              className="p-0 h-auto text-info hover:text-info/80"
              nativeButton={false}
              render={
                <a
                  href="https://modelcontextprotocol.io/docs/concepts/transports"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <ExternalLinkIcon size={14} />
              {t("mcpTools.mcpConnect.learnMoreTransports", { defaultValue: "Learn more about MCP transports" })}
            </Button>
          </div>
        </div>
      </FeatureCard>
    </div>
  );

  return (
    <div>
      <div className="flex w-full flex-col gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-3">
            {t("mcpTools.mcpConnect.pageTitle", { defaultValue: "Connect to your MCP client" })}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t("mcpTools.mcpConnect.pageDesc", {
              defaultValue:
                "Use tools directly from any MCP client with LiteLLM MCP. Enable your AI assistant to perform real-world tasks through a simple, secure connection.",
            })}
          </p>
        </div>

        <Tabs defaultValue="openai" className="w-full">
          <TabsList variant="line" className="mt-8 mb-6 h-auto w-full justify-start rounded-none border-b p-0">
            <div className="flex rounded-lg bg-muted p-1">
              <TabsTrigger value="openai" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Code size={18} />
                  {t("mcpTools.mcpConnect.tabOpenAI", { defaultValue: "OpenAI API" })}
                </span>
              </TabsTrigger>
              <TabsTrigger value="litellm" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Zap size={18} />
                  {t("mcpTools.mcpConnect.tabLiteLLMProxy", { defaultValue: "LiteLLM Proxy" })}
                </span>
              </TabsTrigger>
              <TabsTrigger value="cursor" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Terminal size={18} />
                  {t("mcpTools.mcpConnect.tabCursor", { defaultValue: "Cursor" })}
                </span>
              </TabsTrigger>
              <TabsTrigger value="http" className="flex-none px-6 py-3">
                <span className="flex items-center gap-2 font-medium">
                  <Globe size={18} />
                  {t("mcpTools.mcpConnect.tabStreamableHttp", { defaultValue: "Streamable HTTP" })}
                </span>
              </TabsTrigger>
            </div>
          </TabsList>
          <TabsContent value="openai" keepMounted className="mt-6">
            <OpenAITab />
          </TabsContent>
          <TabsContent value="litellm" keepMounted className="mt-6">
            <LiteLLMProxyTab />
          </TabsContent>
          <TabsContent value="cursor" keepMounted className="mt-6">
            <CursorTab />
          </TabsContent>
          <TabsContent value="http" keepMounted className="mt-6">
            <StreamableHTTPTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MCPConnect;
