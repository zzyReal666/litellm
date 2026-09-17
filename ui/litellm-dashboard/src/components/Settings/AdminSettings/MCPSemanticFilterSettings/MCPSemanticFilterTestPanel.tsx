import { Code, CircleAlert, CirclePlay, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ModelSelector from "@/components/common_components/ModelSelector";
import { TestResult } from "./semanticFilterTestUtils";
import { useTranslation } from "react-i18next";

interface MCPSemanticFilterTestPanelProps {
  accessToken: string | null;
  testQuery: string;
  setTestQuery: (value: string) => void;
  testModel: string | null;
  setTestModel: (value: string | null) => void;
  isTesting: boolean;
  onTest: () => void;
  filterEnabled: boolean;
  testResult: TestResult | null;
  testError: string | null;
  curlCommand: string;
}

export default function MCPSemanticFilterTestPanel({
  accessToken,
  testQuery,
  setTestQuery,
  testModel,
  setTestModel,
  isTesting,
  onTest,
  filterEnabled,
  testResult,
  testError,
  curlCommand,
}: MCPSemanticFilterTestPanelProps) {
  const { t } = useTranslation();
  const canRunTest = testQuery && testModel && filterEnabled;
  const testDisabled = isTesting || !canRunTest;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>
          {t("settingsPages.mcpSemanticFilterTestPanel.testConfigCardTitle", { defaultValue: "Test Configuration" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test">
          <TabsList>
            <TabsTrigger value="test" className="flex-none">
              {t("settingsPages.mcpSemanticFilterTestPanel.testTabLabel", { defaultValue: "Test" })}
            </TabsTrigger>
            <TabsTrigger value="api" className="flex-none">
              {t("settingsPages.mcpSemanticFilterTestPanel.apiTabLabel", { defaultValue: "API Usage" })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <div className="flex w-full flex-col gap-6">
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-medium">
                  <CirclePlay className="size-4" />{" "}
                  {t("settingsPages.mcpSemanticFilterTestPanel.testQueryLabel", { defaultValue: "Test Query" })}
                </p>
                <Textarea
                  className="field-sizing-fixed"
                  placeholder={t("settingsPages.mcpSemanticFilterTestPanel.testQueryPlaceholder", {
                    defaultValue: "Enter a test query to see which tools would be selected...",
                  })}
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  rows={4}
                  disabled={isTesting}
                />
              </div>

              <div>
                <ModelSelector
                  accessToken={accessToken || ""}
                  value={testModel}
                  onChange={setTestModel}
                  disabled={isTesting}
                  showLabel={true}
                  labelText={t("settingsPages.mcpSemanticFilterTestPanel.selectModelLabel", {
                    defaultValue: "Select Model",
                  })}
                />
              </div>

              <Button className="w-full" onClick={onTest} disabled={testDisabled}>
                <CirclePlay />
                {t("settingsPages.mcpSemanticFilterTestPanel.testFilterButton", { defaultValue: "Test Filter" })}
              </Button>

              {!filterEnabled && (
                <Alert>
                  <Info />
                  <AlertTitle>
                    {t("settingsPages.mcpSemanticFilterTestPanel.filterDisabledTitle", {
                      defaultValue: "Semantic filtering is disabled",
                    })}
                  </AlertTitle>
                  <AlertDescription>
                    {t("settingsPages.mcpSemanticFilterTestPanel.filterDisabledDesc", {
                      defaultValue: "Enable semantic filtering and save settings to test the filter.",
                    })}
                  </AlertDescription>
                </Alert>
              )}

              {testError && (
                <Alert variant="destructive" className="mb-4">
                  <CircleAlert />
                  <AlertTitle>
                    {t("settingsPages.mcpSemanticFilterTestPanel.filterFailedTitle", {
                      defaultValue: "Semantic filtering did not run",
                    })}
                  </AlertTitle>
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}

              {testResult && (
                <div>
                  <h5 className="mb-2 text-base font-medium">
                    {t("settingsPages.mcpSemanticFilterTestPanel.resultsTitle", { defaultValue: "Results" })}
                  </h5>
                  <Alert className="mb-4">
                    <Info />
                    <AlertTitle>
                      {t("settingsPages.mcpSemanticFilterTestPanel.toolsSelectedOfTotal", {
                        defaultValue: "{{selected}} of {{total}} tools selected",
                        selected: testResult.selectedTools,
                        total: testResult.totalTools,
                      })}
                    </AlertTitle>
                    <AlertDescription>
                      {t("settingsPages.mcpSemanticFilterTestPanel.toolsFilteredOut", {
                        defaultValue: "{{count}} tools filtered out",
                        count: testResult.totalTools - testResult.selectedTools,
                      })}
                    </AlertDescription>
                  </Alert>
                  <div>
                    <p className="mb-2 block font-medium">
                      {t("settingsPages.mcpSemanticFilterTestPanel.selectedToolsLabel", {
                        defaultValue: "Selected Tools:",
                      })}
                    </p>
                    <ul className="m-0 list-disc pl-5">
                      {testResult.tools.map((tool, index) => (
                        <li key={index} className="mb-1">
                          <span>{tool}</span>
                        </li>
                      ))}
                    </ul>
                    {testResult.selectedTools > testResult.tools.length && (
                      <p className="mt-2 block text-sm text-muted-foreground">
                        {t("settingsPages.mcpSemanticFilterTestPanel.moreToolsNotShown", {
                          defaultValue: "+{{count}} more selected tools not shown",
                          count: testResult.selectedTools - testResult.tools.length,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="api">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Code className="size-4" />
                <p className="font-medium">
                  {t("settingsPages.mcpSemanticFilterTestPanel.apiUsageTitle", { defaultValue: "API Usage" })}
                </p>
              </div>
              <p className="mb-2 block text-sm text-muted-foreground">
                {t("settingsPages.mcpSemanticFilterTestPanel.apiUsageDesc", {
                  defaultValue: "Use this curl command to test the semantic filter with your current configuration.",
                })}
              </p>
              <p className="mb-2 block font-medium">
                {t("settingsPages.mcpSemanticFilterTestPanel.responseHeadersLabel", {
                  defaultValue: "Response headers to check:",
                })}
              </p>
              <ul className="mt-0 mr-0 mb-3 ml-0 list-disc pl-5">
                <li>
                  <span>
                    {t("settingsPages.mcpSemanticFilterTestPanel.semanticFilterHeader", {
                      defaultValue: "x-litellm-semantic-filter: shows total tools → selected tools",
                    })}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t("settingsPages.mcpSemanticFilterTestPanel.semanticFilterHeaderExample", {
                      defaultValue: "Example: 10→3",
                    })}
                  </span>
                </li>
                <li>
                  <span>
                    {t("settingsPages.mcpSemanticFilterTestPanel.semanticFilterToolsHeader", {
                      defaultValue: "x-litellm-semantic-filter-tools: CSV of selected tool names",
                    })}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t("settingsPages.mcpSemanticFilterTestPanel.semanticFilterToolsHeaderExample", {
                      defaultValue: "Example: wikipedia-fetch,github-search,slack-post",
                    })}
                  </span>
                </li>
              </ul>
              <pre className="m-0 overflow-auto rounded-sm bg-muted p-3 text-xs">{curlCommand}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
