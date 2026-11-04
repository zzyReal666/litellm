# 7.99 调用量分析与 DeepSeek 本地化部署评估

数据采集时间：2026-09-11 02:50 UTC
数据来源：`http://192.168.7.99:9090`（Prometheus 2.55.1，抓取 `litellm:4000/metrics/`，15 秒间隔）

## 一、调用量实测

### 1.1 关键前提：计数器窗口只有 16 小时

LiteLLM 的 Prometheus 计数器是进程内累加的，7.99 上的容器在 2026-09-10 10:09 UTC 重启过（`litellm_input_tokens_metric_created` 最早样本），所以下面所有绝对值只覆盖约 16 小时。跨天趋势我用 `increase()` 重叠区间来估，不受重启影响。

### 1.2 16 小时窗口内的累计量

| 指标 | 数值 |
|---|---|
| 请求数 | 3,476 |
| 输入 tokens | 344,582,269 |
| 输出 tokens | 3,503,375 |
| 合计 tokens | 348,085,644 |
| 账单金额（proxy 口径） | $19.44 |
| 活跃用户 | 19 |
| 失败计数（指标原始值） | 165，其中真实 LLM 调用失败 68（约 2.0%），其余 115 是仪表盘噪音，详见第四节 |
| 缓存命中输入 tokens | 331,643,006（占输入 96.2%） |

### 1.3 按模型拆分

| 模型 | 请求数 | 输入 tokens | 输出 tokens | 平均时延 |
|---|---|---|---|---|
| deepseek-v4-flash | 1,892 | 175,429,478 | 1,582,428 | 6.2s |
| deepseek-v4-pro | 585 | 88,937,756 | 720,204 | 27.8s |
| deepseek-flash | 571 | 48,983,472 | 756,125 | 8.5s |
| deepseek-v4.1-flash-… | 418 | 31,754,635 | 443,106 | 9.7s |
| MCP / vision / chat | 9 | 2,493 | 4,171 | — |

注意 `deepseek-v4-flash`、`deepseek-flash`、`deepseek-v4.1-flash-…` 的 `model_id` 全是同一个（`fcb58681`），即同一部署被多个别名指向，去重后实际只有三个上游：V4-Flash 系、V4-Pro（`39d181f0`）、vision-exp（`57f7640c`）。业务上简化为 flash 类和 pro 类即可。

### 1.4 请求画像：典型 Agent / Coding 负载

| 维度 | 数值 |
|---|---|
| 平均每次输入 | 99,176 tokens |
| 平均每次输出 | 1,012 tokens |
| 输入:输出 | 98 : 1 |
| 缓存命中率 | 96.2% |
| 平均时延 | flash 6.2s，pro 27.8s |
| P95 时延 | flash 22s，pro 90.9s |
| 峰值并发（in-flight） | 35 |
| 峰值吞吐 | 467M tokens/小时 ≈ 130,000 tokens/秒 |

单请求近 10 万输入、1 千输出、96% 缓存命中，这是长上下文 Agent 的教科书特征（Claude Code / Codex / OpenCode 这类工具反复携带整个仓库上下文），不是人机对话。对人机对话做容量推算会严重高估。

### 1.5 时间分布

流量全部落在北京时间 09:00 到 18:00（UTC 01:00 到 10:00），其余时段近乎为零。峰值出现在上午 10:00 到 12:00。

日用量（`increase()` 估算）：

```
09-05    423.8 M
09-07     35.2 M   （周末）
09-08    570.1 M
09-09    942.3 M
09-10  1,346.5 M
09-11  2,140.0 M   （含 09-10 重启丢量，实际更高）
```

一周内日用量涨了约 3 到 5 倍，按最近三天均值 1.0 到 1.4 G tokens/天推算，月度约 **30 到 40 G tokens**。

### 1.6 按官方价重算的真实账单

DeepSeek 官网现行价（美元 / 百万 tokens，高峰时段是低谷的 2 倍）：

| | flash 缓存命中 | flash 缓存未命中 | flash 输出 | pro 缓存命中 | pro 缓存未命中 | pro 输出 |
|---|---|---|---|---|---|---|
| 低谷 | $0.003 | $0.15 | $0.60 | $0.022 | $0.66 | $1.98 |
| 高峰 | $0.006 | $0.30 | $1.20 | $0.044 | $1.32 | $3.96 |

