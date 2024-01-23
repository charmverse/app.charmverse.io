import type { PageListItemsRecord } from 'components/common/BoardEditor/interfaces';
import type { PagesMap } from 'lib/pages';
import { isTruthy } from 'lib/utilities/types';

import type { Board } from './board';

export function getRelationPropertiesCardsRecord({ activeBoard, pages }: { activeBoard: Board; pages: PagesMap }) {
  const boardCardsRecord: PageListItemsRecord = {};
  const relationProperties = activeBoard.fields.cardProperties.filter((o) => o.type === 'relation');

  Object.values(pages)
    .filter(isTruthy)
    .forEach((page) => {
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
