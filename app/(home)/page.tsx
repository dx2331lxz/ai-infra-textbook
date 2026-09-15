import Link from 'next/link';
import type { ReactNode } from 'react';

type Chapter = {
  n: string;
  title: string;
  href: string;
  desc: string;
  done: boolean;
};

const chapters: Chapter[] = [
  {
    n: '01',
    title: '性能与存储层次',
    href: '/docs/01-performance-memory',
    desc: '访存的代价、局部性、Cache、优化方法论、CPU 到 GPU、动手实验',
    done: true,
  },
  {
    n: '02',
    title: '框架与自动微分',
    href: '/docs/02-frameworks-autodiff',
    desc: '动态图与静态图、autodiff 的三种模式、显存里的激活值',
    done: false,
  },
  {
    n: '03',
    title: 'GPU 与算子优化',
    href: '/docs/03-gpu-kernels',
    desc: 'FlashAttention、Triton、online softmax',
    done: false,
  },
  {
    n: '04',
    title: '训练系统与并行策略',
    href: '/docs/04-training-systems',
    desc: 'GPipe、PipeDream、Megatron、ZeRO、FSDP',
    done: false,
  },
  {
    n: '05',
    title: '推理系统与 Serving',
    href: '/docs/05-inference-serving',
    desc: 'Orca、vLLM、量化、投机解码、PD 分离',
    done: false,
  },
  {
    n: '06',
    title: '编译器与图优化',
    href: '/docs/06-compilers',
    desc: 'TVM、MLIR、Ansor、TorchInductor',
    done: false,
  },
  {
    n: '07',
    title: '集群调度与容错',
    href: '/docs/07-cluster-scheduling',
    desc: 'Ray、调度、checkpoint 与故障恢复',
    done: false,
  },
  {
    n: '08',
    title: '前沿专题',
    href: '/docs/08-frontiers',
    desc: '长上下文、MoE 系统、RLHF Infra、低精度',
    done: false,
  },
];

