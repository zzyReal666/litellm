# 第三方 DeepSeek 网关 Anthropic 兼容接口 thinking 内容缺失问题反馈

反馈日期：2026-11-05
反馈方：中安云科 AI 安全网关项目组
涉及端点：https://token-service-qy.hon-maas.com
涉及模型：deepseek-v4.1-flash-1017

## 一、问题摘要

贵方网关的 Anthropic 兼容接口（`POST /v1/messages`）在**非流式**响应中不返回 `thinking` 内容块，**流式**响应中返回了 `thinking` 块但缺少 `signature` 字段且不发送 `signature_delta` 事件。而同一模型通过贵方 OpenAI 兼容接口（`POST /v1/chat/completions`）请求时，响应中明确包含 `reasoning_content`，说明后端模型确实产生了推理内容，问题出在 Anthropic 兼容层的转换上。

该差异导致调用方在多轮工具调用会话中出现间歇性 400 失败，具体机制见第六节。

## 二、影响与现象

调用方在自己的网关中同时接入官方 DeepSeek 与贵方 1017 上游，作为同一模型名的多个部署做负载均衡。开启思考模式的多轮会话出现如下报错：

```
litellm.BadRequestError: DeepseekException - {"error":{"message":
"The `content[].thinking` in the thinking mode must be passed back to the API.
(request_id: 40639e77-8242-459a-9e18-8796723a462f)",
"type":"invalid_request_error","code":"invalid_request_error"}}
```

影响数据（Anthropic 格式请求，按天统计）：

| 日期 | 请求数 | 失败数 | 失败率 |
| --- | --- | --- | --- |
| 10-28 | 3323 | 2 | 0.06% |
| 10-29 | 3222 | 0 | 0.00% |
| 10-30 | 3831 | 3 | 0.08% |
| 11-02 | 1130 | 10 | 0.88% |
| 11-04 | 2726 | 121 | 4.44% |
| 11-05 | 714 | 122 | 17.09% |

10-28 至 11-02 的基线在 1% 以下，引入贵方 1017 上游后失败率快速上升。按部署拆分，失败集中在官方 DeepSeek 部署上，贵方部署自身几乎不报这类错误，符合第六节描述的机制。

## 三、环境信息

- 贵方网关：https://token-service-qy.hon-maas.com，OpenAI 兼容路径 `/v1/chat/completions`，Anthropic 兼容路径 `/v1/messages`
- 模型名：`deepseek-v4.1-flash-1017`
- 对照官方：https://api.deepseek.com，Anthropic 路径 `/anthropic/v1/messages`，OpenAI 路径 `/beta/chat/completions`
- 测试时间：2026-11-05 14:20 至 14:30（北京时间）
- 调用方客户端：claude-cli 各版本（Anthropic Messages 协议，工具调用场景）
- 推理服务栈：贵方响应头 `system_fingerprint` 为 `vllm-0.32.0-tp8-ep-b1ef5ac2`，即 vLLM 0.32.0 加张量并行 8 卡；官方响应头为 `bc19ba97cbe016479903222bb1578db6`
- 贵方网关版本：响应头 `llm_provider-x-litellm-version` 显示 LiteLLM 1.94.0，其上游 `llm_provider-x-litellm-model-api-base` 为 `http://10.201.1.20:30000/v1`，即 hon-maas 的 LiteLLM 网关后面还接了一层推理服务

## 四、复现方法

以下命令中的 `$API_KEY` 替换为贵方分配的密钥。

### 4.1 贵方 Anthropic 兼容接口（非流式）

```bash
curl -sS -X POST 'https://token-service-qy.hon-maas.com/v1/messages' \
  -H "x-api-key: $API_KEY" \
  -H 'anthropic-version: 2023-06-01' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "deepseek-v4.1-flash-1017",
    "max_tokens": 64,
    "thinking": {"type": "enabled", "budget_tokens": 16},
    "messages": [{"role": "user", "content": "2+2=? 只回答数字"}]
  }'
```

### 4.2 贵方 OpenAI 兼容接口（对照，证明后端有推理）

```bash
curl -sS -X POST 'https://token-service-qy.hon-maas.com/v1/chat/completions' \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "deepseek-v4.1-flash-1017",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "2+2=? 只回答数字"}]
  }'
```

### 4.3 官方 DeepSeek Anthropic 接口（期望基线）