按 16 小时窗口的 token 结构换算（业务时段正好横跨高峰与低谷，按各半折算）：

| 项目 | 用量 | 金额 |
|---|---|---|
| flash 缓存命中输入 | 273.0 M | $1.23 |
| flash 缓存未命中输入 | 14.7 M | $3.32 |
| flash 输出 | 2.8 M | $2.60 |
| pro 缓存命中输入 | 58.6 M | $1.93 |
| pro 缓存未命中输入 | 4.7 M | $4.64 |
| pro 输出 | 0.72 M | $2.14 |
| **合计（16 小时）** | | **$15.86** |
| **月度外推** | | **约 $710 / 月，折合人民币约 5,100 元** |

两个校准结论：

1. proxy 自己记的 $19.44 和按官网价重算的 $15.86 很接近（差 20% 左右），说明 proxy 侧计价口径基本可靠，可以直接看 Admin UI 的 spend 页。之前看到 pro 单价 $1.32/M 是高峰价、flash $0.44/M 接近高峰价，把平价时段的量算贵了，这个偏差就是这个 20%。
2. 还有一个必须知道的变化：官网明确写了自 2026-09-14 12:00（北京时间）起，`deepseek-v4-pro` 的请求全部路由到 V4.1 Flash 并按 Flash 价格计费，V4 Pro 开始有序下线。对 7.99 的影响是 pro 那部分单价从 $1.32/$3.96 降到 $0.30/$1.20，**月度账单还会再降三到四成**，落到大约 3,000 到 3,500 元/月。

## 二、本地部署 DeepSeek 的硬件规格

### 2.1 要对标的是哪个模型

线上跑的是 V4.1 Flash 和 V4 Pro，两者都是 1M 上下文。V4 Pro 在 9-14 之后下线，所以自部署目标应该定成 **DeepSeek-V4.1-Flash**。

| 规格 | 数值 |
|---|---|
| 许可证 | MIT，可商用、可改、可再分发 |
| 骨干参数 | 552 B（含视觉编码器 763 B） |
| 每 token 激活 | prefill 8 B，decode 16 B |
| 专家 | 384 路由 + 1 共享，每 token 激活 6 个 |
| 层结构 | 40 层，20 encoder + 20 decoder |
| 上下文 | 1,048,576 tokens |
| KV cache | 890 字节/token（FP4），1M 上下文约 0.9 GB |
| 官方权重 | 510.3 GB，48 个 safetensors 分片，FP4 专家 + FP8 其余 |
| 显存换算 | 8 bit 约 552 GB，4 bit 约 280 GB |

关键点：**激活参数只有 16B，算力不是问题，显存才是墙**。MoE 的路由是动态的，552 B 里每一个专家都必须能随时被寻址，所以不能靠"只用 16B"把显存省下来。好消息是 KV cache 被压到了 890 字节/token，1M 上下文只要 0.9 GB，长上下文在这个模型上几乎不占显存。

### 2.2 推荐配置

| 档位 | 配置 | 可用性 |
|---|---|---|
| 生产推荐 | 8 × 80GB 卡（H200 / B200 / B300），单机 TP8 + EP | 8 bit 权重放得下，还能留出 batch 余量 |
| 生产最低 | 4 × 80GB 卡 | 只够放 4 bit 权重，余量很薄 |
| 可跑但不实用 | 512GB 内存工作站 + 1 到 2 张卡做 CPU offload | decode 要走 DDR5 带宽，只适合跑批和过夜评测 |
| 玩具 | Mac Studio 512GB 或 SSD 流式加载 | 约 1 token/秒 |

