import { papersSource } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/papers'>) {
  return (
    <DocsLayout tree={papersSource.getPageTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
