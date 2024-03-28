import { useMemo } from 'react';

import { isTruthy } from 'lib/utils/types';

import { usePages } from './usePages';

export function useRootPages() {
  const { pages, loadingPages } = usePages();
  const rootPages = useMemo(
    () =>
      Object.values(pages)
        .filter(
          (page) =>
            page && !page.parentId && (page.type === 'board' || page.type === 'linked_board' || page.type === 'page')
        )
        .filter(isTruthy)
        .sort((a, b) => a.index - b.index),
    [pages]
  );
  return { rootPages, isLoading: loadingPages };
}
