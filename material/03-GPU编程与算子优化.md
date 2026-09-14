# 03 · GPU 编程与算子优化

> **本模块回答**：单个 GPU 上，一个算子怎么写才快？

前两个模块给了你"判断依据"，这个模块开始给你"实现手段"。
核心思想只有一句：**好的算子设计不是减少计算量，而是减少数据搬运。** FlashAttention 之所以是 AI Infra 的里程碑，正是因为它把这个思想做成了一个通用范本。

---

## 前置知识

- 01 模块的 Roofline 思维（务必先做那三个练习）。
- 知道 GPU 的内存层级：寄存器 → shared memory（SRAM）→ L2 → HBM（显存）。
- 了解 SIMT / warp / thread block 的基本概念即可，**不需要先学会写 CUDA 再读论文**——可以边读论文边学。

---

## 论文清单

### 1. FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness

- [ ] **P0** ⭐ · [FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) · NeurIPS 2022
  - **主旨**：注意力的瓶颈不在 FLOPs 而在 HBM 读写。通过 **tiling（分块）+ online softmax（在线归一化）+ 反向重算**，把 $O(N^2)$ 的中间矩阵完全留在 SRAM 里，从不写回 HBM。
  - **为什么读 / 读到什么程度**：**精读，且要能自己推导**。这是全清单里"读一篇顶十篇"的论文。必须搞懂三件事：(1) 朴素 attention 的三次 HBM 往返在哪；(2) online softmax 的递推公式怎么推出来的；(3) 为什么不需要保存 attention 矩阵也能算反向。
  - **前置知识**：01 模块；softmax 与矩阵乘。
  - **建议用时**：6–8 小时（含推公式）。分 2–3 次读。
  - **中文导读**：这篇的中文精读极多，值得配合看。可搜「FlashAttention 论文精读」。
  - **读完要能回答**：为什么在序列长度较短时 FlashAttention 反而不如朴素实现？（因为它引入了额外的重算开销，而短序列下访存不是瓶颈。）

### 2. FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning

- [ ] **P0** ⭐ · [FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) · 2023
  - **主旨**：v1 的 kernel 只跑到理论峰值的 25–40%，原因是非矩阵乘的 FLOPs（softmax、缩放）占比过高、以及 GPU 各 SM 之间工作划分不均衡。v2 通过调整循环顺序、减少非 matmul 操作、以及在序列维度上并行来补齐。
  - **为什么读 / 读到什么程度**：**精读**。这篇的价值在于展示"算法正确了"和"打满硬件"之间还有多大距离——这才是真正的工程能力。重点读第 2–3 节的三个改动。
  - **前置知识**：第 1 篇。
  - **建议用时**：3 小时。

### 3. Triton: An Intermediate Language and Compiler for Tiled Neural Network Computations

