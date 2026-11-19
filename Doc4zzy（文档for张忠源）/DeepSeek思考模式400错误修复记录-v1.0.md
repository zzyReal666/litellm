# DeepSeek 思考模式 400 错误修复记录

版本 v1.0
日期 2026-11-19
适用组件 中安云科 AI 安全网关（LiteLLM 1.106 定制版）
相关提交 91dca2740b、fe22214df1，分支 zayk-dev

## 一、问题概述

网关下线 DeepSeek 系列模型后，多轮对话在发生工具调用之后，会持续返回 400 错误。客户端看到的报错有两种形态

```
litellm.BadRequestError: DeepseekException - {"error":{"message":"The `reasoning_content`
in the thinking mode must be passed back to the API."}}
```

```
litellm.BadRequestError: DeepseekException - {"type":"error","error":{"type":"invalid_request_error",
"message":"The `content[].thinking` in the thinking mode must be passed back to the API."}}
```

前者出现在 OpenAI 聊天协议入口，后者出现在 Anthropic Messages 协议入口。一旦某个会话历史里出现缺失思考内容的助手轮次，该会话后续请求会反复报错，因为每条请求都会重放这段历史。

## 二、影响面

以 2026-11-18 的用量数据为例

| 时间范围 | 请求总数 | 失败数 | reasoning 相关失败 |
| --- | --- | --- | --- |
| 11-18 14:00 至 18:59（+08） | 3187 | 80 | 6 |

当天全部 6 次 reasoning 相关失败都落在这个窗口内，其余失败属于过期密钥、无效模型名、stream_options 参数等其他原因。

这 6 条请求的特征高度一致

- 全部集中在官方 DeepSeek 部署上，dashscope 部署零失败
- 全部是长上下文请求，token 数在 12 万到 26 万之间
- 客户端为 DSH（deepseek-harness），使用 OpenAI 聊天协议
- 报错时间集中在发生过工具调用的多轮会话中

## 三、根因分析

### 3.1 DeepSeek 的校验规则

DeepSeek 思考模式要求：对话历史中，凡是带工具调用的助手轮次，必须把 reasoning_content 原样传回；对于 Anthropic 兼容端点，则要求把 thinking 块传回。缺失时接口直接返回 400，不进入生成流程。

### 3.2 客户端丢弃思考内容

DSH 重放会话历史时，助手消息只保留 role、content、tool_calls 三个字段，丢弃了 reasoning_content。这一点在 DeepSeek Harness 官方讨论区第 3857 条中已有记录。丢失发生在客户端侧，网关收到请求时历史已经不完整。

### 3.3 网关补齐逻辑覆盖不全

网关其实已有两处补齐逻辑，但触发条件都太窄。

聊天路径（`litellm/llms/deepseek/chat/transformation.py`）原逻辑要求客户端显式传 `thinking: {"type": "enabled"}` 才补齐。实际客户端根本不传 thinking 参数，而 DeepSeek 默认开启思考，导致补齐不触发。

Anthropic 路径（`litellm/llms/deepseek/messages/transformation.py`）原本完全没有对应的补齐逻辑，只透传请求，历史缺 thinking 块时直接透传给官方端点。

### 3.4 为什么之前没有稳定复现

用短对话、单轮工具调用构造的合成请求，直接打官方接口都返回 200，官方并不校验。只有拿到真实的失败请求体才稳定复现，说明校验触发与历史规模和历史中思考内容的混合分布有关。

## 四、复现过程

### 4.1 获取真实请求体

用量库 `LiteLLM_SpendLogs` 的 `proxy_server_request` 字段保存了完整入站请求体。按报错请求的 request_id 定位到一条失败记录

```
request_id   f3817f3c-2d89-49cb-9a2b-e8d06cfc71e0
时间          2026-11-18 18:34:50 (+08)
部署           7090831c（官方 deepseek）
调用类型       acompletion
token 数       186270
```

请求体结构

```
模型        deepseek-v4-flash
stream      true，stream_options.include_usage
thinking    未传
reasoning_effort  未传
tools       37 个
messages    407 条（system 1，user 63，assistant 178，tool 165）
```

178 条 assistant 消息中，一部分带有 reasoning_content（长度 130 到 2293 字符不等），大量消息完全没有该字段。历史中思考内容的存在与否混杂，这是触发的关键。

### 4.2 直接回放官方接口

把请求体原样发到 `https://api.deepseek.com/beta/chat/completions`，稳定复现

```
原始请求                               400  The `reasoning_content` in the thinking mode must be passed back
把所有缺失的 reasoning_content 补成空格   200
把所有 reasoning_content 全部移除        400
整个请求去掉 tools 参数                 400
```

