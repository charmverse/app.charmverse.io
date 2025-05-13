import type { PageType } from '@charmverse/core/prisma';
import { stringSimilarity } from '@packages/utils/strings';
import { useEffect, useState } from 'react';

import { useGetSearchPages } from 'charmClient/hooks/pages';

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
} {
  const { space } = useCurrentSpace();
  const { pages } = usePages();
  const searchDebounced = useDebouncedValue(search, 200);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  // note that isLoading is set to true each time the search changes, because it leads to a new URL and new key
  const { data, isLoading: isBackendLoading } = useGetSearchPages({
    // dont query if search is empty
    spaceId: searchDebounced && space?.id,
    search: searchDebounced,
    limit
  });

  // when search string changes, data is undefined and isLoading is false for some reason at first
  const isLoading = Boolean(isBackendLoading || (searchDebounced && !data));

  useEffect(() => {
    if (!searchDebounced) {
      setResults([]);
    } else if (data) {
      const _results = sortList({
        triggerText: searchDebounced,
        list: data.map((page) => ({
          title: page.title || 'Untitled',
          breadcrumb: getBreadcrumb(page, pages),
          path: page.path,
          icon: page.icon,
          type: page.type,
          id: page.id
        }))
      });
      setResults(_results);
    }
  }, [data, pages, searchDebounced, setResults]);

  return { isLoading, results };
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