- [ ] **P0** · [Triton: An Intermediate Language and Compiler for Tiled Neural Network Computations](https://github.com/triton-lang/triton) · MAPS 2019
  - **主旨**：手写 CUDA 门槛高、不可移植。Triton 提供一层"以 tile 为单位"的语言，让研究者用 Python 写出接近手写 CUDA 性能的 kernel，把 shared memory 分配、线程同步这些脏活交给编译器。
  - **为什么读 / 读到什么程度**：**泛读**。读摘要 + 第 2 节的语言设计 + 第 3 节的编译流程。不必纠结编译器内部实现。
  - **前置知识**：大致了解 CUDA 编程模型（block/thread/shared memory）。
  - **建议用时**：2 小时。
  - **注意**：ACM DOI 为 `10.1145/3315508.3329973`（出版页，可能需要机构访问），上面给的是官方仓库，里面有论文与实现。
  - **为什么重要**：今天几乎所有融合算子（注意力、归一化、MoE、量化）都是先用 Triton 写出来的。它是 AI Infra 工程师的日常工具。

### 4. Online normalizer calculation for softmax

- [ ] **P1** · [Online normalizer calculation for softmax](https://arxiv.org/abs/1805.02867) · 2018（技术报告）
  - **主旨**：5 页的短文，却能让你彻底理解 FlashAttention 的一半。通过维护"当前最大值 m 和累积和 l"来一遍扫描完成 softmax，不需要预先知道全局最大值。
  - **为什么读 / 读到什么程度**：**精读**（真的很短）。这是 FlashAttention 里最难的那个数学部件，独立读一次会清晰很多。
  - **前置知识**：softmax 的数值稳定性问题（要先减最大值）。
  - **建议用时**：1 小时。
  - **建议顺序**：先读这篇，再读 FlashAttention，会顺畅很多。

### 5. Fast Algorithms for Convolutional Neural Networks (Winograd)

- [ ] **P1** · [Fast Algorithms for Convolutional Neural Networks](https://arxiv.org/abs/1509.09308) · CVPR 2016
  - **主旨**：用 Winograd 最小滤波算法把卷积的乘法次数减少数倍（`F(2x2, 3x3)` 把 36 次乘法降到 16 次）。
  - **为什么读 / 读到什么程度**：**泛读**。理解"算法层面减少计算量"这条路线就够了，不必推全部变换矩阵。
  - **前置知识**：卷积的基本计算方式。
  - **建议用时**：1.5 小时。
  - **为什么现在还读它**：它代表与 FlashAttention 相反的另一条优化路线（**减少计算量** vs **减少访存量**）。知道两条路线各自的天花板，是判断新论文的基本功。

### 6. Flash-Decoding / FlashDecoding++

- [ ] **P1** · [Flash-Decoding for long-context inference](https://pytorch.org/blog/flash-decoding/)（PyTorch 博客）与 [FlashDecoding++](https://arxiv.org/abs/2311.01282) · 2023
  - **主旨**：推理的 decode 阶段 batch 小、序列长时，attention 只能在 KV 序列维度上切分才够并行度。做法是把 KV 分块并行计算，最后再合并部分结果（split-K + reduce）。
  - **为什么读 / 读到什么程度**：**泛读**。读博客即可，理解"并行度不足"是怎么被解决的。
  - **前置知识**：第 1、2 篇。
  - **建议用时**：1 小时。
  - **衔接**：这是 05 模块推理系统里一个反复出现的主题——decode 阶段的并行度与延迟。

### 7. Self-Attention Does Not Need O(n²) Memory

- [ ] **P1** · [Self-Attention Does Not Need O(n²) Memory](https://arxiv.org/abs/2112.05682) · 2021（JAX 技术报告）
  - **主旨**：FlashAttention 之前，JAX 团队用一行 `vmap` + 分块扫描做到 attention 不需要存 $O(n^2)$ 中间矩阵。是同一思想更早、更朴素的表述。
  - **为什么读 / 读到什么程度**：**泛读**。读博客/短文即可，用来对照 FlashAttention 到底多做了什么（IO-aware 的 tiling 与 kernel 融合）。
  - **前置知识**：第 1 篇。
  - **建议用时**：40 分钟。

### 8. 补充选读（P2）

- [ ] **P2** · [How to Optimize a CUDA Matmul Kernel for cuBLAS-like Performance](https://siboehm.com/articles/22/CUDA-MMM) —— **强烈建议动手做一遍**。从朴素三重循环一步步优化到接近 cuBLAS，是理解 tiling、shared memory、寄存器分块、向量化最直接的方式。
- [ ] **P2** · [CUTLASS 官方仓库](https://github.com/NVIDIA/cutlass) —— 生产级 GEMM 模板库。当你想知道"工业界的 kernel 到底长什么样"时看。
- [ ] **P2** · 教材《Programming Massively Parallel Processors》(PMPP) 第 4–6 章 —— CUDA 系统学习的标准教材，配合上面的博客做练习。
- [ ] **P2** · 任意一篇算子融合 / 自动调优论文。

---

## 动手验证（这两周必做）

1. **（最重要）手写 CUDA matmul**：跟着 [siboehm 的博客](https://siboehm.com/articles/22/CUDA-MMM) 把矩阵乘从朴素版一路优化到接近 cuBLAS，每一步都记录达到的 TFLOPS，并和 01 模块算出的理论峰值对比。这一步做完，你对 GPU 的理解会从"概念"变成"手感"。
2. **用 Triton 写一个 softmax 或 layernorm**：感受"不需要管 shared memory 分配"的便利，再和 PyTorch 原生实现比一次性能。
3. **复现 online softmax**：不看论文，用 Python/NumPy 自己实现一遍带 `m`、`l` 递推的 online softmax，验证结果与普通 softmax 一致。
4. **（可选）用 FlashAttention 官方库做一个长度扫描**：从 128 到 8192 测 attention 的显存占用与耗时，标出 FlashAttention 开始优于朴素实现的长度。

---

## 演进链（谁替代了谁）

```
朴素 attention：显存 O(N²)，HBM 往返多次
    ↓
online softmax（2018）：一遍扫描，但仍是统一算法
    ↓
Self-Attention Does Not Need O(n²) Memory（2021）：分块，但不够 IO-aware
    ↓
FlashAttention（2022）：IO-aware 的 tiling + 重算 —— 事实标准
    ↓
FlashAttention-2（2023）：打满硬件；Flash-Decoding（2023）：解决 decode 并行度
    ↓
今天：所有推理引擎（vLLM / TensorRT-LLM / SGLang）的 attention 后端都是这条线的产物
```

---

## 读完自检

- [ ] 能画出朴素 attention 在 HBM 与 SRAM 之间的数据流，并指出哪几次往返被 FlashAttention 消掉了。
- [ ] 能推导 online softmax 的递推公式。
- [ ] 能解释"减少计算量"（Winograd）和"减少访存量"（FlashAttention）两条路线各自的适用场景。
- [ ] 能手写一个能跑起来的 CUDA kernel，并用 roofline 解释它离峰值有多远。
