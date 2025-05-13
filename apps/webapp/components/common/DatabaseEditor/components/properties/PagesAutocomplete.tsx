import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  Autocomplete,
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import type { ReactNode } from 'react';
import React, { useCallback, useMemo, useState } from 'react';

import { PageIcon } from 'components/common/PageIcon';
import PageTitle from 'components/common/PageLayout/components/PageTitle';
import { useCharmRouter } from 'hooks/useCharmRouter';
import type { Board } from '@packages/databases/board';
import type { Card } from '@packages/databases/card';

import type { PropertyValueDisplayType } from '../../interfaces';

import { EmptyPlaceholder } from './EmptyPlaceholder';
import { PopupFieldWrapper } from './PopupFieldWrapper';
import { SelectPreviewContainer } from './TagSelect/TagSelect';
import { StyledUserPropertyContainer } from './UserAndRoleSelect';

const StyledAutocomplete = styled(Autocomplete<Card, true, boolean>)`
  min-width: 150px;
  .MuiAutocomplete-inputRoot {
    gap: 4px;
  }
`;

const renderDiv = (props: any & { children: ReactNode }) => <div>{props.children}</div>;

const StyledStack = styled(Stack)`
  flex-direction: row;
  align-items: center;
  overflow-x: hidden;
  cursor: pointer;
`;

const StyledRelatedPage = styled(Stack)`
  flex-direction: row;
  padding-left: ${({ theme }) => theme.spacing(0.5)};
  padding-right: ${({ theme }) => theme.spacing(0.5)};
  align-items: center;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.spacing(0.25)};
  transition: ${({ theme }) =>
    theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
      duration: theme.transitions.duration.shortest
    })};

  &:hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    transition: ${({ theme }) =>
      theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
        duration: theme.transitions.duration.shortest
      })};
  }
`;

export function RelationPageListItemsContainer({
  readOnly,
  cards,
  onRemove,
  onClick
}: {
  readOnly?: boolean;
  cards: Pick<Card, 'id' | 'icon' | 'hasContent' | 'title' | 'type'>[];
  onRemove?: (id: string) => void;
  onClick?: (id: string) => void;
}) {
  return (
    <>
      {cards.map((card) => {
        return (
          <StyledStack key={card.id} onClick={() => onClick?.(card.id)}>
            <PageIcon icon={card.icon} isEditorEmpty={!card.hasContent} pageType={card.type} />
            <PageTitle hasContent={!card.title}>{card.title || 'Untitled'}</PageTitle>

            {!readOnly && onRemove && (
              <IconButton sx={{ ml: 1 }} size='small' onClick={() => onRemove(card.id)}>
                <CloseIcon
                  sx={{
                    fontSize: 14
                  }}
                  cursor='pointer'
                  color='secondary'
                />
              </IconButton>
            )}
          </StyledStack>
        );
      })}
    </>
  );
}