const features: { title: string; body: string }[] = [
  {
    title: '按依赖顺序，不跳章',
    body: '八篇之间有硬依赖。后面每一篇讨论「优化了什么」时，用的都是第一篇建立的语言。章节目录的顺序就是阅读顺序。',
  },
  {
    title: '先给判断依据，再给实现手段',
    body: '不先讲 FlashAttention 怎么做，而是先讲清「这是算力受限还是带宽受限」。判断依据会了，新论文只是同一套思想的变形。',
  },
  {
    title: '每一章都配动手实验',
    body: '性能这件事，测过一次和读过十遍是两种理解。第一篇直接给了三个可运行的 C 程序，并逐行解释。',
  },
];

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-fd-foreground">{title}</h2>
        {subtitle ? <p className="text-sm text-fd-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function HomePage() {
  const doneCount = chapters.filter((c) => c.done).length;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-16 px-6 py-14 sm:py-20">
      {/* Hero */}
      <section className="flex flex-col gap-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-fd-border bg-fd-muted px-3 py-1 text-xs text-fd-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-fd-success" />
          共 8 篇 · 已完成 {doneCount} 篇 · 持续更新
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-fd-foreground sm:text-5xl">
            AI Infra 自学教材
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-fd-muted-foreground">
            从「访存比计算贵」讲到训练与推理系统，按依赖顺序排好的一条主干路线。
            先把每一层需要的直觉和判断依据讲清楚，再把你带到论文面前。
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/docs/01-performance-memory"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            从第一篇开始
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center justify-center rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            先看看怎么用
          </Link>
          <Link
            href="/docs/99-papers"
            className="inline-flex items-center justify-center rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
          >
            25 篇 P0 论文清单
          </Link>
        </div>
      </section>

      {/* 为什么这样组织 */}
      <Section
        title="为什么要有这套教材"
        subtitle="AI Infra 的新论文很多，但底层的判断依据其实很少。"
      >
        <p className="max-w-3xl leading-relaxed text-fd-muted-foreground">
          如果先建立了判断依据，再去看新论文，会发现绝大多数工作只是同一套思想在不同场景下的变形；
          反过来，如果直接从论文开始，就只能记住一堆名词。所以这套教材的组织原则是：
          <span className="font-medium text-fd-foreground">
            先给判断依据，再给实现手段，最后才给前沿。
          </span>
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-5"
            >
              <h3 className="text-sm font-semibold text-fd-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-fd-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 学习路径 */}
      <Section
        title="学习路径"
        subtitle="顺序不能打乱——每一篇都建立在前一篇之上。先从 ✅ 的开始。"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {chapters.map((c) => (
            <Link
              key={c.n}
              href={c.href}
              className="group flex gap-4 rounded-xl border border-fd-border bg-fd-card p-4 transition-colors hover:bg-fd-accent"
            >
              <span className="mt-0.5 font-mono text-sm text-fd-muted-foreground">{c.n}</span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-fd-foreground">
                  {c.title}
                  {c.done ? (
                    <span className="rounded-full bg-fd-success/15 px-2 py-0.5 text-[11px] font-medium text-fd-success">
                      已完成
                    </span>
                  ) : (
                    <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] font-normal text-fd-muted-foreground">
                      待补充
                    </span>
                  )}
                </span>
                <span className="text-xs leading-relaxed text-fd-muted-foreground">{c.desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* 三个入口 */}
      <Section title="三块内容，互补使用">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/docs/01-performance-memory"
            className="flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
          >
            <span className="text-sm font-semibold text-fd-foreground">教材正文</span>
            <span className="text-sm leading-relaxed text-fd-muted-foreground">
              建立判断依据，讲清「为什么」。每节都带自测问题，每章都配动手实验。
            </span>
          </Link>
          <Link
            href="/docs/99-papers"
            className="flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
          >
            <span className="text-sm font-semibold text-fd-foreground">论文清单</span>
            <span className="text-sm leading-relaxed text-fd-muted-foreground">
              该读什么。25 篇 P0 必读 + 约 93 个条目，按模块组织，含 12 周计划。
            </span>
          </Link>
          <Link
            href="/papers"
            className="flex flex-col gap-2 rounded-xl border border-fd-border bg-fd-card p-5 transition-colors hover:bg-fd-accent"
          >
            <span className="text-sm font-semibold text-fd-foreground">论文导读</span>
            <span className="text-sm leading-relaxed text-fd-muted-foreground">
              读到了什么。与教材独立的模块，每篇一页：论文简介、链接与完整导读。
            </span>
          </Link>
        </div>
        <p className="text-sm leading-relaxed text-fd-muted-foreground">
          正确的顺序是：
          <span className="font-medium text-fd-foreground">先读完一篇教材正文，再去读那一篇对应的论文</span>
          。反过来做，论文会变成名词记忆。
        </p>
      </Section>

      {/* 定位 */}
      <Section title="这套教材的定位">
        <div className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-muted/40 p-5 text-sm leading-relaxed text-fd-muted-foreground">
          <p>
            <span className="font-medium text-fd-foreground">面向：</span>
            会写模型、但系统与体系结构底子薄的人。
          </p>
          <p>
            <span className="font-medium text-fd-foreground">不假设：</span>
            不需要 CUDA、体系结构或分布式系统的基础，也不需要会写 C 语言——动手实验提供可直接运行的完整代码并逐行解释。
          </p>
          <p>
            <span className="font-medium text-fd-foreground">不做的事：</span>
            不复制任何教材或论文的原文。讲解、例子、图示、实验代码都是重新写的；经典教材与论文作为
            <span className="font-medium text-fd-foreground">延伸阅读</span>
            被引用，告诉你去读哪一章。
          </p>
        </div>
      </Section>
    </div>
  );
}
