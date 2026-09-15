# 附录 · 术语表与入门资源

---

## 一、术语中英对照（按模块分组）

### 性能与体系结构（模块 01）

| 中文 | 英文 | 一句话解释 |
| --- | --- | --- |
| 计算强度 | arithmetic intensity | 每读写 1 字节数据做了多少次浮点运算 |
| 算力受限 / 带宽受限 | compute-bound / memory-bound | 卡在算力还是卡在访存带宽 |
| 屋脊点 | ridge point | Roofline 图上从带宽受限转向算力受限的拐点 |
| 脉动阵列 | systolic array | TPU 用的数据复用阵列结构 |
| 量化 | quantization | 用更低比特表示权重/激活，主要收益是降带宽 |
| 异常值 | outlier | LLM 激活里少数极大值，是量化难做的根因 |

### 框架与自动微分（模块 02）

| 中文 | 英文 | 一句话解释 |
| --- | --- | --- |
| 自动微分 | automatic differentiation (autodiff) | 按链式法则机械地算导数，区别于符号/数值微分 |
| 反向模式 | reverse mode | 神经网络用的模式，代价与输出维度成正比 |
| 即时执行 / 定义即运行 | eager / define-by-run | 边执行边建图（PyTorch） |
| 定义后运行 | define-and-run | 先建完整图再执行（TF 1.x） |
| 重计算 | rematerialization / recomputation / checkpointing | 丢掉中间激活，反向需要时重算，用计算换显存 |
| 激活值 | activation | forward 中间结果，训练显存的主要占用者之一 |

### GPU 与算子（模块 03）

| 中文 | 英文 | 一句话解释 |
| --- | --- | --- |
| 分块 | tiling | 把大矩阵切成能放进 SRAM 的小块 |
| 共享内存 | shared memory / SRAM | 片上高速存储，比 HBM 快得多但很小 |
| 在线 softmax | online softmax | 一遍扫描同时维护最大值与累积和，无需预先知道全局最大值 |
| 核函数 | kernel | GPU 上执行的函数 |
| 运算符融合 | operator fusion | 把多个算子合并成一个 kernel，减少访存往返 |
| 低精度 GEMM | — | 用 FP16/BF16/FP8/INT8 做矩阵乘 |

### 训练系统（模块 04）

| 中文 | 英文 | 一句话解释 |
| --- | --- | --- |
| 数据并行 | data parallelism (DP) | 每卡一份模型，切分数据 |
| 张量并行 | tensor parallelism (TP) | 切分单个算子的矩阵，通信频繁 |
| 流水线并行 | pipeline parallelism (PP) | 按层切分，通信稀疏但有空闲 |
| 3D 并行 | 3D parallelism | DP × TP × PP 同时使用 |
| 气泡 | bubble | 流水线中空闲等待的时间比例 |
| 微批次 | micro-batch | 流水线灌入的最小批次单位 |
| 分片 | sharding | 把模型状态切到多卡 |
| 全分片数据并行 | FSDP | PyTorch 原生的 ZeRO-3 等价实现 |
| 序列并行 | sequence parallelism | 在序列维度切分 LayerNorm/Dropout 等激活 |
| 混合专家 | mixture-of-experts (MoE) | 参数量与计算量解耦，代价是 all-to-all 通信 |
| 全局归约 / 全收集 / 归约散射 | all-reduce / all-gather / reduce-scatter | 三个最高频的集合通信原语 |

### 推理系统（模块 05）

| 中文 | 英文 | 一句话解释 |
| --- | --- | --- |
| 首 token 延迟 | TTFT (time to first token) | 由 prefill 决定，交互体验的关键 |
| 每 token 延迟 | TPOT / ITL | 由 decode 决定，决定"打字速度" |
| 有效吞吐 | goodput | 满足 SLO 前提下的吞吐，生产最重要指标 |
| 连续批处理 | continuous batching | 每个迭代重组 batch，请求可随时插入 |
| 预填充 / 解码 | prefill / decode | 处理输入 / 逐 token 生成，特性完全不同 |
| KV 缓存 | KV cache | 缓存的注意力键值，随序列与 batch 线性增长 |
| 分页注意力 | PagedAttention | 像操作系统分页一样管理 KV Cache |
| 前缀复用 | prefix caching / RadixAttention | 共享系统提示、少样本示例的 KV |
| 分块预填充 | chunked prefill | 把长 prefill 切块混入 decode，平滑延迟 |
| 预填/解码分离 | PD disaggregation | 把两个阶段放到不同机器，各自最优 |
| 投机解码 | speculative decoding | 小模型草稿 + 大模型并行验证，不改分布 |
| 服务等级目标 | SLO | 延迟/吞吐的服务承诺 |

### 编译器（模块 06）

| 中文 | 英文 | 一句话解释 |
| --- | --- | --- |
| 中间表示 | IR | 编译器内部的数据结构 |
| 计算与调度分离 | compute/schedule separation | "算什么"和"怎么算"解耦 |
| 自动调优 | autotuning | 搜索最优 schedule |
| 方言 | dialect | MLIR 中一层抽象对应的指令集 |
| 逐级降低 | progressive lowering | 从高层 IR 一步步降到硬件指令 |
| 等价饱和 | equality saturation | 用 e-graph 表示所有等价写法并全局搜索 |
| 图替换 | graph substitution | 把子图替换为等价但更快的实现 |

