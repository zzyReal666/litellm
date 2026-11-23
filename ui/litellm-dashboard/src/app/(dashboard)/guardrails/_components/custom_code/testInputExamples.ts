// Test input examples for pre_call and post_call
export const TEST_INPUT_EXAMPLES = {
  pre_call: {
    name: "Pre-call (Request)",
    data: {
      texts: ["Hello, my SSN is 123-45-6789"],
      images: [],
      tools: [
        {
          type: "function",
          function: {
            name: "get_weather",
            description: "Get the current weather in a location",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string", description: "City name" },
              },
              required: ["location"],
            },
          },
        },
      ],
      tool_calls: [],
      structured_messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, my SSN is 123-45-6789" },
      ],
      model: "gpt-4",
    },
  },
  post_call: {
    name: "Post-call (Response)",
    data: {
      texts: ["The weather in San Francisco is 72°F and sunny."],
      images: [],
      tools: [],
      tool_calls: [
        {
          id: "call_abc123",
          type: "function",
          function: {
            name: "get_weather",
            arguments: '{"location": "San Francisco"}',
          },
        },
      ],
      structured_messages: [],
      model: "gpt-4",
    },
  },
  pre_mcp_call: {
    name: "Pre MCP (MCP tool as OpenAI tool)",
    data: {
      texts: ['Tool: read_wiki_structure\nArguments: {"repoName": "BerriAI/litellm"}'],
      images: [],
      tools: [
        {
          type: "function",
          function: {
            name: "read_wiki_structure",
            description: "Read the structure of a GitHub repository (MCP tool passed as OpenAI tool)",
            parameters: {
              type: "object",
              properties: {
                repoName: { type: "string", description: "Repository name, e.g. BerriAI/litellm" },
              },
              required: ["repoName"],
            },
          },
        },
      ],
      tool_calls: [
        {
          id: "call_mcp_001",
          type: "function",
          function: {
            name: "read_wiki_structure",
            arguments: '{"repoName": "BerriAI/litellm"}',
          },
        },
      ],
      structured_messages: [
        { role: "user", content: 'Tool: read_wiki_structure\nArguments: {"repoName": "BerriAI/litellm"}' },
      ],
      model: "mcp-tool-call",
    },
  },
};