```bash
curl -sS -X POST 'https://api.deepseek.com/anthropic/v1/messages' \
  -H "x-api-key: $DEEPSEEK_API_KEY" \
  -H 'anthropic-version: 2023-06-01' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "deepseek-v4-flash",
    "max_tokens": 64,
    "thinking": {"type": "enabled", "budget_tokens": 16},
    "messages": [{"role": "user", "content": "2+2=? 只回答数字"}]
  }'
```

### 4.4 流式请求（在 4.1 基础上加 `"stream": true`）

```bash
curl -sS -N -X POST 'https://token-service-qy.hon-maas.com/v1/messages' \
  -H "x-api-key: $API_KEY" \
  -H 'anthropic-version: 2023-06-01' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "deepseek-v4.1-flash-1017",
    "max_tokens": 48,
    "stream": true,
    "thinking": {"type": "enabled", "budget_tokens": 16},
    "messages": [{"role": "user", "content": "2+2=? 只回答数字"}]
  }'
```

## 五、实测结果对照

### 5.1 Anthropic 非流式响应

贵方返回（HTTP 200），`content` 中只有 `text`，没有 `thinking`：

```json
{
  "id": "chatcmpl-807ff61302daa271",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "4"}],
  "stop_reason": "end_turn",
  "model": "deepseek-v4.1-flash-1017",
  "usage": {"input_tokens": 38, "output_tokens": 26}
}
```

官方 DeepSeek 返回（HTTP 200），`content` 首位是 `thinking`，带 `signature`：

```json
{
  "id": "c78d9265-77e0-45ba-9517-168bfd444c05",
  "type": "message",
  "role": "assistant",
  "model": "deepseek-v4-flash",
  "content": [
    {
      "type": "thinking",
      "thinking": "We need answer in Chinese? User asks \"2+2=? 只回答数字\" means only answer number. Need output just 4.",
      "signature": "c78d9265-77e0-45ba-9517-168bfd444c05"
    },
    {"type": "text", "text": "4"}
  ],
  "stop_reason": "end_turn",
  "usage": {"input_tokens": 38, "output_tokens": 31}
}
```

### 5.2 Anthropic 流式响应

贵方事件序列（节选）：

```
event: message_start
event: content_block_start   -> content_block: {"type":"thinking"}           (无 signature 字段)
event: content_block_delta   -> delta: {"type":"thinking_delta"}
... 若干 thinking_delta ...
event: content_block_start   -> content_block: {"type":"text"}
event: content_block_delta   -> delta: {"type":"text_delta"}
```

官方 DeepSeek 事件序列（节选）：

```
event: message_start
event: content_block_start   -> content_block: {"type":"thinking","thinking":"","signature":""}   (含 signature 字段)
event: content_block_delta   -> delta: {"type":"thinking_delta"}
... 若干 thinking_delta ...
event: content_block_delta   -> delta: {"type":"signature_delta"}            (贵方缺失该事件)
event: content_block_start   -> content_block: {"type":"text"}
event: content_block_delta   -> delta: {"type":"text_delta"}
```

### 5.3 OpenAI 兼容接口（关键对照）

贵方 `POST /v1/chat/completions` 返回（HTTP 200），`reasoning_content` 完整存在：

```json
{
  "id": "chatcmpl-a4fc6cfab27c7bc5",
  "model": "deepseek-v4.1-flash-1017",
  "system_fingerprint": "vllm-0.32.0-tp8-ep-b1ef5ac2",
  "choices": [{
    "index": 0,
    "finish_reason": "stop",
    "message": {
      "role": "assistant",
      "content": "4",
      "reasoning_content": "We need answer only number. Need obey Chinese \"只回答数字\". 2+2=4.",
      "provider_specific_fields": {
        "reasoning": "We need answer only number. Need obey Chinese \"只回答数字\". 2+2=4."
      }
    }
  }],
  "usage": {
    "prompt_tokens": 38,
    "completion_tokens": 24,
    "total_tokens": 62,
    "completion_tokens_details": {"reasoning_tokens": 21}
  }
}
```

结论：后端 vLLM 确实产生了 21 个 reasoning token，OpenAI 兼容层正确透出，Anthropic 兼容层在非流式下丢弃了它，流式下丢失了签名。

补充一点关于签名的事实，供贵方评估实现成本。我方实测官方 DeepSeek 的 `signature` 内容就是该条消息的 `id` 本身，不是密码学签名，非流式和流式都如此：

