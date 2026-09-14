# AI Infra 自学教材

一套按依赖顺序组织的 AI Infra 自学网站。基于 [Fumadocs](https://fumadocs.dev)（Next.js + MDX）构建，部署在 Vercel。

**在线访问**：部署完成后填在这里。

---

## 这个仓库里有什么

```
paper/
├── content/docs/              ← 教材正文（改这里就是更新网站）
│   ├── index.mdx              首页：内容进度表
│   ├── getting-started.mdx    如何使用本站
│   ├── 01-performance-memory/ ★ 第一篇：性能与存储层次（已完成）
│   ├── 02-frameworks-autodiff/  ┐
│   ├── 03-gpu-kernels/          │
│   ├── 04-training-systems/     │ 占位页，
│   ├── 05-inference-serving/    │ 随学习进度逐章补写
│   ├── 06-compilers/            │
│   ├── 07-cluster-scheduling/   │
│   ├── 08-frontiers/            ┘
│   └── 99-papers/             论文清单入口
├── material/                  ← 配套论文清单（纯 Markdown，约 90 个条目）
├── lib/ , app/ , components/  ← 站点代码
├── source.config.ts           ← MDX 配置（数学公式插件在这里接入）
└── pnpm-workspace.yaml        ← pnpm 设置（依赖 pin 与构建脚本白名单）
```

## 本地开发

```bash
pnpm install
pnpm dev          # 打开 http://localhost:3000
```

其他命令：

```bash
pnpm build        # 生产构建
pnpm start        # 本地跑生产构建的产物
pnpm types:check  # TypeScript 类型检查
```

## 怎么加一章内容（三步）

站点结构已经搭好，加内容不需要动任何代码：

1. **写内容**：在 `content/docs/` 下对应目录里新建 `.mdx` 文件（目录已存在，目前是占位页）。

   ```mdx
   ---
   title: 2.1 动态图与静态图
   description: 一句话说明这节讲什么
   ---

   正文用 Markdown 写。数学公式用 $行内$ 和 $$块级$$。
   ```

2. **排在目录里**：在同目录的 `meta.json` 的 `pages` 数组里加上文件名（不带扩展名）。

   ```json
   {
     "title": "第二篇 · 框架与自动微分",
     "pages": ["index", "eager-vs-graph", "autodiff"]
   }
   ```

3. **改进度表**：更新 `content/docs/index.mdx` 里的状态（⏳ → ✅）。

数据流是：**`content/docs/**` + 各目录的 `meta.json` → 侧边栏与路由 → 静态页面**。所以改完内容不需要碰任何组件代码。

## 技术选型说明

| 选择 | 原因 |
| --- | --- |
| Fumadocs + Next.js | 数学公式好接；后续能用 React 写交互组件（Roofline 计算器、显存账计算器） |
| Orama 本地搜索 | 构建期生成本地索引，**不需要任何 API key**，也没有外部服务依赖 |
| 系统字体栈 | 不下载外部字体，避免构建期的网络依赖 |
| 目录名用 ASCII、标题用中文 | URL 干净，侧边栏仍是中文 |

### 两个已经踩过的坑（改配置前请先看）

1. **数学公式的插件顺序不能反。** `remark-math` 会把 `$$...$$` 解析成 `<code class="language-math">`；如果 `rehype-katex` 排在 Fumadocs 默认的 shiki 代码高亮**之后**，shiki 会去加载一个并不存在的语言 `math` 并报错。所以 `source.config.ts` 里写的是 `rehypePlugins: (plugins) => [rehypeKatex, ...plugins]`——**前置**，不是追加。

2. **代码块不要用 ` ```cuda `。** shiki 没有内置 `cuda` 这个语言（只有 `cue`），写了会导致构建失败。CUDA 代码请一律用 ` ```cpp `。

## 部署到 Vercel

### 首次部署

1. 打开 [vercel.com/new](https://vercel.com/new)，用 GitHub 账号登录。
2. 在 **Import Git Repository** 里选择 `dx2331lxz/ai-infra-textbook`。
3. **Framework Preset** 会自动识别为 Next.js。
4. **Root Directory 保持默认**（站点就在仓库根目录，不要填任何子目录）。
5. **环境变量：一个都不需要填。**
6. 点 **Deploy**，等待 1–2 分钟。构建命令是 `pnpm build`，Vercel 会自动识别 pnpm。

### 之后的更新

**你只需要 `git push`。** Vercel 会监听 `main` 分支，每次推送自动重新构建部署。

```bash
git add .
git commit -m "补充第二篇第一小节"
git push
```

大约 1 分钟后网站就更新了。这就是"随学习进度同步更新"的工作方式。

### 如果 Vercel 自动识别 pnpm 失败

极少见。若构建时报 `command not found: pnpm`，在 Vercel 项目的 Settings → General → **Install Command** 里填 `npm install --legacy-peer-deps`，Build Command 填 `npm run build` 即可。

## 关于 `material/` 目录

`material/` 里是配套的论文清单（纯 Markdown，不参与站点构建）。它和教材正文是互补的：

- **教材正文**负责建立判断依据，讲清"为什么"。
- **论文清单**负责在你有了判断依据之后，带你去看真实系统怎么做。

站点里 [论文清单页](/docs/99-papers) 有指向该目录的 GitHub 链接，所以这些链接**只在仓库推送到 GitHub 之后才有效**。

## 版权说明

教材正文中的讲解、例子、图示、实验代码均为本项目原创撰写。文中引用的教材（如 CSAPP）与论文仅作为**延伸阅读**被标注章节或篇名，未复制其正文、图表或习题。

`material/` 里的论文清单是阅读指引（标题、会议、链接、一句话说明），同样不含论文原文。
