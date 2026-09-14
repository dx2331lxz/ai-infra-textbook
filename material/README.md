# AI Infra 基础论文阅读清单

给"会写模型、但系统与体系结构底子薄"的人用的一条 AI Infra 主干阅读路线。
目标不是读完所有论文，而是**建立一套共同语言**：看到任何一篇新的 Infra 论文或技术博客，你能立刻判断它在整个系统里处于哪一层、在优化什么指标、代价是什么。

---

## 一、怎么用这份清单

三种读法，按你的时间挑一种：

| 读法 | 时间投入 | 做什么 |
| --- | --- | --- |
| **1 小时速览版** | 1 小时 | 从下面「P0 必读」里挑 5–8 篇（每个模块挑 1 篇），每篇只读摘要 + 图 1 + 结论。目的是建立全景，不追求理解细节。 |
| **12 周标准版**（推荐） | 每周 8–10 小时 | 按第二~八节顺序，每周 2–3 篇，配合每个模块末尾的「动手验证」。这是本清单设计的默认路径。 |
| **深挖版** | 3–6 个月 | 标准版 + P1/P2 全读，并对 16 篇精读论文做笔记、复现关键实验或读源码。 |

### 一条最重要的阅读纪律

**不要从最新论文开始读。** AI Infra 的每一篇新论文都在解决前面论文留下的问题，跳过前面的，后面的只能是名词记忆。
本清单的模块顺序 `01 → 02 → 03 → 04/05 → 06/07 → 08` 就是依赖顺序，模块内**文件里从上到下的顺序就是阅读顺序**，不要打乱。

---

## 二、优先级图例

| 标记 | 含义 | 读到什么程度 |
| --- | --- | --- |
| **P0** ⭐ | 必读。构成 AI Infra 的共同语言，不读它后面看不懂 | 精读：能自己讲出它解决了什么问题、核心机制是什么、代价在哪。标"泛读"的 P0 只需读懂主图与结论 |
| **P1** | 应读。是 P0 的自然延伸，或某个子方向的代表作 | 泛读：读懂摘要、系统图、实验里最关键的一个对比即可 |
| **P2** | 选读。按兴趣或工作方向挑，用来判断前沿走向 | 扫读：只看摘要与结论，知道"有这么个方向"就够 |

**全库规模**：P0 **24 篇**（其中标 ⭐ 的 **16 篇**需要精读，其余读懂主图与结论即可），P1 **38 篇**，P2 **30 条**（含若干"按需检索某方向综述"的开放条目，不是固定论文）。模块 08 会重复引用前序模块的论文，所以条目总数大于去重后的论文数。

判断你"入门了"的标准很简单：**P0 全部读完，并且能用自己的话解释下面第三节里的模块依赖图。**

---

## 三、模块依赖图

```
                    ┌─────────────────────────────┐
                    │ 01 体系结构与性能模型        │  ← 一切的判断依据：
                    │    Roofline / TPU / 加速器   │    "这是算力受限还是带宽受限？"
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ 02 框架与自动微分            │  ← 你已经在用的 PyTorch
                    │    动态图 / autodiff / 显存  │    到底在背后做了什么
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │ 03 GPU 编程与算子优化        │  ← 所有上层优化的物理边界
                    │    FlashAttention / Triton   │
                    └────────┬────────────┬───────┘
                             │            │
          ┌──────────────────▼──┐   ┌─────▼──────────────────┐
          │ 04 训练系统与并行策略 │   │ 05 推理系统与 Serving   │  ← 求职/科研的两大主战场
          │ ZeRO / Megatron / FSDP│   │ Orca / vLLM / 量化     │
          └──────────┬───────────┘   └────────────┬───────────┘
                     └───────────┬────────────────┘
                    ┌────────────▼────────────────┐
                    │ 06 编译器与图优化            │  ← 把上层需求翻译成硬件指令
                    │    TVM / MLIR / Ansor        │
                    └────────────┬────────────────┘
                    ┌────────────▼────────────────┐
                    │ 07 集群调度、存储与数据      │  ← 从单任务走向生产系统
                    │    Ray / 调度 / checkpoint   │
                    └────────────┬────────────────┘
                    ┌────────────▼────────────────┐
                    │ 08 前沿专题选读              │  ← 带着地基去判断新论文
                    └─────────────────────────────┘
```

**每个模块都回答一个固定的问题**，把这 7 个问题串起来，AI Infra 的主干就通了：

