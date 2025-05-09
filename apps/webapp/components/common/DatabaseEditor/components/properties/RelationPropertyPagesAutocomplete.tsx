import { useEffect, useMemo } from 'react';

import type { IPropertyTemplate } from '@packages/databases/board';

import type { PropertyValueDisplayType } from '../../interfaces';
import { makeSelectBoard } from '../../store/boards';
import { makeSelectCardsFromBoard } from '../../store/cards';
import { initialDatabaseLoad } from '../../store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

import { PagesAutocomplete } from './PagesAutocomplete';

export function RelationPropertyPagesAutocomplete({
  onChange,
  propertyTemplate,
  value,
  readOnly,
  wrapColumn,
  displayType = 'details',
  emptyPlaceholderContent = 'Empty',
  showEmptyPlaceholder = true,
  showCard
}: {
  propertyTemplate: IPropertyTemplate;
  value: string | string[];
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
  const dispatch = useAppDispatch();

  const selectedBlockIds = useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }, [value]);

  // Load database if necessary
  useEffect(() => {
    // only load board if there are no cards yet (assuming that means it is not loaded yet)
    if (boardId && cards.length === 0) {
      dispatch(initialDatabaseLoad({ pageId: boardId }));
    }
  }, [dispatch, boardId, cards.length]);

  return (
    <PagesAutocomplete
      board={board}
      multiple={propertyTemplate.relationData?.limit !== 'single_page'}
      showCard={showCard}
      onChange={onChange}
      value={selectedBlockIds}
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
