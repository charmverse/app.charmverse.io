import type { PageListItemsRecord } from 'components/common/DatabaseEditor/interfaces';
import type { PageListItem } from 'components/common/PagesList';
import type { Card } from 'lib/databases/card';

import type { IPropertyTemplate } from './board';

export function getRelationPropertiesCardsRecord({
  properties,
  cards
}: {
  properties: IPropertyTemplate[];
  cards: Card[];
}) {
  const boardCardsRecord: PageListItemsRecord = {};
  const relationProperties = properties.filter((o) => o.type === 'relation');

  cards.forEach((card) => {
    const pageListItem: PageListItem = {
      icon: card.icon || null,
      id: card.pageId || '',
      title: card.title,
      hasContent: !!card.hasContent,
      path: card.pageId || '',
      type: 'card'
    };
    if (card.type === 'card' && card.parentId) {
      if (!boardCardsRecord[card.parentId]) {
        boardCardsRecord[card.parentId] = [pageListItem];
      } else {
        boardCardsRecord[card.parentId].push(pageListItem);
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
