import { useGetSubtree } from 'charmClient/hooks/blocks';
import type { Board, IPropertyTemplate } from 'lib/databases/board';
import type { Card } from 'lib/databases/card';

import type { PropertyValueDisplayType } from '../../interfaces';

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
  const boardId = propertyTemplate.id;
  const { blocks, isLoading } = useGetSubtree(boardId);

  const options = (blocks.filter((block) => block.type === 'card' && block.parentId === boardId) as Card[]) || [];
  const board = blocks.find((block) => block.id === boardId) as Board | undefined;

  return (
    <PagesAutocomplete
      board={board}
      loading={isLoading}
      multiple={propertyTemplate.relationData?.limit !== 'single_page'}
      showCard={showCard}
      onChange={onChange}
      value={selectedPageListItemIds}
      cards={options}
      readOnly={readOnly}
      wrapColumn={wrapColumn}
      displayType={displayType}
      emptyPlaceholderContent={emptyPlaceholderContent}
      showEmptyPlaceholder={showEmptyPlaceholder}
      variant='standard'
    />
  );
}
