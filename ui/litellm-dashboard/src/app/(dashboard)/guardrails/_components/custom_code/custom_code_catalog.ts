import i18n from "@/lib/i18n";

export const CODE_TEMPLATES = {
  empty: {
    name: i18n.t("guardrails.customCodeModal.templateEmpty", { defaultValue: "Empty Template" }),
    code: `async def apply_guardrail(inputs, request_data, input_type):
    # inputs: {texts, images, tools, tool_calls, structured_messages, model}
    # request_data: {model, user_id, team_id, end_user_id, metadata}
    # input_type: "request" or "response"
    return allow()`,
  },
  blockSSN: {
    name: i18n.t("guardrails.customCodeModal.templateBlockSsn", { defaultValue: "Block SSN" }),
    code: `def apply_guardrail(inputs, request_data, input_type):
    for text in inputs["texts"]:
        if regex_match(text, r"\\d{3}-\\d{2}-\\d{4}"):
            return block("SSN detected")
    return allow()`,
  },
  redactEmail: {
    name: i18n.t("guardrails.customCodeModal.templateRedactEmails", { defaultValue: "Redact Emails" }),
    code: `def apply_guardrail(inputs, request_data, input_type):
    pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    modified = []
    for text in inputs["texts"]:
        modified.append(regex_replace(text, pattern, "[EMAIL REDACTED]"))
    return modify(texts=modified)`,
  },
  blockSQL: {
    name: i18n.t("guardrails.customCodeModal.templateBlockSql", { defaultValue: "Block SQL Injection" }),
    code: `def apply_guardrail(inputs, request_data, input_type):
    if input_type != "request":
        return allow()
    for text in inputs["texts"]:
        if contains_code_language(text, ["sql"]):
            return block("SQL code not allowed")
    return allow()`,
  },
  validateJSON: {
    name: i18n.t("guardrails.customCodeModal.templateValidateJson", { defaultValue: "Validate JSON" }),
    code: `def apply_guardrail(inputs, request_data, input_type):
    if input_type != "response":
        return allow()
    
    schema = {"type": "object", "required": ["name", "value"]}
    
    for text in inputs["texts"]:
        obj = json_parse(text)
        if obj is None:
            return block("Invalid JSON response")
        if not json_schema_valid(obj, schema):
            return block("Response missing required fields")
    return allow()`,
  },
  externalAPI: {
    name: i18n.t("guardrails.customCodeModal.templateExternalApi", { defaultValue: "External API Check (async)" }),
    code: `async def apply_guardrail(inputs, request_data, input_type):
    # Call an external moderation API (async for non-blocking)
    for text in inputs["texts"]:
        response = await http_post(
            "https://api.example.com/moderate",
            body={"text": text, "user_id": request_data["user_id"]},
            headers={"Authorization": "Bearer YOUR_API_KEY"},
            timeout=10
        )
        
        if not response["success"]:
            # API call failed, allow by default or block
            return allow()
        
        if response["body"].get("flagged"):
            return block(response["body"].get("reason", "Content flagged"))
    
    return allow()`,
  },
};