### 集群与工程（模块 07）

| 中文 | 英文 | 一句话解释 |
| --- | --- | --- |
| 参数服务器 | parameter server | 中心化聚合梯度的架构 |
| 集合通信 | collective communication | all-reduce 等多对多通信原语 |
| 检查点 | checkpoint | 保存训练状态以便恢复 |
| 抢占 | preemption | 任务被更高优先级任务打断 |
| 多租户 | multi-tenancy | 多个任务共享同一批 GPU |
| 弹性 | elasticity | 训练任务能增减卡数而不中断 |

---

## 二、入门公开课（按推荐顺序）

| 课程 | 说明 | 链接 |
| --- | --- | --- |
| **CMU 15-884 Machine Learning Systems** | **本清单的结构蓝本**。论文阅读课的 schedule 就是一份权威分类清单，可作为补充读物索引 | <https://catalyst.cs.cmu.edu/15-884-mlsys-sp21/> |
| CMU 15-418/15-618 Parallel Computer Architecture | 并行与体系结构的基础课，配合模块 01、03 | <https://www.cs.cmu.edu/~418/> |
| Stanford CS149 Parallel Computing | 并行计算，重点在 GPU 与性能模型 | <https://cs149.stanford.edu/> |
| MIT 6.5940 TinyML and Efficient Deep Learning | 高效深度学习（量化、剪枝、加速器）的完整课程 | <https://hanlab.mit.edu/courses/2024-fall-65940> |
| 微软 AI-System（中文） | 中文的系统课程，覆盖框架、编译、分布式训练，适合作为中文补充 | <https://github.com/microsoft/AI-System> |

---

## 三、教材

| 教材 | 用来补什么 | 读哪部分 |
| --- | --- | --- |
| *Computer Systems: A Programmer's Perspective*（CSAPP） | 体系结构与系统基础 | 第 5 章（性能优化）、第 6 章（存储层次）、第 9 章（虚拟内存，读 vLLM 前有用） |
| *Programming Massively Parallel Processors*（PMPP） | CUDA 编程 | 第 4–6 章（对应模块 03 的动手项） |
| *Computer Architecture: A Quantitative Approach* | 体系结构进阶 | 第 2 章（性能与量化方法），只想看方法论的话读这一章就够 |
| *Designing Machine Learning Systems*（Chip Huyen） | 工程视角（偏 MLOps，与 AI Infra 有交集但不等同） | 按需 |

---

## 四、中文导读与博客入口

| 资源 | 说明 |
| --- | --- |
| **李沐《论文精读》系列** | 系统讲读了大量深度学习经典论文，适合入门期建立"怎么读论文"的手感：<https://space.bilibili.com/1567748478/channel/seriesdetail?sid=358497> |
| **Lilian Weng 博客** | 训练大模型、推理优化两个主题的总结质量极高，可作模块 04、05 的预备读物：<br>[How to Train Really Large Models on Many GPUs](https://lilianweng.github.io/posts/2021-09-25-train-large/)<br>[Large Transformer Model Inference Optimization](https://lilianweng.github.io/posts/2023-01-10-inference-optimization/) |
| 具体论文的中文精读 | FlashAttention、ZeRO、vLLM/PagedAttention、Megatron、ZeRO-Offload 等热门论文中文解读极多，检索「论文名 + 精读 / 解读」通常 5 分钟内能找到质量不错的版本 |

> **说明**：本清单只把长期稳定、确定存在的入口列在这里。具体的单篇中文导读文章链接会随作者与平台变化，因此不逐一固化，以避免死链。

---

## 五、常见误区（入门期最容易踩的坑）

1. **从最新论文开始读**。结果只能记住一堆缩写。**顺序是有依赖的**，见 README 的模块依赖图。
2. **只读论文不动手**。AI Infra 是工程学科。读完 FlashAttention 却从没写过 kernel，等于没读。每个模块的"动手验证"不要跳过。
3. **把"看懂每个公式"当目标**。系统论文的公式往往只是辅助。**优先搞懂架构图和调度图**，公式看不懂先跳过，读第 3、4 节时再回来。
4. **混淆训练与推理的优化手段**。很多技术在两边含义完全不同（例如张量并行在训练和推理里的配置约束不一样）。
5. **只记结论不记代价**。每篇论文都引入了新开销。**只记"它更快"是没用的，要记住"它把什么换成了什么"**。
6. **忽略 01 模块**。跳过 Roofline 直接读后面的论文，是入门者效率最低的一条路。
7. **追求读完全部 P1/P2**。清单的目的是建立地基，不是刷数量。P0 读完 + 12 周动手做完，收益远大于泛泛把一百条读完。

---

## 六、给你的下一步

读完 P0（25 篇）之后，建议做一件"自己的事"来检验地基是否牢：

- **复现一个最小系统**：例如自己实现一个带 continuous batching 的简易推理服务，或自己用一个 Triton kernel 实现 attention 并测到接近官方的性能。
- **读一份大模型技术报告的 Infra 章节并写总结**：例如 DeepSeek-V3 或 Llama 3，试着用前七个模块的框架去解释它的每一个设计选择。
- **挑一个子方向深入**：训练系统 / 推理系统 / 编译器与算子 / 集群调度，从本清单对应的模块向外扩展。

做到这里，你就不是"读过一个清单的人"，而是**能自己判断和产出的人**了。
