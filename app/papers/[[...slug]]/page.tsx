import { papersSource } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';

export default async function Page(props: PageProps<'/papers/[[...slug]]'>) {
  const params = await props.params;
  const page = papersSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/papers/${page.path}`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6 text-sm">
        <a
          href={githubUrl}
          className="text-fd-muted-foreground underline-offset-4 hover:text-fd-foreground hover:underline"
        >
          在 GitHub 上查看 / 编辑
        </a>
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(papersSource, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return papersSource.generateParams();
}

export async function generateMetadata(
  props: PageProps<'/papers/[[...slug]]'>,
): Promise<Metadata> {
  const params = await props.params;
  const page = papersSource.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
