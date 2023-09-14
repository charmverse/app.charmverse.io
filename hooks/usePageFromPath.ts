import type { PageMeta } from '@charmverse/core/pages';
import { useRouter } from 'next/router';

import { usePages } from 'hooks/usePages';

export function usePageIdFromPath() {
  const router = useRouter();
  return router.query.pageId as string | undefined;
}

export function usePageFromPath(): PageMeta | null {
  const basePageId = usePageIdFromPath();
  const { pages } = usePages();
  const basePage = basePageId
    ? Object.values(pages).find(
        (page) => page?.id === basePageId || page?.path === basePageId || page?.additionalPaths.includes(basePageId)
      )
    : null;
  return basePage || null;
}
