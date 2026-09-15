import { papersSource, source } from '@/lib/source';
import { createSearchAPI, type AdvancedIndex } from 'fumadocs-core/search/server';

// 搜索需要同时覆盖「教材」与「论文导读」两个独立内容源。
// createFromSource 只接受单个 loader，所以这里手工合并两边的索引。
const pages = [...source.getPages(), ...papersSource.getPages()];

export const { GET } = createSearchAPI('advanced', {
  indexes: pages.map(
    (page): AdvancedIndex => ({
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      structuredData: page.data.structuredData,
    }),
  ),
});
