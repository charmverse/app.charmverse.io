import { useMemo } from 'react';

import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import type { PageListItem } from 'components/common/PagesList';
import { usePages } from 'hooks/usePages';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { getRelationPropertiesCardsRecord } from 'lib/focalboard/getRelationPropertiesCardsRecord';
import { isTruthy } from 'lib/utils/types';

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
  showCard
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
  showCard?: (cardId: string | null, isTemplate?: boolean) => void;
}) {
  const { pages } = usePages();
  const relationPropertiesCardsRecord = useMemo(() => {
    return getRelationPropertiesCardsRecord({
      pages: Object.values(pages),
      properties: boardProperties
    });
  }, [pages, boardProperties]);

  return (
    <PagesAutocomplete
      showCard={showCard}
      onChange={onChange}
      selectedPageListItems={selectedPageListItemIds.map((id) => pages[id]).filter(isTruthy) as PageListItem[]}
      pageListItems={relationPropertiesCardsRecord[propertyTemplate.id] ?? []}
      readOnly={readOnly}
      wrapColumn={wrapColumn}
      displayType={displayType}
      relationTemplate={propertyTemplate}
      emptyPlaceholderContent={emptyPlaceholderContent}
      showEmptyPlaceholder={showEmptyPlaceholder}
      variant='standard'
    />
  );
}
