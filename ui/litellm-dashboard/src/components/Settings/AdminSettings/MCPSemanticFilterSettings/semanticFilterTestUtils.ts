import type { TFunction } from "i18next";
import { toast } from "@/lib/toast";
import { testMCPSemanticFilter } from "@/components/networking";

export interface TestResult {
  totalTools: number;
  selectedTools: number;
  tools: string[];
}

interface FilterHeaders {
  filter: string | null;
  tools: string | null;
}

const parseFilterHeaders = (headers: FilterHeaders): TestResult | null => {
  if (!headers.filter) {
    return null;
  }

  const [total, selected] = headers.filter.split("->").map(Number);
  const tools = headers.tools ? headers.tools.split(",").map((name) => name.trim()) : [];

  return { totalTools: total, selectedTools: selected, tools };
};

export const runSemanticFilterTest = async ({
  accessToken,
  testModel,
  testQuery,
  t,
  setIsTesting,
  setTestResult,
  setTestError,
}: {
  accessToken: string;
  testModel: string | null;
  testQuery: string;
  t: TFunction;
  setIsTesting: (value: boolean) => void;
  setTestResult: (result: TestResult | null) => void;
  setTestError: (error: string | null) => void;
}) => {
  if (!testQuery || !testModel || !accessToken) {
    toast.error(
      t("settingsPages.mcpSemanticFilterTestPanel.queryAndModelRequired", {
        defaultValue: "Please enter a query and select a model",
      }),
    );
    return;
  }

  setIsTesting(true);
  setTestResult(null);
  setTestError(null);

  try {
    const { headers } = await testMCPSemanticFilter(accessToken, testModel, testQuery);
    const parsedResult = parseFilterHeaders(headers);

    if (!parsedResult) {
      toast.warning(
        t("settingsPages.mcpSemanticFilterTestPanel.filterNotEnabled", {
          defaultValue: "Semantic filter is not enabled or no tools were filtered",
        }),
      );
      return;
    }

    setTestResult(parsedResult);
    toast.success(
      t("settingsPages.mcpSemanticFilterTestPanel.testSuccess", {
        defaultValue: "Semantic filter test completed successfully",
      }),
    );
  } catch (error) {
    console.error("Test failed:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : t("settingsPages.mcpSemanticFilterTestPanel.testFailed", { defaultValue: "Failed to test semantic filter" });
    setTestError(message);
    toast.error(
      t("settingsPages.mcpSemanticFilterTestPanel.testFailed", { defaultValue: "Failed to test semantic filter" }),
    );
  } finally {
    setIsTesting(false);
  }
};

export const getCurlCommand = (testModel: string | null, testQuery: string) =>
  `curl --location 'http://localhost:4000/v1/responses' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer sk-1234' \\
--data '{
    "model": "${testModel ?? "YOUR_MODEL"}",
    "input": [
    {
      "role": "user",
      "content": "${testQuery || "Your query here"}",
      "type": "message"
    }
  ],
    "tools": [
        {
            "type": "mcp",
            "server_url": "litellm_proxy",
            "require_approval": "never"
        }
    ],
    "tool_choice": "required"
}'`;
