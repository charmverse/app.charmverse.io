import { useRouter } from 'next/router';

import { usePages } from 'hooks/usePages';
import type { PageMeta } from 'lib/pages';

export function usePageIdFromPath() {
  const router = useRouter();
  return router.query.pageId as string | undefined;
}

export function usePageFromPath(): PageMeta | null {
  const basePageId = usePageIdFromPath();
  const { pages } = usePages();
  const basePage = Object.values(pages).find((page) => page?.id === basePageId || page?.path === basePageId);
  return basePage || null;
}