export const PRIMITIVES = {
  [i18n.t("guardrails.customCodeModal.primCategoryReturnValues", { defaultValue: "Return Values" })]: [
    { name: "allow()", desc: i18n.t("guardrails.customCodeModal.primAllowDesc", { defaultValue: "Let request/response through" }) },
    { name: "block(reason)", desc: i18n.t("guardrails.customCodeModal.primBlockDesc", { defaultValue: "Reject with message" }) },
    { name: "flag(reason, metadata={})", desc: i18n.t("guardrails.customCodeModal.primFlagDesc", { defaultValue: "Let through, record a non-blocking violation" }) },
    { name: "modify(texts=[], images=[], tool_calls=[])", desc: i18n.t("guardrails.customCodeModal.primModifyDesc", { defaultValue: "Transform content" }) },
  ],
  [i18n.t("guardrails.customCodeModal.primCategoryHttpRequests", { defaultValue: "HTTP Requests (async)" })]: [
    { name: "await http_request(url, method, headers, body)", desc: i18n.t("guardrails.customCodeModal.primHttpRequestDesc", { defaultValue: "Make async HTTP request" }) },
    { name: "await http_get(url, headers)", desc: i18n.t("guardrails.customCodeModal.primHttpGetDesc", { defaultValue: "Async GET request" }) },
    { name: "await http_post(url, body, headers)", desc: i18n.t("guardrails.customCodeModal.primHttpPostDesc", { defaultValue: "Async POST request" }) },
  ],
  [i18n.t("guardrails.customCodeModal.primCategoryRegex", { defaultValue: "Regex Functions" })]: [
    { name: "regex_match(text, pattern)", desc: i18n.t("guardrails.customCodeModal.primRegexMatchDesc", { defaultValue: "Returns True if pattern found" }) },
    { name: "regex_replace(text, pattern, replacement)", desc: i18n.t("guardrails.customCodeModal.primRegexReplaceDesc", { defaultValue: "Replace all matches" }) },
    { name: "regex_find_all(text, pattern)", desc: i18n.t("guardrails.customCodeModal.primRegexFindAllDesc", { defaultValue: "Return list of matches" }) },
  ],
  [i18n.t("guardrails.customCodeModal.primCategoryJson", { defaultValue: "JSON Functions" })]: [
    { name: "json_parse(text)", desc: i18n.t("guardrails.customCodeModal.primJsonParseDesc", { defaultValue: "Parse JSON string, returns None on error" }) },
    { name: "json_stringify(obj)", desc: i18n.t("guardrails.customCodeModal.primJsonStringifyDesc", { defaultValue: "Convert to JSON string" }) },
    { name: "json_schema_valid(obj, schema)", desc: i18n.t("guardrails.customCodeModal.primJsonSchemaValidDesc", { defaultValue: "Validate against JSON schema" }) },
  ],
  [i18n.t("guardrails.customCodeModal.primCategoryUrl", { defaultValue: "URL Functions" })]: [
    { name: "extract_urls(text)", desc: i18n.t("guardrails.customCodeModal.primExtractUrlsDesc", { defaultValue: "Extract all URLs from text" }) },
    { name: "is_valid_url(url)", desc: i18n.t("guardrails.customCodeModal.primIsValidUrlDesc", { defaultValue: "Check if URL is valid" }) },
    { name: "all_urls_valid(text)", desc: i18n.t("guardrails.customCodeModal.primAllUrlsValidDesc", { defaultValue: "Check all URLs in text are valid" }) },
  ],
  [i18n.t("guardrails.customCodeModal.primCategoryCodeDetection", { defaultValue: "Code Detection" })]: [
    { name: "detect_code(text)", desc: i18n.t("guardrails.customCodeModal.primDetectCodeDesc", { defaultValue: "Returns True if code detected" }) },
    { name: "detect_code_languages(text)", desc: i18n.t("guardrails.customCodeModal.primDetectCodeLangsDesc", { defaultValue: "Returns list of detected languages" }) },
    { name: 'contains_code_language(text, ["sql"])', desc: i18n.t("guardrails.customCodeModal.primContainsCodeLangDesc", { defaultValue: "Check for specific languages" }) },
  ],
  [i18n.t("guardrails.customCodeModal.primCategoryTextUtilities", { defaultValue: "Text Utilities" })]: [
    { name: "contains(text, substring)", desc: i18n.t("guardrails.customCodeModal.primContainsDesc", { defaultValue: "Check if substring exists" }) },
    { name: "contains_any(text, [substr1, substr2])", desc: i18n.t("guardrails.customCodeModal.primContainsAnyDesc", { defaultValue: "Check if any substring exists" }) },
    { name: "word_count(text)", desc: i18n.t("guardrails.customCodeModal.primWordCountDesc", { defaultValue: "Count words" }) },
    { name: "char_count(text)", desc: i18n.t("guardrails.customCodeModal.primCharCountDesc", { defaultValue: "Count characters" }) },
    { name: "lower(text) / upper(text) / trim(text)", desc: i18n.t("guardrails.customCodeModal.primStringTransformsDesc", { defaultValue: "String transforms" }) },
  ],
};

export const MODE_OPTIONS = [
  { value: "pre_call", label: i18n.t("guardrails.customCodeModal.modePreCall", { defaultValue: "pre_call (Request)" }) },
  { value: "post_call", label: i18n.t("guardrails.customCodeModal.modePostCall", { defaultValue: "post_call (Response)" }) },
  { value: "during_call", label: i18n.t("guardrails.customCodeModal.modeDuringCall", { defaultValue: "during_call (Parallel)" }) },
  { value: "logging_only", label: i18n.t("guardrails.customCodeModal.modeLoggingOnly", { defaultValue: "logging_only" }) },
  { value: "pre_mcp_call", label: i18n.t("guardrails.customCodeModal.modePreMcpCall", { defaultValue: "pre_mcp_call (Before MCP Tool Call)" }) },
  { value: "post_mcp_call", label: i18n.t("guardrails.customCodeModal.modePostMcpCall", { defaultValue: "post_mcp_call (After MCP Tool Call)" }) },
  { value: "during_mcp_call", label: i18n.t("guardrails.customCodeModal.modeDuringMcpCall", { defaultValue: "during_mcp_call (During MCP Tool Call)" }) },
];

export const TEMPLATE_ITEMS = Object.entries(CODE_TEMPLATES).map(([key, template]) => ({
  value: key,
  label: template.name,
}));

export type ModeOption = (typeof MODE_OPTIONS)[number];

export const MODE_OPTION_BY_VALUE: Record<string, ModeOption> = Object.fromEntries(
  MODE_OPTIONS.map((option) => [option.value, option]),
);
