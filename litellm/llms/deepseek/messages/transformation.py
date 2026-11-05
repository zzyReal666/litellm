"""
DeepSeek Anthropic-compatible messages transformation config.
"""

from typing import Any, Final

import litellm
from litellm.llms.anthropic.pass_through.messages.transformation import (
    AnthropicMessagesConfig,
)
from litellm.secret_managers.main import get_secret_str
from litellm.types.router import GenericLiteLLMParams


class DeepSeekAnthropicMessagesConfig(AnthropicMessagesConfig):
    """
    DeepSeek exposes an Anthropic-compatible Messages API at
    https://api.deepseek.com/anthropic.

    It accepts the native Anthropic Messages conversation shape, including
    thinking blocks in assistant history, but rejects Anthropic's explicit
    custom-tool discriminator (`{"type": "custom"}`).
    """

    _THINKING_BLOCK_TYPES: Final[frozenset[str]] = frozenset({"thinking", "redacted_thinking"})

    @property
    def custom_llm_provider(self) -> str | None:
        return "deepseek"

    def should_strip_billing_metadata(self) -> bool:
        return True

    @staticmethod
    def get_api_key(api_key: str | None = None) -> str | None:
        return api_key or get_secret_str("DEEPSEEK_API_KEY") or litellm.api_key

    @staticmethod
    def get_api_base(api_base: str | None = None) -> str:
        return (
            api_base
            or get_secret_str("DEEPSEEK_ANTHROPIC_API_BASE")
            or get_secret_str("DEEPSEEK_API_BASE")
            or "https://api.deepseek.com/anthropic"
        )

    def validate_anthropic_messages_environment(
        self,
        headers: dict,
        model: str,
        messages: list[Any],
        optional_params: dict,
        litellm_params: dict,
        api_key: str | None = None,
        api_base: str | None = None,
    ) -> tuple[dict, str | None]:
        dynamic_api_key: Final = self.get_api_key(api_key=api_key)

        if "x-api-key" not in headers and "authorization" not in headers and dynamic_api_key is not None:
            headers["x-api-key"] = dynamic_api_key

        if "anthropic-version" not in headers:
            headers["anthropic-version"] = "2023-06-01"
        if "content-type" not in headers:
            headers["content-type"] = "application/json"

        headers = self._update_headers_with_anthropic_beta(
            headers=headers,
            optional_params=optional_params,
            custom_llm_provider=self.custom_llm_provider or "deepseek",
            messages=messages,
        )

        return headers, api_base

    def get_complete_url(
        self,
        api_base: str | None,
        api_key: str | None,
        model: str,
        optional_params: dict,
        litellm_params: dict,
        stream: bool | None = None,
    ) -> str:
        base_url = self.get_api_base(api_base=api_base).rstrip("/")

        if base_url.endswith("/v1/messages") and "/anthropic/" in base_url:
            return base_url
        base_url = base_url.removesuffix("/v1/messages")
        base_url = base_url.removesuffix("/v1")
        base_url = base_url.removesuffix("/beta")

        if not base_url.endswith("/anthropic") and "/anthropic/" not in base_url:
            base_url = f"{base_url}/anthropic"

        return f"{base_url}/v1/messages"

    @staticmethod
    def _sanitize_tools_for_deepseek(tools: Any) -> object:
        if not isinstance(tools, list):
            return tools

        sanitized_tools: Final = []
        for tool in tools:
            if isinstance(tool, dict) and tool.get("type") == "custom":
                sanitized_tool = dict(tool)
                sanitized_tool.pop("type", None)
                sanitized_tools.append(sanitized_tool)
            else:
                sanitized_tools.append(tool)
        return sanitized_tools

    @staticmethod
    def _is_thinking_disabled(anthropic_messages_request: dict) -> bool:
        thinking: Final = anthropic_messages_request.get("thinking")
        return isinstance(thinking, dict) and thinking.get("type") == "disabled"

    @classmethod
    def _fill_missing_thinking_blocks(cls, messages: list) -> list:
        """
        DeepSeek rejects a thinking-mode request when an assistant turn carries a
        tool_use block without a thinking block ("The `content[].thinking` in the
        thinking mode must be passed back to the API"). The OpenAI-compatible
        surface already backfills reasoning_content in DeepSeekConfig, but the
        Anthropic-compatible surface forwarded history untouched, so a turn
        produced by an upstream that omits thinking would poison the rest of the
        conversation. A placeholder block is enough, the API accepts it without a
        signature.
        """
        filled: Final[list] = []
        for message in messages:
            content: Final = message.get("content") if isinstance(message, dict) else None
            if not isinstance(message, dict) or message.get("role") != "assistant" or not isinstance(content, list):
                filled.append(message)
                continue
            block_types: Final[frozenset[object]] = frozenset(
                block.get("type") for block in content if isinstance(block, dict)
            )
            if "tool_use" not in block_types or block_types & cls._THINKING_BLOCK_TYPES:
                filled.append(message)
                continue
            filled.append({**message, "content": [{"type": "thinking", "thinking": " "}, *content]})
        return filled

    def transform_anthropic_messages_request(
        self,
        model: str,
        messages: list[dict],
        anthropic_messages_optional_request_params: dict,
        litellm_params: GenericLiteLLMParams,
        headers: dict,
    ) -> dict:
        anthropic_messages_request: Final = super().transform_anthropic_messages_request(
            model=model,
            messages=messages,
            anthropic_messages_optional_request_params=anthropic_messages_optional_request_params,
            litellm_params=litellm_params,
            headers=headers,
        )
        if "tools" in anthropic_messages_request:
            anthropic_messages_request["tools"] = self._sanitize_tools_for_deepseek(anthropic_messages_request["tools"])
        if not self._is_thinking_disabled(anthropic_messages_request):
            anthropic_messages_request["messages"] = self._fill_missing_thinking_blocks(
                anthropic_messages_request["messages"]
            )
        return anthropic_messages_request
