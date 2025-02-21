import type { PageMeta } from '@charmverse/core/pages';
import { isTruthy } from '@packages/lib/utils/types';

import { findParentOfType } from './findParentOfType';

export function filterVisiblePages<T extends Pick<PageMeta, 'type' | 'id'> | undefined>(
  pageMap: Record<string, T>,
  rootPageIds: string[] = []
): T[] {
  return Object.values(pageMap).filter((page) =>
    isTruthy(
      page &&
        (page.type === 'board' ||
          page.type === 'page' ||
          page.type === 'linked_board' ||
          rootPageIds?.includes(page.id)) &&
        !findParentOfType({
          pageId: page.id,
          pageType: 'card',
          pageMap
        })
    )
  );
}