vLLM 已有官方 recipe（`vllm serve --tensor-parallel-size 8`，配置清单见 `vllm-project/recipes` 仓库的 `models/deepseek-ai/DeepSeek-V4.1-Flash.yaml`，页面 `recipes.vllm.ai`）。recipe 给出的硬指标：`vram_minimum_gb: 614`、vLLM 0.30.0+、必须用专用镜像 `vllm/vllm-openai:deepseekv41-flash`（官方明确写了没有 pip wheel 支持这个架构）。已实测验证的加速卡是 H200、GB200、GB300、MI350X。H200 单机跑 284B 的 V4-Flash 时官方推荐 `--data-parallel-size 4` 占 8 卡中的 4 张，用 522B 的 V4.1-Flash 则是 `vram_minimum_gb: 614` 意味着 8 卡 80GB 节点刚够放下权重加 KV cache，1M 上下文还要另外压 batch。另有 8 × RTX PRO 6000（96GB）的验证配置，这条线便宜得多，值得单独询价。

### 2.3 我们的量需要多少卡

按实测负载算一下。峰值吞吐 130,000 tokens/秒里 96% 是缓存命中的输入，真正的 decode 输出只有约 2,400 tokens/秒，需要靠 prefill 重新算的输入约 5,000 tokens/秒（13 万减去命中部分和输出）。

单台 8 卡 H200 跑 prefill 轻松，但 decode 是瓶颈：按保守的每卡 200 tokens/秒生成能力估算，8 卡约 1,600 tokens/秒，低于峰值 2,400 的需求。所以**要覆盖峰值并留冗余，按 2 台 8 卡 H200（16 卡）配置**。实测峰值并发只有 35，瓶颈不在并发数，而在输出吞吐。

这里有个容易被忽略的账：API 是按实际用量付费，自部署要按峰值容量买单。2 台节点的 token 处理量只用到硬件能力的 20% 到 30%，这个利用率差距正是自部署在成本上吃亏的根源。

需要提前知道的坑：

1. 7.99 的 96% 缓存命中率是 DeepSeek 服务端 KV 缓存带来的。自部署后要自己用 vLLM 的 prefix caching 复现这个命中率，否则显存全花在重复 prefill 上，8 卡可能不够。
2. 自部署几乎不可能复现 500 到 2,500 的并发许可和 1M 上下文下的稳定 P95。V4 Pro 现在 P95 已经 90 秒。
3. 权重是最小 168.9 GB（2 bit）到 510 GB（官方）的下载量，内网要按小时级规划带宽，还要留出 1 TB 以上本地盘。

## 三、价格

### 3.1 H200 与 B300 的行情

| 渠道 | 配置 | 价格 |
|---|---|---|
| 国内官方渠道（2026-01 报道） | 8 × H200 整机柜 | 150 万元（单卡 2.7 万美元） |
| 国际市场 | 8 × H200 服务器 | 32 到 35 万美元 |
| 国际市场 | 8 × B300 服务器 | 65 到 67 万美元 |
| 国内渠道商（2026-04） | 8 × H200 | 约 360 万元 |
| 国内渠道商（2026-07） | 8 × H200 | 超过 400 万元 |
| 国内渠道商（2026-08） | 8 × H200 | 超过 500 万元，溢价超 80% |
| 国内渠道商（2026-04 / 06 / 08） | 8 × B300 | 400-500 万 / 800-900 万 / 1,300-1,500 万元 |
| 租赁参考 | 8 × H200 | 12 到 15 万元/月 |

出口管制导致国内实际成交价与国际报价脱节，8 卡 H200 从 4 月的 360 万涨到 8 月的 500 万以上，B300 涨到 1,300 万以上且基本有价无市。做预算时**必须按国内渠道价，不能按 150 万或 32 万美元算**。

### 3.2 三年总拥有成本（2 台 8 卡 H200，国内渠道价）

| 项目 | 金额 |
|---|---|
| 硬件采购（2 台 × 500 万元） | 1,000 万元 |
| 电费（单台 8 卡整机约 6.6 kW，2 台 13.2 kW，0.8 元/度，日均满载 40%，3 年） | 约 46 万元 |
| 机柜、带宽、运维 | 约 30 到 60 万元 |
| **3 年合计** | **约 1,080 到 1,110 万元，年均约 365 万元** |

按 5 年折旧，年均摊约 200 万元，加运维约 215 万元。如果只用 1 台（接受峰值降级），3 年约 550 万元，年均约 185 万元。

### 3.3 与继续用 API 对比

