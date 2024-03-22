import { useMemo } from 'react';

import { useGetSubtree } from 'charmClient/hooks/blocks';
import type { Board, IPropertyTemplate } from 'lib/databases/board';

import type { PropertyValueDisplayType } from '../../interfaces';
import { makeSelectBoard } from '../../store/boards';
import { makeSelectCardsFromBoard } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';

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
  showCard
}: {
  propertyTemplate: IPropertyTemplate;
  selectedPageListItemIds: string[];
  displayType?: PropertyValueDisplayType;
  readOnly?: boolean;
  onChange: (cardIds: string[]) => void;
  wrapColumn?: boolean;
  emptyPlaceholderContent?: string;
  showEmptyPlaceholder?: boolean;
  showCard?: (cardId: string | null, isTemplate?: boolean) => void;
}) {
  const boardId = propertyTemplate.relationData?.boardId || '';
  const selectCardsFromBoard = useMemo(makeSelectCardsFromBoard, []);
  const cards = useAppSelector((state) => selectCardsFromBoard(state, boardId));
  const selectBoard = useMemo(makeSelectBoard, []);
  const board = useAppSelector((state) => selectBoard(state, boardId));

  return (
    <PagesAutocomplete
      board={board}
      multiple={propertyTemplate.relationData?.limit !== 'single_page'}
      showCard={showCard}
      onChange={onChange}
      value={selectedPageListItemIds}
      cards={cards}
      readOnly={readOnly}
      wrapColumn={wrapColumn}
      displayType={displayType}
      emptyPlaceholderContent={emptyPlaceholderContent}
      showEmptyPlaceholder={showEmptyPlaceholder}
      variant='standard'
    />
  );
}
