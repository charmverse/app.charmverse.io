import styled from '@emotion/styled';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Menu, Stack, Tooltip } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import type { Board, IPropertyTemplate, PropertyType, RelationPropertyData } from 'lib/databases/board';
import type { Card } from 'lib/databases/card';

import { useSortable } from '../../hooks/sortable';
import type { Mutator } from '../../mutator';
import Button from '../../widgets/buttons/button';
import PropertyMenu from '../../widgets/propertyMenu';
import { PropertyLabel } from '../properties/PropertyLabel';
import PropertyValueElement from '../propertyValueElement';

export const PropertyNameContainer = styled(Stack)`
  position: relative;
  flex-direction: row;
  align-items: center;

  &:hover .icons {
    opacity: 1;
    transition: opacity 150ms ease-in-out;
  }

  & .icons {
    position: absolute;
    opacity: 0;
    z-index: 1;
    left: -25px;
    cursor: pointer;
    transition: opacity 150ms ease-in-out;
  }
`;

export function CardDetailProperty({
  readOnly,
  property,
  onTypeAndNameChanged,
  board,
  card,
  onDelete,
  onRestore,
  pageUpdatedBy,
  pageUpdatedAt,
  deleteDisabledMessage,
  onDrop,
  syncWithPageId,
  mutator,
  disableEditPropertyOption,
  showCard
}: {
  syncWithPageId?: string | null;
  readOnly: boolean;
  property: IPropertyTemplate;
  card: Card;
  board: Board;
  onTypeAndNameChanged: (newType: PropertyType, newName: string, relationData?: RelationPropertyData) => void;
  onDelete: VoidFunction;
  onRestore: VoidFunction;
  pageUpdatedAt: string;
  pageUpdatedBy: string;
  deleteDisabledMessage?: string;
  mutator: Mutator;
  disableEditPropertyOption?: boolean;
  onDrop: (template: IPropertyTemplate, container: IPropertyTemplate) => void;
  showCard?: (cardId: string | null) => void;
}) {
  const [isDragging, isOver, columnRef] = useSortable('column', property, !readOnly, onDrop);
  const changePropertyPopupState = usePopupState({ variant: 'popover', popupId: 'card-property' });
  const propertyTooltip = property.deletedAt
    ? 'This property was deleted'
    : property.name.length > 20
      ? property.name
      : '';

  return (
    <Stack
      ref={columnRef}
      sx={{
        minWidth: 250,
        overflow: 'unset',
        flexDirection: 'row',
        // Allow dragging past left border
        paddingLeft: '150px',
        marginLeft: '-150px !important'
        // position: 'relative',
        // right: '150px'
      }}
      className='octo-propertyrow'
    >
      {(readOnly || disableEditPropertyOption) && (
        <PropertyLabel tooltip={propertyTooltip} readOnly deleted={!!property.deletedAt}>
          {property.name}
        </PropertyLabel>
      )}
      {!readOnly && !disableEditPropertyOption && (
        <Box>
          <PropertyNameContainer
            className='octo-propertyname'
            {...bindTrigger(changePropertyPopupState)}
            sx={{
              opacity: isDragging ? 0.5 : 1,
              transition: `background-color 150ms ease-in-out`,
              backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial'
            }}
          >
            <DragIndicatorIcon className='icons' fontSize='small' color='secondary' />
            <Tooltip title={propertyTooltip} disableInteractive>
              <span>
                <Button deleted={!!property.deletedAt}>{property.name}</Button>
              </span>
            </Tooltip>
          </PropertyNameContainer>
          <Menu {...bindMenu(changePropertyPopupState)}>
            <PropertyMenu
              board={board}
              onDelete={onDelete}
              onRestore={() => {
                onRestore();
                changePropertyPopupState.close();
              }}
              deleteDisabled={deleteDisabledMessage?.length !== 0}
              property={property}
              onTypeAndNameChanged={(newType, newName, relationData) => {
                onTypeAndNameChanged(newType, newName, relationData);
                changePropertyPopupState.close();
              }}
            />
          </Menu>
        </Box>
      )}
      <PropertyValueElement
        showCard={showCard}
        readOnly={readOnly}
        card={card}
        board={board}
        updatedAt={pageUpdatedAt}
        updatedBy={pageUpdatedBy}
        propertyTemplate={property}
        showEmptyPlaceholder
        displayType='details'
        mutator={mutator}
        disableEditPropertyOption={disableEditPropertyOption}
      />
    </Stack>
  );
}