```
非流式： id = 99de9e2d-06b8-4a2d-8865-6ce84fcba19e
        signature = 99de9e2d-06b8-4a2d-8865-6ce84fcba19e
        id = 43652d43-64a7-44be-b3c5-b0ae098f233a
        signature = 43652d43-64a7-44be-b3c5-b0ae098f233a
流式：   message_start.id = 4cf44c76-4231-47be-83cd-885ca1f43643
        signature_delta.signature = 4cf44c76-4231-47be-83cd-885ca1f43643
```

也就是说，补齐签名只需要把消息 id 回填到 thinking 块的 `signature` 字段和 `signature_delta` 事件里，不需要额外的密钥或签名算法。

## 六、差异分析与失败机制

需要特别说明的是，模型权重相同不代表接口行为相同。`thinking` 内容块和 `signature` 是 Anthropic 兼容层的封装，不是模型权重直接产出的。两侧的后端都产生了推理内容（第 5.3 节 OpenAI 格式对照可证），差异出在把推理内容映射成 Anthropic thinking 块这一层：官方网关实现了该映射并回填签名，贵方网关（LiteLLM 1.94.0）在非流式响应中未输出 thinking 块，在流式中未输出签名。

官方 DeepSeek 在思考模式下的校验规则（我方实测确认）：

| 场景 | 结果 |
| --- | --- |
| 助手历史含 `tool_use`，但没有 `thinking` 块 | HTTP 400，`The content[].thinking in the thinking mode must be passed back to the API` |
| 助手历史含 `tool_use`，且有 `thinking` 块（签名缺失、空串、伪造串均可） | HTTP 200 |
| 助手历史为纯文本，没有 `thinking` 块 | HTTP 200 |

也就是说，签名不是必须的，但**含工具调用的助手轮次必须携带 thinking 块**。

失败链路如下：

1. 调用方为多轮工具调用会话，客户端使用 Anthropic Messages 协议
2. 某一轮请求被负载均衡到贵方 1017 上游，贵方 Anthropic 兼容接口返回的助手消息不含 thinking 块（非流式）或不含签名（流式）
3. 客户端按返回内容存储该轮助手消息，其中不含可回传的 thinking 块
4. 下一轮请求被负载均衡到官方 DeepSeek 部署，历史中该工具调用轮次缺少 thinking 块，官方接口按上述规则返回 400

按负载均衡权重估算，上一轮落贵方、下一轮落官方的概率约为 1/3 乘 2/3 约 22%，与 11-05 实测失败率 17.09% 基本吻合。

我方已用官方接口直接复现该错误，请求 ID 为 `d8c79969-c835-4b5b-bd89-038b1f1c1e98` 和 `7bc0234d-94bd-459a-8705-e7cc44108081`。

## 七、期望贵方支持

1. **非流式 Anthropic 响应补回 thinking 块**。响应 `content` 数组中，对产生推理的轮次按官方格式返回 `{"type": "thinking", "thinking": "...", "signature": "..."}`，位置在 text 块之前，与官方 DeepSeek 保持一致。

2. **流式 Anthropic 响应补充签名**。`content_block_start` 的 thinking 块补上 `signature` 字段，并在 thinking 结束、text 开始之前发送 `signature_delta` 事件，事件顺序与官方一致。按第 5.3 节实测，官方签名即消息 id，补齐该字段不需要额外密钥或签名算法，实现成本很低。

3. **若 thinking 相关能力暂时无法提供，请给出明确行为约定**。例如在 Anthropic 兼容接口上关闭思考模式并保证响应中不声明 thinking，或在助手消息含 `tool_use` 时自动补一个占位 thinking 块，确保调用方拿到的消息可以原样回传。当前这种“后端有推理、Anthropic 层部分透出”的中间状态，会让调用方的多轮会话历史被污染，且错误发生在下游官方接口上，排查成本很高。

4. **请提供 thinking 模式支持状态说明和修复计划**，包括 vLLM 后端升级是否会影响该能力。我方当前需要决定是否将 1017 上游从混合部署中拆出，希望得到贵方明确时间预期。

## 八、补充说明

- 本文所有 `$API_KEY` 由贵方密钥替换，我方未在文档中保留任何明文密钥
- 复现时间为 2026-11-05，若贵方在此期间已修复，请以最新版本行为为准
- 如需我方提供完整抓包或调用方侧日志，可另行提供
