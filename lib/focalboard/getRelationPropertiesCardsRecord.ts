import type { PageMeta } from '@charmverse/core/dist/cjs/pages';

import type { PageListItemsRecord } from 'components/common/BoardEditor/interfaces';
import type { PageListItem } from 'components/common/PagesList';
import { isTruthy } from 'lib/utilities/types';

import type { Board } from './board';

export function getRelationPropertiesCardsRecord({
  activeBoard,
  pages
}: {
  activeBoard: Board;
  pages:
    | (PageListItem & { parentId: PageMeta['parentId'] })[]
    | Record<string, (PageListItem & { parentId: PageMeta['parentId'] }) | undefined>;
}) {
  const boardCardsRecord: PageListItemsRecord = {};
  const relationProperties = activeBoard.fields.cardProperties.filter((o) => o.type === 'relation');

  (Array.isArray(pages) ? pages : Object.values(pages)).filter(isTruthy).forEach((page) => {
    const pageListItem = {
      icon: page.icon,
      id: page.id,
      title: page.title,
      hasContent: page.hasContent,
      path: page.path,
      type: page.type
    };
    if (page.type === 'card' && page.parentId) {
      if (!boardCardsRecord[page.parentId]) {
        boardCardsRecord[page.parentId] = [pageListItem];
      } else {
        boardCardsRecord[page.parentId].push(pageListItem);
      }
    }
  });

  return relationProperties.reduce<PageListItemsRecord>((acc, relationProperty) => {
    const boardId = relationProperty.relationData?.boardId;
    if (boardId && boardCardsRecord[boardId]) {
      acc[relationProperty.id] = boardCardsRecord[boardId];
    }
    return acc;
  }, {});
}
