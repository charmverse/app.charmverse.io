import type { PageMeta } from '@charmverse/core/pages';
import type { PageType } from '@charmverse/core/prisma';
import { useMemo } from 'react';

import { useGetSearchPages } from 'charmClient/hooks/pages';

import { useCurrentSpace } from './useCurrentSpace';
import { useDebouncedValue } from './useDebouncedValue';
import { usePages } from './usePages';

export type SearchResultItem = {
  icon?: string | null;
  path: string;
  title: string;
  type: PageType;
  breadcrumb?: string;
  id: string;
};

export function useSearchPages({ search, limit }: { search: string; limit?: number }): {
  results: SearchResultItem[];
  isLoading: boolean;
  isValidating: boolean;
} {
  const { space } = useCurrentSpace();
  const { pages } = usePages();
  const searchDebounced = useDebouncedValue(search, 200);
  const { data, isLoading, isValidating } = useGetSearchPages({
    // dont query if search is empty
    spaceId: searchDebounced && space?.id,
    search: searchDebounced,
    limit
  });
  const results = useMemo(() => {
    return searchDebounced
      ? (data || [])?.map((page) => ({
          title: page.title || 'Untitled',
          breadcrumb: _getBreadcrumb(page, pages),
          path: `/${page.path}`,
          icon: page.icon,
          type: page.type,
          id: page.id
        }))
      : [];
  }, [data, pages, searchDebounced]);
  return { isLoading, isValidating, results };
}

function _getBreadcrumb(
  page: PageMeta,
  pages: { [id: string]: { parentId?: string | null; title: string } | undefined }
): string {
  const pathElements: string[] = [];
  let currentPage: { parentId?: string | null; title: string } | undefined = { ...page };

  while (currentPage && currentPage.parentId) {
    const pageId: string = currentPage.parentId;
    currentPage = pages[pageId];
    if (currentPage) {
      pathElements.unshift(currentPage.title || 'Untitled');
    }
  }

  return pathElements.join(' / ');
}