| 方案 | 月成本 | 3 年成本 |
|---|---|---|
| 继续用 DeepSeek API（当前量，9-14 降价后） | 约 0.3 到 0.35 万元 | 约 11 到 13 万元 |
| 自部署（1 台 8 卡 H200） | 约 14 到 15 万元 | 约 550 万元 |
| 自部署（2 台 8 卡 H200） | 约 30 万元 | 约 1,100 万元 |

**回本周期 40 到 90 个月（1 台口径），远超 GPU 服务器的 5 年折旧周期。按当前调用量，纯从成本算，自部署不成立，要差 40 到 90 倍。**

反过来说，月调用量要涨到大约 **1.5 到 2 T tokens**（现在的 40 到 60 倍）时，1 台 8 卡 H200 的成本才和 API 打平；按 2 台覆盖峰值算是 3 到 4 T tokens。现在月用量 30 到 40 G tokens，差距接近两个数量级，靠自然增长追不上，而模型届时早就换代了。

### 3.4 什么情况下才该自部署

成本不是唯一理由，下面这些理由成立时自部署才有意义：

1. 数据不能出内网。代码、财务、客户数据有硬性合规要求，这条通常是最真实的驱动力
2. 已经有闲置的 8 卡节点，边际成本只是电费
3. 需要改权重或做微调，API 做不到
4. 需要绝对的可用性和限流豁免，不能被上游限流或下线影响（V4 Pro 9-14 下线就是一个现成例子）

如果只是为了省钱，答案是否定的。还有一个现实约束：出口管制下国内很难通过合规渠道拿到 H200 和 B300，采购周期和合规风险要单独评估；昇腾等国产卡路线需要单独验证 V4.1-Flash 的适配情况，官方目前只给了 NVIDIA 和 AMD 的 recipe。

## 四、失败请求归因

`litellm_proxy_failed_requests_metric_total` 上带 `exception_class`、`exception_status`、`route`、`requested_model`、`user_agent` 标签，归因是精确的。

### 4.1 先去掉噪音：165 里只有 68 是真实失败

| 分类 | 次数 | 说明 |
|---|---|---|
| 仪表盘 / 健康检查类异常 | 115 | `route` 是 `/config/list`、`/health/readiness/details`、`/health/license`、`/api/plugins`、`/credentials` 等 |
| 真实 LLM 调用失败 | 68 | `route` 是 `/v1/chat/completions` 或 `/v1/messages` |

那些 `exception_class="Exception"` 且 `exception_status="None"` 的，是 Admin UI 页面在调自身后端时抛的，跟模型调用无关。它们占了失败计数的 70%，如果不拆开看，会把真实失败率从 2% 误读成 5%。

真实失败率 = 68 / 3,768（总请求，成功加失败）= **1.8%**；按 68 / 3,477（成功请求）算是 2.0%。

### 4.2 真实失败的六类原因

| 次数 | 异常 | requested_model | 根因 |
|---|---|---|---|
| 18 | `BadRequestError` 400 | `deepseek-v4.1-flash` | 代理里没有这个模型组，客户端在用一个不存在的名字 |
| 17 | `ReadTimeout` | `deepseek-v4-flash` | 读超时，长上下文请求超时 |
| 13 | `Deepseek.BadRequestError` 400 | `deepseek-v4-flash-vision` / `deepseek-v4.1-flash-vision` / `deepseek-v4-pro` | 上游拒绝，请求体里的模型名上游不认 |
| 12 | `ReadTimeout` | `deepseek-v4-pro` / `deepseek-v4.1-flash-…` | 读超时集中在 pro（P95 已经 90.9 秒） |
| 4 | `Deepseek.ContextWindowExceededError` 400 | `deepseek-v4-pro` | 超 1M 上下文，Agent 累积上下文太长 |
| 3 | `ReadError` | `deepseek-v4-pro` / `deepseek-v4.1-flash-…` | 连接在读响应时断了 |

### 4.3 最大占比：模型名不存在（约 34 次，占真实失败的一半）

代理实际只暴露这些 `deepseek-v4.1-flash` 之外的名字：

