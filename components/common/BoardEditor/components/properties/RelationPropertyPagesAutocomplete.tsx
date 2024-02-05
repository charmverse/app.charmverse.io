import { useMemo } from 'react';

import { useSyncRelationProperty, useSyncRelationPropertyValue } from 'charmClient/hooks/blocks';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import type { PageListItem } from 'components/common/PagesList';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { getRelationPropertiesCardsRecord } from 'lib/focalboard/getRelationPropertiesCardsRecord';
import { isTruthy } from 'lib/utilities/types';

import { PagesAutocomplete } from './PagesAutocomplete';

export function RelationPropertyPagesAutocomplete({
  onChange,
  propertyTemplate,
  selectedPageListItemIds,
  readOnly,
  wrapColumn,
  displayType = 'details',
  emptyPlaceholderContent = 'Empty',
  showEmptyPlaceholder = true,
  boardProperties,
  boardId,
  cardId
}: {
  propertyTemplate: IPropertyTemplate;
  selectedPageListItemIds: string[];
  displayType?: PropertyValueDisplayType;
  readOnly?: boolean;
  onChange: (pageListItemIds: string[]) => void;
  wrapColumn?: boolean;
  emptyPlaceholderContent?: string;
  showEmptyPlaceholder?: boolean;
  boardProperties: IPropertyTemplate[];
  boardId: string;
  cardId: string;
}) {
  const { pages } = usePages();
  const { trigger } = useSyncRelationPropertyValue();

  const relationPropertiesCardsRecord = useMemo(() => {
    return getRelationPropertiesCardsRecord({
      pages: Object.values(pages),
      properties: boardProperties
    });
  }, [pages, boardProperties]);

  return (
    <PagesAutocomplete
      onChange={(pageListItemIds) => {
        onChange(pageListItemIds);
        trigger({
          templateId: propertyTemplate.id,
          cardIds: pageListItemIds,
          boardId,
          cardId
        });
      }}
      selectedPageListItems={selectedPageListItemIds.map((id) => pages[id]).filter(isTruthy) as PageListItem[]}
      pageListItems={relationPropertiesCardsRecord[propertyTemplate.id] ?? []}
      readOnly={readOnly}
      wrapColumn={wrapColumn}
      displayType={displayType}
      emptyPlaceholderContent={emptyPlaceholderContent}
      showEmptyPlaceholder={showEmptyPlaceholder}
      selectionLimit={propertyTemplate.relationData?.limit ?? 'single_page'}
      variant='standard'
    />
  );
}
