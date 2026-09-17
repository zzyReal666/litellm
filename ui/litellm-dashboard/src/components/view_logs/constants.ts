export const ERROR_CODE_OPTIONS: { labelKey: string; label: string; value: string }[] = [
  { labelKey: "viewLogs.constants.errorCode400", label: "400 - Bad Request", value: "400" },
  { labelKey: "viewLogs.constants.errorCode401", label: "401 - Invalid Authentication", value: "401" },
  { labelKey: "viewLogs.constants.errorCode403", label: "403 - Permission Denied", value: "403" },
  { labelKey: "viewLogs.constants.errorCode404", label: "404 - Not Found", value: "404" },
  { labelKey: "viewLogs.constants.errorCode408", label: "408 - Request Timeout", value: "408" },
  { labelKey: "viewLogs.constants.errorCode422", label: "422 - Unprocessable Entity", value: "422" },
  { labelKey: "viewLogs.constants.errorCode429", label: "429 - Rate Limited", value: "429" },
  { labelKey: "viewLogs.constants.errorCode500", label: "500 - Internal Server Error", value: "500" },
  { labelKey: "viewLogs.constants.errorCode502", label: "502 - Bad Gateway", value: "502" },
  { labelKey: "viewLogs.constants.errorCode503", label: "503 - Service Unavailable", value: "503" },
  { labelKey: "viewLogs.constants.errorCode529", label: "529 - Overloaded", value: "529" },
];

/** Call types that represent MCP tool invocations (shared across columns, index, drawer). */
export const MCP_CALL_TYPES = ["call_mcp_tool", "list_mcp_tools"];

/** Call types that represent agent/A2A requests (e.g. asend_message). */
export const AGENT_CALL_TYPES = ["asend_message"];

/** Call types that represent Batch API operations (creation and retrieval, sync and async). */
export const BATCH_CALL_TYPES = ["acreate_batch", "create_batch", "aretrieve_batch", "retrieve_batch"];

export const QUICK_SELECT_OPTIONS: { labelKey: string; label: string; value: number; unit: string }[] = [
  { labelKey: "viewLogs.constants.quickSelectLastMinute", label: "Last Minute", value: 1, unit: "minutes" },
  { labelKey: "viewLogs.constants.quickSelectLast15Minutes", label: "Last 15 Minutes", value: 15, unit: "minutes" },
  { labelKey: "viewLogs.constants.quickSelectLastHour", label: "Last Hour", value: 1, unit: "hours" },
  { labelKey: "viewLogs.constants.quickSelectLast4Hours", label: "Last 4 Hours", value: 4, unit: "hours" },
  { labelKey: "viewLogs.constants.quickSelectLast24Hours", label: "Last 24 Hours", value: 24, unit: "hours" },
  { labelKey: "viewLogs.constants.quickSelectLast7Days", label: "Last 7 Days", value: 7, unit: "days" },
];
