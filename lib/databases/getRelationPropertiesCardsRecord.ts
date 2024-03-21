import type { PageMeta } from '@charmverse/core/pages';

import type { PageListItemsRecord } from 'components/common/DatabaseEditor/interfaces';
import type { PageListItem } from 'components/common/PagesList';
import { isTruthy } from 'lib/utils/types';

import type { IPropertyTemplate } from './board';

export function getRelationPropertiesCardsRecord({
  properties,
  pages
}: {
  properties: IPropertyTemplate[];
  pages: ((PageListItem & { parentId: PageMeta['parentId'] }) | undefined)[];
}) {
  const boardCardsRecord: PageListItemsRecord = {};
  const relationProperties = properties.filter((o) => o.type === 'relation');

  pages.filter(isTruthy).forEach((page) => {
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