结论：只要历史里存在缺失 reasoning_content 的助手轮次就会被拒，与是否携带 tools 无关；把缺失值补成单个空格即可通过。

## 五、修复方案

### 5.1 提交 91dca2740b（Anthropic 路径）

文件 `litellm/llms/deepseek/messages/transformation.py`

新增 `_fill_missing_thinking_blocks`，在助手消息包含 tool_use 但缺少 thinking 块时，于内容数组前插入占位块 `{"type": "thinking", "thinking": " "}`。仅当请求未显式关闭思考（`thinking: {"type": "disabled"}`）时执行；纯文本助手轮次不处理，避免无谓补块。

### 5.2 提交 fe22214df1（聊天路径）

文件 `litellm/llms/deepseek/chat/transformation.py`

调整 `_thinking_mode_active` 的判定语义：模型支持推理能力，且请求没有显式发送 `thinking: {"type": "disabled"}`，即视为思考模式开启，执行补齐。不再要求客户端显式传 enabled，因为 DeepSeek 在不传该参数时默认开启思考。

```python
def _thinking_mode_active(self, model, optional_params) -> bool:
    thinking = optional_params.get("thinking")
    if not supports_reasoning(model=model, custom_llm_provider="deepseek"):
        return False
    if isinstance(thinking, dict):
        return thinking.get("type") != "disabled"
    return True
```

### 5.3 补齐副作用

占位块的内容是单个空格，模型在那一轮看到的是空白推理链，对多轮回答质量有轻微影响。这与官方文档建议的“原样回传”有差距，属于客户端无法及时修改时的兜底措施。

## 六、测试

两个提交都附带回归测试，覆盖补齐触发与不触发的边界

```
聊天路径
  test_thinking_mode_active_non_dict_thinking_defaults_to_active
  test_deepseek_fill_reasoning_content_guard_in_transform_request
  test_deepseek_fill_reasoning_content_multiturn

Anthropic 路径
  test_deepseek_anthropic_messages_fills_thinking_before_tool_use_when_missing
  test_deepseek_anthropic_messages_fills_thinking_when_thinking_param_absent
  test_deepseek_anthropic_messages_keeps_history_when_thinking_disabled
  test_deepseek_anthropic_messages_does_not_fill_text_only_assistant_turns
```

执行 `pytest tests/unit/llms/deepseek/` 共 54 个用例全部通过。做过变异验证：把补齐条件改回旧逻辑，相关用例失败；恢复后通过。

## 七、线上验证

### 7.1 端到端回放

把第四节获取的真实请求体通过网关回放

```
直连官方接口（不补齐）        400
经网关回放（补齐生效）        200，流式正常返回
```

### 7.2 部署状态

7.99 现网镜像为 `litellm-zhcn:v1.106.0-zh.15`，容器健康检查通过，readiness 返回 200。容器内两个补丁文件的 SHA256 与提交版本逐一比对一致。

## 八、部署方式说明

本次采用的是镜像叠加方式，没有从仓库完整重新打包。

7.99 原镜像 zh.9 的代码基线经过哈希比对，与补丁前版本完全一致。在此基础上用两行 Dockerfile 逐层替换单个文件

```dockerfile
FROM litellm-zhcn:v1.106.0-zh.9
COPY patched_transformation.py /app/.venv/lib/python3.13/site-packages/litellm/llms/deepseek/messages/transformation.py

FROM litellm-zhcn:v1.106.0-zh.14
COPY patched_chat_transformation.py /app/.venv/lib/python3.13/site-packages/litellm/llms/deepseek/chat/transformation.py
```

这样镜像里只有目标文件发生变化，仓库中其他未提交改动不会混入。回滚路径保留 zh.9、zh.14、zh.15 三个版本。

风险是镜像与仓库代码状态会长期漂移。建议本次验证稳定后，用 zayk-dev 指定提交做一次完整镜像构建并替换，避免后续维护时版本对应关系混乱。

## 九、后续建议

第一，推动客户端保留 reasoning_content。根因在客户端丢弃该字段，网关补齐只是兜底。DeepSeek Harness 讨论区第 3857 条已记录该问题，可以跟踪其修复进度。

第二，完整镜像构建。当前 7.99 是叠加镜像，建议在稳定观察一至两天后，用仓库提交做完整构建并切换。

第三，监控告警。建议对 `reasoning_content` 与 `content[].thinking` 两类错误配置计数告警，出现时第一时间发现。

第四，注意上游 LiteLLM 相关 PR（#32110）的实现是给消息补顶层 reasoning_content 字段，经真实接口验证该写法仍然返回 400，不能直接采纳，只能采用补齐 thinking 内容块或 reasoning_content 顶层字段之外的方案。
