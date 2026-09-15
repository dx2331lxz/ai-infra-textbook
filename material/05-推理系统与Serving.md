# 05 · 推理系统与 Serving

> **本模块回答**：训好的模型，怎么低成本、低延迟地服务出去？

训练系统优化的是"吞吐"，推理系统要在**吞吐、延迟、成本**三者之间做取舍，而且要面对训练阶段不存在的敌人：**KV Cache**。

## 先建立推理的四个术语（全模块反复出现）

| 术语 | 含义 | 谁在乎 |
| --- | --- | --- |
| **TTFT** | Time To First Token，首 token 延迟，由 prefill 阶段决定 | 交互式应用（聊天） |
| **TPOT / ITL** | Time Per Output Token，每 token 生成时间，由 decode 阶段决定 | 所有生成式应用 |
| **Throughput** | 每秒总 token 数（含 prefill + decode） | 批处理、离线任务 |
| **Goodput** | 满足 SLO 前提下的有效吞吐 | 生产服务（最重要的指标） |

**两个阶段的性质完全不同，这是理解本模块一切设计的钥匙：**

| | Prefill（处理输入） | Decode（逐 token 生成） |
| --- | --- | --- |
| 计算特性 | 大矩阵乘，**算力受限** | 逐 token，**带宽受限**（权重每次都要全读一遍） |
| 并行度 | 高（序列长度天然并行） | 低（受 batch size 限制） |
| 主要成本 | 算力 | 显存带宽 + KV Cache 容量 |

---

## 前置知识

- 01 模块（能判断 prefill/decode 分别卡在哪一侧 —— 必须做到，否则本模块读不懂）。
- 03 模块的 FlashAttention 与 Flash-Decoding。
- 知道 KV Cache 是什么、为什么存在。

---

## 论文清单

### 1. 综述：先读地图，再读点