function PagesAutocompleteBase({
  board,
  onChange,
  value: selectedCardIds,
  cards,
  readOnly,
  wrapColumn,
  displayType = 'details',
  emptyPlaceholderContent = 'Empty',
  showEmptyPlaceholder = true,
  variant = 'standard',
  multiple,
  showCard
}: {
  board?: Board;
  displayType?: PropertyValueDisplayType;
  readOnly?: boolean;
  cards: Card[];
  value: string[];
  onChange: (pageListItemIds: string[]) => void;
  wrapColumn?: boolean;
  emptyPlaceholderContent?: string;
  showEmptyPlaceholder?: boolean;
  variant?: 'outlined' | 'standard';
  multiple: boolean;
  showCard?: (cardId: string | null) => void;
}) {
  const { navigateToSpacePath } = useCharmRouter();
  const [isOpen, setIsOpen] = useState(false);

  const { sortedCards, selected, selectedCards } = useMemo(() => {
    const _selected = selectedCardIds.reduce<Record<string, boolean>>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
    const _selectedCards = cards.filter((card) => _selected[card.id]);
    const _sortedCards: Card[] = [...cards].sort(
      (cardA, cardB) =>
        (_selected[cardB.id] ? 1 : 0) - (_selected[cardA.id] ? 1 : 0) || (cardA.title > cardB.title ? 1 : -1)
    );
    return { selected: _selected, selectedCards: _selectedCards, sortedCards: _sortedCards };
  }, [cards, selectedCardIds]);

  const onClickToEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  const popupField = displayType === 'table';

  const previewField = (
    <SelectPreviewContainer
      isHidden={popupField ? false : isOpen}
      displayType={displayType}
      readOnly={readOnly}
      onClick={onClickToEdit}
    >
      <Box display='inline-flex' flexWrap={wrapColumn ? 'wrap' : 'nowrap'} gap={1}>
        {selectedCardIds.length === 0 ? (
          showEmptyPlaceholder && <EmptyPlaceholder>{emptyPlaceholderContent}</EmptyPlaceholder>
        ) : (
          <RelationPageListItemsContainer
            readOnly={readOnly}
            cards={selectedCards}
            // only showCard if its in readOnly mode since we need to open the select field in non readOnly mode
            onClick={readOnly ? showCard : undefined}
          />
        )}
      </Box>
    </SelectPreviewContainer>
  );

  const activeField = (
    <StyledUserPropertyContainer displayType='details'>
      <StyledAutocomplete
        PopperComponent={popupField ? renderDiv : undefined}
        PaperComponent={popupField ? renderDiv : undefined}
        disableClearable
        forcePopupIcon={false}
        fullWidth
        groupBy={(option) => (selected[option.id] ? 'Linked' : 'Link another page')}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        multiple
        getOptionLabel={(option) => option.title} // prevent errors in console
        noOptionsText='No pages found'
        onClose={() => {
          setIsOpen(false);
        }}
        openOnFocus
        options={sortedCards}
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus={variant === 'standard'}
            size='small'
            // value={selectedCards}
            placeholder='Link a page'
            InputProps={{
              ...params.InputProps,
              endAdornment: board ? (
                <Stack flexDirection='row'>
                  <Typography variant='subtitle1' color='secondary' mr={0.5}>
                    in
                  </Typography>
                  <StyledRelatedPage
                    onClick={() => {
                      navigateToSpacePath(`/${board.id}`);
                    }}
                  >
                    <PageIcon size='small' icon={board.icon} pageType='board' />
                    <PageTitle sx={{ fontWeight: 'bold', maxWidth: 250, flexGrow: 1 }}>
                      {board.title || 'Untitled'}
                    </PageTitle>
                  </StyledRelatedPage>
                </Stack>
              ) : null,
              ...(variant === 'standard' && { disableUnderline: true })
            }}
            variant={variant}
          />
        )}
        renderOption={(props, card) => {
          return (
            <MenuItem
              key={card.id}
              data-test={`page-option-${card.id}`}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                flexDirection: 'row'
              }}
              onClick={() => {
                if (!selected[card.id]) {
                  if (multiple) {
                    return onChange([card.id, ...Object.keys(selected)]);
                  } else {
                    return onChange([card.id]);
                  }
                } else {
                  showCard?.(card.id);
                }
              }}
            >
              <ListItemIcon>
                <PageIcon icon={card.icon} isEditorEmpty={!card.hasContent} pageType='card' />
              </ListItemIcon>
              <ListItemText>{card.title || 'Untitled'}</ListItemText>

              {selected[card.id] ? (
                <Tooltip title='Unlink page'>
                  <ListItemIcon>
                    <IconButton
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(selectedCardIds.filter((v) => v !== card.id));
                      }}
                    >
                      <RemoveIcon fontSize='small' color='secondary' />
                    </IconButton>
                  </ListItemIcon>
                </Tooltip>
              ) : (
                <Tooltip title='Link page'>
                  <ListItemIcon>
                    <IconButton size='small'>
                      <AddIcon fontSize='small' color='secondary' />
                    </IconButton>
                  </ListItemIcon>
                </Tooltip>
              )}
            </MenuItem>
          );
        }}
        renderTags={() => null}
        disabled={!!readOnly}
        value={selectedCards}
      />
    </StyledUserPropertyContainer>
  );

  if (displayType === 'table') {
    return (
      <PopupFieldWrapper
        paperSx={{
          width: 500
        }}
        disabled={readOnly}
        previewField={previewField}
        activeField={activeField}
      />
    );
  }

  if (variant === 'standard' && !isOpen) {
    return previewField;
  }

  return activeField;
}

export const PagesAutocomplete = React.memo(PagesAutocompleteBase);
