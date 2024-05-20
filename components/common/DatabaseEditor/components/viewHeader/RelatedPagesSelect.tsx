import { Autocomplete, TextField, Stack } from '@mui/material';
import { useMemo, useEffect } from 'react';

import { PageIcon } from 'components/common/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';

import { makeSelectCardsFromBoard } from '../../store/cards';
import { initialDatabaseLoad } from '../../store/databaseBlocksLoad';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

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
    <Autocomplete<string, true>
      size='small'
      multiple
      value={value}
      onChange={(_e, newValue) => onChange(newValue)}
      options={options}
      noOptionsText='No cards found'
      renderInput={(params) => <TextField {...params} placeholder='Select a page' />}
      renderTags={(cardIds, getTagProps) => (
        <Stack direction='row'>
          {cardIds.map((cardId, index) => {
            const card = cards.find((c) => c.id === cardId);
            return (
              <Stack direction='row' {...getTagProps({ index })} key={cardId}>
                <PageIcon icon={card?.icon} isEditorEmpty={!card?.hasContent} pageType={card?.type} />
                <PageTitle hasContent={!card?.title}>{card?.title || 'Untitled'}</PageTitle>
              </Stack>
            );
          })}
        </Stack>
      )}
      sx={{ flex: 1 }}
      renderOption={(props, option) => {
        const card = cards.find((c) => c.id === option);
        return (
          <li {...props}>
            <PageIcon icon={card?.icon} isEditorEmpty={!card?.hasContent} pageType={card?.type} />
            <PageTitle hasContent={!card?.title}>{card?.title || 'Untitled'}</PageTitle>
          </li>
        );
      }}
    />
  );
}