1. 硬件的能力边界在哪？（01）
2. 框架怎么把模型变成算子执行？（02）
3. 单个 GPU 上算子怎么写才快？（03）
4. 一个模型怎么放到几千张卡上训？（04）
5. 训好的模型怎么低成本、低延迟地服务出去？（05）
6. 上面这些需求怎么自动翻译成高效代码？（06）
7. 多个任务、上千张卡怎么调度、怎么不丢进度？（07）

---

## 四、12 周计划

| 周次 | 模块 | 重点 | 本周动手 |
| --- | --- | --- | --- |
| W1 | [01 体系结构与性能模型](01-体系结构与性能模型.md) | Roofline 思维 | 拿一块 GPU 的规格算它的 roofline 拐点，判断 attention 属于哪一侧 |
| W2–W3 | [02 框架与自动微分](02-框架与自动微分.md) | 反向传播是怎么被"实现"出来的 | 读 micrograd 源码，手写一遍 backward |
| W4–W5 | [03 GPU 编程与算子优化](03-GPU编程与算子优化.md) | IO-aware 的算法设计 | 跟着 CUDA matmul 优化博客，把 kernel 从朴素版优化到接近 cuBLAS |
| W6–W8 | [04 训练系统与并行策略](04-训练系统与并行策略.md) | 显存与通信的权衡（本清单重心） | 用 FSDP 或 ZeRO 在单机多卡训一个小模型，记录显存与吞吐变化 |
| W9–W10 | [05 推理系统与 Serving](05-推理系统与Serving.md) | 吞吐/延迟权衡 | 跑通 vLLM，压测不同并发下的 TTFT 与 TPOT |
| W11 | [06 编译器与图优化](06-编译器与图优化.md) | 计算与调度分离 | 用 TVM/Ansor 调优一个矩阵乘法，看搜出来的 schedule |
| W12 | [07 集群调度、存储与数据](07-集群调度存储与数据.md) + [08 前沿专题选读](08-前沿专题选读.md) | 生产视角 | 用 Ray 起一个最小分布式任务；复盘前 11 周笔记 |

> 进度落后不要跳模块，宁可把 W6–W8 拉长到 5 周——训练系统是 AI Infra 面试和科研最密集的区域。

---

## 五、P0 全局勾选清单（24 篇）

⭐ 表示这 16 篇需要精读，其余 P0 读懂主图与结论即可。

