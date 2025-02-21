import { pageTree } from '@charmverse/core/pages/utilities';
import { isTruthy } from '@packages/utils/types';
import { useMemo } from 'react';

import { usePages } from './usePages';

export function useRootPages() {
  const { pages, loadingPages } = usePages();
  const rootPages = useMemo(
    () =>
      pageTree.sortNodes(
        Object.values(pages)
          .filter(
            (page) =>
              page && !page.parentId && (page.type === 'board' || page.type === 'linked_board' || page.type === 'page')
          )
          .filter(isTruthy)
      ),
    [pages]
  );
  return { rootPages, isLoading: loadingPages };
}
