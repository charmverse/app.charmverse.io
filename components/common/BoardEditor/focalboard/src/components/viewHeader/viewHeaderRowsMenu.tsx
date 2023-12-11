import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState, type Dispatch, type SetStateAction, useRef } from 'react';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

import mutator from '../../mutator';

const StyledStack = styled(Stack)`
  background: ${({ theme }) => theme.palette.background.paper};
  flex-direction: row;
  align-items: center;
  z-index: 1;
  margin-bottom: 4px;
  overflow: auto;
  margin-right: 8px;
`;

const StyledMenuItem = styled(MenuItem)`
  border-left: 1px solid ${({ theme }) => theme.palette.divider};
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s ease-in-out;
  color: ${({ theme }) => theme.palette.text.primary};

  &:hover {
    background: ${({ theme }) => theme.palette.action.hover};
    transition: background 0.2s ease-in-out;
  }

  &:first-child {
    border-radius: 4px 0 0 4px;
  }

  &:last-child {
    border-right: 1px solid ${({ theme }) => theme.palette.divider};
    border-radius: 0 4px 4px 0;
  }
`;

function SelectPropertyTemplateMenu({
  board,
  cards,
  propertyTemplate
}: {
  board: Board;
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
}) {
  const popupState = usePopupState({ variant: 'popover' });
  // Without this state, the options menu list is not placed in the correct position
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  if (cards.length === 0) {
    return null;
  }

  const propertyValue = cards[0].fields.properties[propertyTemplate.id];

  return (
    <>
      <StyledMenuItem
        ref={ref}
        onClick={() => {
          popupState.open();
          setTimeout(() => {
            setIsSelectOpen(true);
          }, 150);
        }}
      >
        {propertyTemplate.name}
      </StyledMenuItem>
      <Menu
        anchorEl={ref.current}
        open={popupState.isOpen}
        style={{
          position: 'relative',
          top: -32.5,
          height: '100%'
        }}
        elevation={1}
        onClose={() => {
          popupState.close();
          setIsSelectOpen(false);
        }}
      >
        <Box
          sx={{
            padding: '2px 4px'
          }}
        >
          <TagSelect
            isOpen={isSelectOpen}
            canEditOptions
            multiselect={propertyTemplate.type === 'multiSelect'}
            propertyValue={propertyValue as string}
            options={propertyTemplate.options}
            onChange={async (newValue) => {
              await mutator.changePropertyValues(cards, propertyTemplate.id, newValue);
            }}
            onUpdateOption={(option) => {
              mutator.changePropertyOption(board, propertyTemplate, option);
            }}
            onDeleteOption={(option) => {
              mutator.deletePropertyOption(board, propertyTemplate, option);
            }}
            onCreateOption={(newValue) => {
              mutator.insertPropertyOption(board, propertyTemplate, newValue, 'add property option');
            }}
            displayType='table'
          />
        </Box>
      </Menu>
    </>
  );
}

function PropertyTemplateMenu({
  propertyTemplate,
  cards,
  checkedIds,
  board
}: {
  board: Board;
  checkedIds: string[];
  cards: Card[];
  propertyTemplate: IPropertyTemplate<PropertyType>;
}) {
  const isValidType = [
    'checkbox',
    'text',
    'number',
    'date',
    'multiSelect',
    'select',
    'url',
    'email',
    'phone',
    'person'
  ].includes(propertyTemplate.type);

  if (!isValidType) {
    return null;
  }

  const checkedCards = cards.filter((card) => checkedIds.includes(card.id));

  if (checkedCards.length === 0) {
    return null;
  }

  const propertyValue = checkedCards[0].fields.properties[propertyTemplate.id];

  switch (propertyTemplate.type) {
    case 'checkbox': {
      return (
        <StyledMenuItem
          onClick={() =>
            mutator.changePropertyValues(checkedCards, propertyTemplate.id, (!(propertyValue === 'true')).toString())
          }
        >
          {propertyTemplate.name}
        </StyledMenuItem>
      );
    }
    case 'select':
    case 'multiSelect': {
      return <SelectPropertyTemplateMenu board={board} cards={cards} propertyTemplate={propertyTemplate} />;
    }

    default: {
      return <StyledMenuItem>{propertyTemplate.name}</StyledMenuItem>;
    }
  }
}

export function ViewHeaderRowsMenu({
  cards,
  checkedIds,
  setCheckedIds,
  board,
  propertyTemplates
}: {
  board: Board;
  cards: Card[];
  setCheckedIds: Dispatch<SetStateAction<string[]>>;
  checkedIds: string[];
  propertyTemplates: IPropertyTemplate<PropertyType>[];
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteCheckedCards() {
    setIsDeleting(true);
    try {
      await mutator.deleteBlocks(checkedIds, 'delete cards');
    } catch (_) {
      //
    } finally {
      setCheckedIds([]);
      setIsDeleting(false);
    }
  }

  return (
    <StyledStack>
      <StyledMenuItem>
        <Typography onClick={() => setCheckedIds([])} color='primary' variant='body2'>
          {checkedIds.length} selected
        </Typography>
      </StyledMenuItem>
      {cards.length !== 0
        ? propertyTemplates.map((propertyTemplate) => (
            <PropertyTemplateMenu
              board={board}
              checkedIds={checkedIds}
              cards={cards}
              propertyTemplate={propertyTemplate}
              key={propertyTemplate.id}
            />
          ))
        : null}
      <StyledMenuItem onClick={deleteCheckedCards} disabled={isDeleting}>
        <DeleteOutlinedIcon fontSize='small' />
      </StyledMenuItem>
    </StyledStack>
  );
}