**模块 01 体系结构与性能模型**
- [ ] ⭐ [Roofline: An Insightful Visual Performance Model](https://people.eecs.berkeley.edu/~kubitron/cs252/handouts/papers/RooflineVyNoYellow.pdf) · CACM 2009
- [ ] ⭐ [In-Datacenter Performance Analysis of a Tensor Processing Unit](https://arxiv.org/abs/1704.04760) · ISCA 2017
- [ ] [A New Golden Age for Computer Architecture](https://arxiv.org/abs/1801.00636) · CACM 2019

**模块 02 框架与自动微分**
- [ ] ⭐ [Automatic Differentiation in Machine Learning: a Survey](https://arxiv.org/abs/1502.05767) · JMLR 2018
- [ ] [PyTorch: An Imperative Style, High-Performance Deep Learning Library](https://arxiv.org/abs/1912.01703) · NeurIPS 2019

**模块 03 GPU 编程与算子优化**
- [ ] ⭐ [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) · NeurIPS 2022
- [ ] ⭐ [FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) · 2023
- [ ] [Triton: An Intermediate Language and Compiler for Tiled Neural Network Computations](https://github.com/triton-lang/triton) · MAPS 2019

**模块 04 训练系统与并行策略**
- [ ] ⭐ [GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism](https://arxiv.org/abs/1811.06965) · NeurIPS 2019
- [ ] ⭐ [PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377) · SOSP 2019
- [ ] ⭐ [Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism](https://arxiv.org/abs/1909.08053) · 2019
- [ ] ⭐ [ZeRO: Memory Optimizations Toward Training Trillion Parameter Models](https://arxiv.org/abs/1910.02054) · SC 2020
- [ ] ⭐ [Efficient Large-Scale Language Model Training on GPU Clusters (Megatron-DeepSpeed)](https://arxiv.org/abs/2105.13120) · SC 2021
- [ ] [PyTorch FSDP: Experiences on Scaling Fully Sharded Data Parallel](https://arxiv.org/abs/2304.11277) · VLDB 2023

**模块 05 推理系统与 Serving**
- [ ] [Towards Efficient Generative Large Language Model Serving: A Survey](https://arxiv.org/abs/2312.15234) · 2023
- [ ] ⭐ [Orca: A Distributed Serving System for Transformer-Based Generative Models](https://www.usenix.org/conference/osdi22/presentation/yu) · OSDI 2022
- [ ] ⭐ [Efficient Memory Management for LLM Serving with PagedAttention (vLLM)](https://arxiv.org/abs/2309.06180) · SOSP 2023
- [ ] ⭐ [Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) · ICML 2023
- [ ] ⭐ [AWQ: Activation-aware Weight Quantization](https://arxiv.org/abs/2306.00978) · MLSys 2024

**模块 06 编译器与图优化**
- [ ] ⭐ [TVM: An Automated End-to-End Optimizing Compiler for Deep Learning](https://arxiv.org/abs/1802.04799) · OSDI 2018
- [ ] [MLIR: A Compiler Infrastructure for the End of Moore's Law](https://arxiv.org/abs/2002.11054) · 2020
- [ ] [Ansor: Generating High-Performance Tensor Programs for Deep Learning](https://arxiv.org/abs/2006.06762) · OSDI 2020

**模块 07 集群调度、存储与数据**
- [ ] ⭐ [Ray: A Distributed Framework for Emerging AI Applications](https://arxiv.org/abs/1712.05889) · OSDI 2018
- [ ] [A Unified Architecture for Accelerating Distributed DNN Training in Heterogeneous GPU/CPU Clusters (BytePS)](https://www.usenix.org/conference/osdi20/presentation/jiang) · OSDI 2020

---

## 六、读一篇系统论文的固定套路

AI Infra 论文基本都是系统论文，结构高度相似。读的时候按这 5 个问题做笔记，比逐句翻译有效得多：

1. **痛点**：上一代做法为什么不够？（通常在 Introduction 和某个"之前 vs 现在"的图里）
2. **核心机制**：作者提出的那一两个关键设计是什么？（往往是论文里唯一一张架构图）
3. **为什么有效**：这个机制省下了什么？（显存？通信量？访存量？调度空隙？）——**一定要落到 01 模块的 roofline 语言上**
4. **代价**：引入了什么新开销？（额外的通信、额外的内存、实现复杂度、对负载的假设）
5. **局限与后续**：它假设了什么？后来被谁改进了？（看 Related Work 和引用它的论文标题）

> 一篇论文读完如果只能说出"它提出了 XXX 系统"，说明还没读懂。能说出"它把什么换成了什么"，才算读懂了。

---

## 七、关于链接与准确性

- 本清单内所有链接在写入前**逐条实测过 HTTP 可访问性**（结果：除下文单条说明外全部返回 200）。
- 优先给 **arXiv 或官方 proceedings 页**；两者都有时，正文里给 arXiv（稳定、免费），会议页在"深挖"里补充。
- 优先级、会议与年份均与出版信息核对过。已修正的两处常见误传：**Welder 是 OSDI 2023（不是 NSDI 2023）**；Triton 的 MAPS 2019 论文早期流传的 Harvard 镜像链接已失效，本文改用官方仓库。
- **唯一一条无法免费全文访问的**：`Gemini`（模块 07），只有 ACM 出版页，机构外需要付费或找作者主页。
- 论文会过时。每个模块都写了"演进链"，标明哪篇是历史、哪篇是现状。

---

## 八、文件索引

| 文件 | 内容 |
| --- | --- |
| [01-体系结构与性能模型.md](01-体系结构与性能模型.md) | Roofline、TPU、加速器体系结构、量化综述 |
| [02-框架与自动微分.md](02-框架与自动微分.md) | 动态图/静态图、autodiff、重计算 |
| [03-GPU编程与算子优化.md](03-GPU编程与算子优化.md) | FlashAttention、Triton、Winograd、online softmax |
| [04-训练系统与并行策略.md](04-训练系统与并行策略.md) | GPipe/PipeDream/Megatron/ZeRO/FSDP、3D 并行、MoE、自动并行 |
| [05-推理系统与Serving.md](05-推理系统与Serving.md) | Orca、vLLM、PD 分离、量化、投机解码、SGLang |
| [06-编译器与图优化.md](06-编译器与图优化.md) | TVM、MLIR、Ansor、图级超优化、TorchInductor |
| [07-集群调度存储与数据.md](07-集群调度存储与数据.md) | Ray、BytePS、Pollux/Sia、Gemini、弹性与容错 |
| [08-前沿专题选读.md](08-前沿专题选读.md) | 长上下文、MoE 系统、RLHF Infra、低精度、扩散模型并行 |
| [APPENDIX-术语表与入门资源.md](APPENDIX-术语表与入门资源.md) | 术语中英对照、公开课、教材、中文导读入口 |
