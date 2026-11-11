import litellm
from litellm.types.router import LiteLLM_Params

cases = [
    {"model": "openai/gpt-4o", "api_base": "https://api.example.com/v1", "api_key": "sk-x"},
    {"model": "openai/gpt-4o", "api_base": "https://api.example.com", "api_key": "sk-x"},
    {"model": "openai/gpt-4o", "api_base": "https://api.example.com/", "api_key": "sk-x"},
    {"model": "openai/my-vl-model", "api_base": "https://api.example.com/v1", "api_key": "sk-x"},
    {"model": "openai/my-vl-model", "api_base": "https://api.example.com/v1/", "api_key": "sk-x"},
]
from litellm.llms.openai.openai import OpenAIChatCompletion
for c in cases:
    p = LiteLLM_Params(**c)
    client = OpenAIChatCompletion()._get_openai_client(is_async=False, api_key=p.api_key, api_base=p.api_base)
    print(c["api_base"], "->", client.base_url)
