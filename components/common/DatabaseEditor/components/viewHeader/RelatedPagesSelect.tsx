import { Autocomplete, Typography } from '@mui/material';
import { useMemo, useEffect } from 'react';

import type { Card } from 'lib/databases/card';
import { isTruthy } from 'lib/utils/types';

import { makeSelectCardsFromBoard } from '../../store/cards';
import { initialDatabaseLoad } from '../../store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { RelationPageListItemsContainer } from '../properties/PagesAutocomplete';

type Props = {
  boardPageId?: string;
  value: string[];
  onChange: (pageListItemIds: string[]) => void;
};

export function RelatedPagesSelect({ boardPageId, onChange, value }: Props) {
  const selectCardsFromBoard = useMemo(makeSelectCardsFromBoard, []);
  const cards = useAppSelector((state) => selectCardsFromBoard(state, boardPageId || ''));
  const dispatch = useAppDispatch();
  // Load database if necessary
  useEffect(() => {
    // only load board if there are no cards yet (assuming that means it is not loaded yet)
    if (boardPageId && cards.length === 0) {
      dispatch(initialDatabaseLoad({ pageId: boardPageId }));
    }
  }, [dispatch, boardPageId, cards.length]);

  const options = cards.map((b) => b.id) || [];

  return (
    <Autocomplete
      size='small'
      multiple
      value={value}
      onChange={(e, newValue) => onChange(newValue)}
      options={options}
      renderInput={(params) => {
        const cardIds = Array.isArray(params.inputProps.value) ? params.inputProps.value : [];
        return cardIds.length === 0 ? (
          <Typography color='secondary' fontSize='small'>
            Select a page
          </Typography>
        ) : (
          <RelationPageListItemsContainer
            cards={cardIds
              .map((cardId) => {
                return cards.find((card) => card.id === cardId) as Card | undefined;
              })
              .filter(isTruthy)}
          />
        );
      }}
    />
  );
}
