import { defineConfig } from 'fumadocs-mdx/config';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  mdxOptions: {
    // 保留 Fumadocs 的默认插件链（目录、代码高亮、搜索索引等），
    // 只在其前后追加数学公式插件，避免覆盖默认行为。
    preset: 'fumadocs',
    remarkPlugins: (plugins) => [...plugins, remarkMath],
    // rehype-katex 必须排在 Fumadocs 默认的代码高亮插件之前：
    // remark-math 会把 $$...$$ 解析成 <code class="language-math">，
    // 若先跑 shiki，它会去加载一个并不存在的 shiki 语言 `math` 而报错。
    rehypePlugins: (plugins) => [rehypeKatex, ...plugins],
  },
});
