import styled from '@emotion/styled';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Menu, Stack } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import PropertyValueElement from 'components/common/BoardEditor/focalboard/src/components/propertyValueElement';
import { useSortable } from 'components/common/BoardEditor/focalboard/src/hooks/sortable';
import type { Mutator } from 'components/common/BoardEditor/focalboard/src/mutator';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import PropertyMenu from 'components/common/BoardEditor/focalboard/src/widgets/propertyMenu';
import type { Board, IPropertyTemplate, PropertyType, RelationPropertyData } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';
import { getPropertyName } from 'lib/focalboard/getPropertyName';

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
      {(readOnly || disableEditPropertyOption) && <PropertyLabel readOnly>{getPropertyName(property)}</PropertyLabel>}
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
            <Button>{getPropertyName(property)}</Button>
          </PropertyNameContainer>
          <Menu {...bindMenu(changePropertyPopupState)}>
            <PropertyMenu
              board={board}
              onDelete={onDelete}
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
        syncWithPageId={syncWithPageId}
        card={card}
        board={board}
        updatedAt={pageUpdatedAt}
        updatedBy={pageUpdatedBy}
        propertyTemplate={property}
        showEmptyPlaceholder
        displayType='details'
        mutator={mutator}
      />
    </Stack>
  );
}
