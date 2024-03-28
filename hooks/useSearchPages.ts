import type { PageMeta } from '@charmverse/core/pages';
import type { PageType } from '@charmverse/core/prisma';
import { useMemo } from 'react';

import { useGetSearchPages } from 'charmClient/hooks/pages';
import { stringSimilarity } from 'lib/utils/strings';

import { useCurrentSpace } from './useCurrentSpace';
import { useDebouncedValue } from './useDebouncedValue';
import { usePages } from './usePages';

export type SearchResultItem = {
  icon?: string | null;
  group?: string; // for grouping results, eg. by date
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
    return sortList({
      triggerText: searchDebounced,
      list: (searchDebounced ? data || [] : [])?.map((page) => ({
        title: page.title || 'Untitled',
        breadcrumb: getBreadcrumb(page, pages),
        path: `/${page.path}`,
        icon: page.icon,
        type: page.type,
        id: page.id
      }))
    });
  }, [data, pages, searchDebounced]);
  return { isLoading, isValidating, results };
}

export function getBreadcrumb(
  page: { parentId?: string | null; title?: string },
  pages: { [id: string]: { parentId?: string | null; title?: string } | undefined }
): string {
  const pathElements: string[] = [];
  let currentPage: { parentId?: string | null; title?: string } | undefined = { ...page };

  while (currentPage && currentPage.parentId) {
    const pageId: string = currentPage.parentId;
    currentPage = pages[pageId];
    if (currentPage) {
      pathElements.unshift(currentPage.title || 'Untitled');
    }
  }

  return pathElements.join(' / ');
}

export function sortList<T extends { title: string; originalTitle?: string }>({
  triggerText,
  list
}: {
  triggerText: string;
  list: T[];
}): T[] {
  return list
    .map((item) => ({
      item,
      similarity: stringSimilarity(item.originalTitle || item.title, triggerText)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ item }) => item);
}