- [ ] **P0** · [Towards Efficient Generative Large Language Model Serving: A Survey from Algorithms to Systems](https://arxiv.org/abs/2312.15234) · 2023
  - **主旨**：把 LLM 服务优化的所有方向整理成一张地图：算法层（解码、架构、量化）与系统层（调度、内存、并行）。
  - **为什么读 / 读到什么程度**：**泛读但通读**。不要精读细节，把它当目录用——读完后你知道本模块的每一篇论文挂在哪一个格子里。
  - **前置知识**：上面的四个术语。
  - **建议用时**：2.5 小时。

- [ ] **P0** · [A Survey on Inference Optimization Techniques for Mixture of Experts Models](https://arxiv.org/abs/2412.14219) · **ACM Computing Surveys 2026**
  - **主旨**：第 1 篇的地图对 MoE 是**不够用的**——MoE 有一整批它不覆盖的特有难题：专家并行与 all-to-all 通信、专家卸载与缓存、稀疏计算、以及"不同专家的激活分布差异极大"给量化带来的麻烦。这篇综述把 MoE 推理优化的算法层、系统层、硬件层技术系统化梳理了一遍，242 篇参考文献，是目前这个方向覆盖面最全的一份。
  - **为什么读 / 读到什么程度**：**泛读但通读**，当目录用。读完你应该能回答："一个 MoE 推理系统，在算法、系统、硬件三层各有哪些可动的旋钮？"
  - **前置知识**：第 1 篇；以及 04 模块的 GShard / Switch Transformers / DeepSeekMoE（需要先知道 MoE 的基本结构，否则这篇读不下去）。
  - **建议用时**：3 小时。
  - **为什么值得单独列 P0**：如果你要做 MoE 相关的方向（压缩、端侧部署、推理加速），这篇是**最省时间的入口**——它能把 242 篇工作压缩成一张你能看懂的地图，比零散读方法论文效率高得多。
  - **发表信息**：ACM Computing Surveys, Vol. 58, Issue 10, pp. 1–37, 2026 年 3 月在线发表（DOI `10.1145/3794845`）。该刊是中科院计算机科学大类 **1 区 TOP**、Impact Factor 30+，是计算机领域综述的顶刊。⚠️ arXiv 页面上仍显示 "Under Review"，那是作者未更新元数据，实际已正式出版。

### 2. 连续批处理（Continuous Batching）的起点

- [ ] **P0** ⭐ · [Orca: A Distributed Serving System for Transformer-Based Generative Models](https://www.usenix.org/conference/osdi22/presentation/yu) · OSDI 2022
  - **主旨**：传统批推理必须等整个 batch 里最长的序列生成完才能返回，绝大部分时间在空转。Orca 提出 **iteration-level scheduling**：每个迭代（每生成一个 token）都重新决定这次要算哪些请求，新请求立刻可以插入。这就是后来所有推理引擎的"continuous batching"。
  - **为什么读 / 读到什么程度**：**精读**。理解"选择性批处理"（selective batching）如何把不同长度的请求拼在一起算。这是推理系统里**最关键的一次思想转变**。
  - **前置知识**：上面的 prefill/decode 对照表。
  - **建议用时**：3 小时。
  - **读完要能回答**：为什么 continuous batching 能提升几倍吞吐，代价是什么？（调度开销、可能影响单请求延迟。）

### 3. KV Cache 的内存管理

- [ ] **P0** ⭐ · [Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) · SOSP 2023
  - **主旨**：KV Cache 若按"每个请求预分配最大长度"来存，会造成巨大的内部碎片，**显存利用率常常不到 40%**。论文借鉴操作系统虚拟内存分页：把 KV Cache 切成固定大小的 block，用 block table 做映射，按需分配、可共享（如并行采样、前缀共享）。这就是 vLLM。
  - **为什么读 / 读到什么程度**：**精读**。必须搞懂：(1) 碎片是怎么产生的；(2) block table 与 copy-on-write 如何支持共享；(3) 为什么显存利用率提升会直接转化为 batch size 提升、进而转化为吞吐提升。
  - **前置知识**：第 2 篇；操作系统的分页（CSAPP 第 9 章，可作为补充）。
  - **建议用时**：3.5 小时。
  - **中文导读**：vLLM 的中文解读非常多，可搜「vLLM PagedAttention 精读」。
  - **为什么它重要**：它把"内存管理"这个经典操作系统问题重新带回了 AI 系统，也启发了后面一整批 KV Cache 优化工作。

### 4. 用算力换带宽：投机解码

- [ ] **P0** ⭐ · [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) · ICML 2023
  - **主旨**：decode 是带宽受限的，算力是富余的。那就用一个小模型（draft model）先投机生成 γ 个 token，再用大模型一次性并行验证，接受最长的正确前缀。**在不改变输出分布的前提下**加速 2–3 倍。
  - **为什么读 / 读到什么程度**：**精读**。重点理解：(1) 为什么一次前向可以验证多个 token（并行验证）；(2) 接受/拒绝规则为什么能保证分布不变；(3) 加速比与接受率的关系。
  - **前置知识**：01 模块的 roofline（不然无法理解"为什么这是划算的"）。
  - **建议用时**：3 小时。
  - **读完要能回答**：什么时候投机解码反而会变慢？（接受率低、draft 模型本身开销大、batch 已经很大时。）

### 5. 量化：降低带宽需求的最直接手段

- [ ] **P0** ⭐ · [AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration](https://arxiv.org/abs/2306.00978) · MLSys 2024
  - **主旨**：LLM 权重里只有极少数"重要"通道（对应激活值大的那些）需要高精度。AWQ 不做权重量化本身的最优化，而是**按激活分布对重要通道做保护性缩放**，从而在 INT4 下保持精度。
  - **为什么读 / 读到什么程度**：**精读机制、泛读推导**。重点理解"为什么不能简单地按权重绝对值决定重要性"。
  - **前置知识**：01 模块的量化综述（异常值问题）。
  - **建议用时**：3 小时。
  - **配套对照**（都读，才能理解量化这条线的全貌）：
    - [ ] **P1** · [GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers](https://arxiv.org/abs/2210.17323) · ICLR 2023 —— 逐层二阶误差补偿，把权重压到 3–4 bit。
    - [ ] **P1** · [SmoothQuant: Accurate and Efficient Post-Training Quantization for LLMs](https://arxiv.org/abs/2211.10438) · ICML 2023 —— 把激活的量化难度"迁移"给权重，使 W8A8 成为可能。
    - [ ] **P1** · [LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale](https://arxiv.org/abs/2208.07339) · NeurIPS 2022 —— 首次系统揭示 LLM 激活中的**异常值通道**问题，是做量化的必读前置。
  - **说明**：这四条构成一个完整的小专题。如果时间紧，读 AWQ + LLM.int8() 两篇即可自洽。

### 阶段 B：调度与部署架构

#### 6. Chunked Prefill

- [ ] **P1** · [Taming Throughput-Latency Tradeoff in LLM Inference with Sarathi-Serve](https://arxiv.org/abs/2403.02310) · OSDI 2024（[会议页](https://www.usenix.org/conference/osdi24/presentation/agrawal)）
  - **主旨**：长的 prefill 会阻塞 batch 里所有正在 decode 的请求，导致 token 间隔抖动（生成卡顿）。Sarathi-Serve 把 prefill 切成小块（chunk）混进 decode 批次，让生成过程平滑，从而能在满足延迟 SLO 的前提下塞进更大的 batch。
  - **为什么读 / 读到什么程度**：**泛读**。理解"prefill 与 decode 争抢资源"这个问题本身，比记住方案更重要。
  - **前置知识**：第 2 篇。
  - **建议用时**：2 小时。

#### 7. Prefill/Decode 分离部署（PD 分离）

- [ ] **P1** · [DistServe: Disaggregating Prefill and Decoding for Goodput-optimized LLM Serving](https://arxiv.org/abs/2401.09670) · OSDI 2024（[会议页](https://www.usenix.org/conference/osdi24/presentation/zhong-yinmin)）
  - **主旨**：既然 prefill 是算力受限、decode 是带宽受限，把它们放在同一张卡上会互相拖累，也无法各自独立调参（并行度、batch size 的最优解不同）。那就拆到不同的机器上，各自优化，中间传 KV Cache。
  - **为什么读 / 读到什么程度**：**泛读**。重点理解"为什么混在一起无法同时达到各自的最优"。
  - **前置知识**：第 2、6 篇。
  - **建议用时**：2 小时。

- [ ] **P1** · [Splitwise: Efficient Generative LLM Inference Using Phase Splitting](https://arxiv.org/abs/2311.18677) · ISCA 2024
  - **主旨**：从硬件与成本角度论证阶段分离：prefill 阶段可以用计算更强的机器，decode 阶段需要更大的显存带宽和容量，甚至可以复用上一代硬件。
  - **为什么读 / 读到什么程度**：**泛读**。与 DistServe 互补，重点看成本分析。
  - **建议用时**：1.5 小时。

#### 8. 前缀复用与结构化生成

- [ ] **P1** · [SGLang: Efficient Execution of Structured Language Model Programs](https://arxiv.org/abs/2312.07104) · NeurIPS 2024
  - **主旨**：真实应用里大量请求共享相同前缀（少样本示例、系统提示、多轮对话历史）。RadixAttention 用**基数树（radix tree）**管理 KV Cache 前缀，实现自动复用与淘汰；同时为结构化输出（约束解码）提供高效运行时。
  - **为什么读 / 读到什么程度**：**泛读**。重点看 RadixAttention 的复用/淘汰策略。
  - **前置知识**：第 3 篇（PagedAttention 的 block 管理）。
  - **建议用时**：2 小时。

### 阶段 C：工程实现与投机解码的工程化

#### 9. DeepSpeed-Inference

- [ ] **P1** · [DeepSpeed-Inference: Enabling Efficient Inference of Transformer Models at Unprecedented Scale](https://arxiv.org/abs/2207.00032) · SC 2022
  - **主旨**：多 GPU 推理的系统实现：张量并行、流水线并行在推理场景怎么用，以及如何在延迟约束下做 kernel 注入与量化。
  - **为什么读 / 读到什么程度**：**泛读**。它是"训练系统的并行技术搬到推理"的代表作，可对照 04 模块看差异。
  - **前置知识**：04 模块第 3 篇、本模块第 2 篇。
  - **建议用时**：2 小时。

#### 10. 投机解码的工程化路线

- [ ] **P1** · [Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) · ICML 2024
- [ ] **P1** · [EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) · ICML 2024
  - **主旨**：第 4 篇的投机解码需要单独训练一个 draft 模型，工程成本高。Medusa 在原有模型上加几个解码头；EAGLE 在特征层做自回归预测。都在追求"接受率更高、额外开销更小"。
  - **为什么读 / 读到什么程度**：**泛读**。两篇对比读，理解"如何在保持接受率的前提下降低 draft 的成本"。
  - **前置知识**：第 4 篇。
  - **建议用时**：2 小时（两篇合计）。

### 阶段 D：工业实践与补充（P2）

- [ ] **P2** · [Mooncake: A KVCache-centric Disaggregated Architecture for LLM Serving](https://arxiv.org/abs/2407.00079) · FAST 2025 —— 以 KV Cache 为中心、利用闲置 GPU/CPU/SSD 组成分层缓存池的生产级架构。**当前推理系统研究最值得关注的方向之一**。
- [ ] **P2** · [TensorRT-LLM 官方仓库](https://github.com/NVIDIA/TensorRT-LLM) —— 工业界最强推理引擎开源实现，看它的文档能知道"生产环境的优化清单"长什么样。
- [ ] **P2** · [Efficiently Scaling Transformer Inference](https://arxiv.org/abs/2211.05102) · 2022 —— 系统分析推理的算力/带宽/显存约束与"最优并行配置"，是理解 decode 为什么带宽受限的严谨推导。
- [ ] **P2** · [LLM Inference Serving: Survey of Recent Advances and Opportunities](https://arxiv.org/abs/2407.12391) · 2024 —— 更新的综述，可作为 2024 年后的补充地图。

---

## 动手验证（这两周必做）

1. **（必做）跑通并压测 vLLM**：本地跑通 vLLM 起一个小模型，用不同并发数（1 / 8 / 32 / 128）压测，记录**TTFT、TPOT、吞吐**三条曲线。你会亲眼看到"吞吐上升、延迟恶化"的权衡曲线——这就是本模块所有论文在优化的目标函数。
2. **（必做）验证 KV Cache 的瓶颈**：对同一个模型，比较 `max_model_len` 或 `gpu_memory_utilization` 不同时的最大并发 batch。理解为什么"显存管理"能直接换成吞吐。
3. **估算一次**：用 01 模块的 roofline，估算一个 7B 模型 FP16 在 batch=1 时的理论 TPOT 下界。
4. **（可选）试一次量化与投机解码**：用 vLLM 或 TensorRT-LLM 分别开/关 AWQ 量化与投机解码，对比吞吐与输出质量。

---

## 演进链（谁替代了谁）

```
静态批处理（等最长的请求）—— 空转严重
    ↓
Orca（2022）：iteration-level scheduling = continuous batching —— 事实标准
    ↓
KV Cache 碎片成为新瓶颈
    ↓
PagedAttention / vLLM（2023）：分页管理 KV Cache —— 又一个事实标准
    ↓
  ├─ Sarathi-Serve（2024）：chunked prefill，解决 prefill 干扰 decode
  ├─ DistServe / Splitwise（2024）：PD 分离，两个阶段各自最优
  ├─ SGLang（2024）：RadixAttention，前缀复用
  └─ Mooncake（2025）：KV Cache 分层池化，跨实例共享

正交的另一条线（降低带宽需求本身）：
LLM.int8()（2022，发现异常值）→ GPTQ / SmoothQuant（2023）→ AWQ（2024）
投机解码（2023 理论）→ Medusa / EAGLE（2024 工程化）
```

---

## 读完自检

- [ ] 能不看资料画出 prefill/decode 的特性对照表，并解释各自卡在算力还是带宽。
- [ ] 能说清 continuous batching 与传统批处理的区别，以及它为什么能提升数倍吞吐。
- [ ] 能解释 KV Cache 的碎片问题，以及分页管理为什么能解决它。
- [ ] 能解释投机解码在不改变输出分布的前提下为什么正确。
- [ ] 能说出"提高吞吐"的四条不同技术路线（调度、显存管理、量化、投机/分离），并说明各自代价。

> 做到最后一条，你就能读懂任何一篇新出的推理系统论文——它们几乎都落在这四条路线之一。