```
deepseek/flash 组：deepseek-flash、deepseek-v4-flash、deepseek/deepseek-v4-flash、
                  deepseek-v4-flash-vision-exp、deepseek/deepseek-v4-flash-vision-exp
deepseek/pro 组：  deepseek-v4-pro、deepseek/deepseek-v4-pro
其他：            deepseek-chat、deepseek-reasoner、deepseek-coder、deepseek/*、
                  deepseek/deepseek-v3、deepseek/deepseek-v3.2、deepseek/deepseek-r1
```

**没有 `deepseek-v4.1-flash` 这个名字。**实测复现（用线上代理直连调用）：

```
$ curl -H "Authorization: Bearer <key>" -d '{"model":"deepseek-v4.1-flash",...}' \
    http://192.168.7.99:4000/v1/chat/completions
{"error":{"message":"litellm.BadRequestError: You passed in model=deepseek-v4.1-flash.
 There are no healthy deployments for this model. Received Model Group=deepseek-v4.1-flash
 Available Model Group Fallbacks=None","code":"400"}}
```

报错文案和指标里的 `BadRequestError` 完全吻合。而且这 17 次全部发生在 **09-10 09:00 UTC 之后**，也就是 DeepSeek 把 `deepseek-flash` 切到 V4.1-Flash 那段时间前后，客户端跟着把模型名改成 `deepseek-v4.1-flash`，但代理里没有对应的组。**这是一条正在增长、且完全可以避免的失败。**

另外 13 次 `Deepseek.BadRequestError` 是另一回事：请求被路由到了上游并被上游拒绝，模型名形如 `deepseek/deepseek-v4-flash-vision`、`deepseek-v4.1-flash-vision`，这些是客户端拼出来的名字，上游 DeepSeek 没有这些模型。

### 4.4 谁在报错

| user_agent | 失败数 |
|---|---|
| `Codex Desktop/0.140.0-alpha.2` | 18 |
| `pi (darwin; arm64)` | 14 |
| `ZCode/*` | 11 |
| `Codex Desktop/0.153.4` | 3 |

集中在三四个客户端，说明是客户端侧硬编码的模型名不一致，不是代理整体不稳。

### 4.5 时间分布

失败集中在工作时间，和流量同相位：

```
09-08 09:00-11:00 UTC   44
09-10 07:00-10:00 UTC   91   （模型名问题开始出现）
09-11 01:00-03:00 UTC   81
```

其余日期每小时都在个位数。**失败率本身没有恶化，恶化的是"模型名不存在"这一类**，从 09-10 才开始出现，并且 09-10 到 09-11 两天就贡献了 17 次。

### 4.6 处理建议

1. 最高优先级：把 `deepseek-v4.1-flash` 加进代理的模型列表（或统一让客户端改用 `deepseek-flash`）。这一项能消掉真实失败的一半
2. 通知 Codex Desktop、pi、ZCode 的这几个使用者，把客户端里硬编码的模型名改成 `/v1/models` 返回的名字。硬编码名字在下游模型换代时一定会再次踩坑
3. 12 次 `ReadTimeout` 集中在 pro，和 pro 的 P95 90.9 秒是同一个问题。V4 Pro 9-14 下线后会自动缓解，但如果有长任务依赖 pro，需要现在就降级到 flash
4. 4 次 `ContextWindowExceededError` 是 Agent 上下文累积到 1M 上限。给客户端加上下文裁剪，或在代理侧对超长请求做前置拦截，让错误更早、更明确
5. 建议给 Prometheus 加一条按 `route` 过滤的告警规则，把仪表盘噪音排除掉，否则真实失败率会被 115 次噪音淹没

## 五、建议

1. 短期不动自部署，继续用 API，把精力放在把缓存命中率维持在 96% 以上，这是当前成本结构里最关键的一项
2. 让 proxy 的计价跟上 9-14 的 V4 Pro 下线变更，否则 Admin UI 的 spend 会和真实账单继续偏 20%
3. 先修模型名不存在这一类失败，它占真实失败的一半，而且现在还在增长（见 4.3、4.6）
4. 持续记录月度 token 用量。等到稳定超过 40 到 50 G tokens/月时再启动选型，那时把 8 × RTX PRO 6000 和国产卡一起询价，不要只盯着 H200
