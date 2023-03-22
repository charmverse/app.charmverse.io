import styled from '@emotion/styled';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Menu, Stack } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { isTruthy } from 'lib/utilities/types';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import Button from '../../widgets/buttons/button';
import PropertyMenu, { typeDisplayName } from '../../widgets/propertyMenu';
import { PropertyTypes } from '../../widgets/propertyTypes';
import Calculations from '../calculations/calculations';
import PropertyValueElement from '../propertyValueElement';

type Props = {
  board: Board;
  card: Card;
  cards: Card[];
  activeView?: BoardView;
  views: BoardView[];
  readOnly: boolean;
  pageUpdatedBy: string;
  pageUpdatedAt: string;
};

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

function CardDetailProperty({
  readOnly,
  property,
  onTypeAndNameChanged,
  board,
  card,
  onDelete,
  pageUpdatedBy,
  pageUpdatedAt,
  deleteDisabledMessage,
  onDrop
}: {
  readOnly: boolean;
  property: IPropertyTemplate;
  card: Card;
  board: Board;
  onTypeAndNameChanged: (newType: PropertyType, newName: string) => void;
  onDelete: VoidFunction;
  pageUpdatedAt: string;
  pageUpdatedBy: string;
  deleteDisabledMessage?: string;
  onDrop: (template: IPropertyTemplate, container: IPropertyTemplate) => void;
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
        position: 'relative',
        right: '150px'
      }}
      className='octo-propertyrow'
    >
      {readOnly && (
        <div className='octo-propertyname octo-propertyname--readonly'>
          <Button>{property.name}</Button>
        </div>
      )}
      {!readOnly && (
        <Box>
          <PropertyNameContainer
            className='octo-propertyname'
            sx={{
              opacity: isDragging ? 0.5 : 1,
              transition: `background-color 150ms ease-in-out`,
              backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial'
            }}
          >
            <DragIndicatorIcon className='icons' fontSize='small' color='secondary' />
            <Button {...bindTrigger(changePropertyPopupState)}>{property.name}</Button>
          </PropertyNameContainer>
          <Menu {...bindMenu(changePropertyPopupState)}>
            <PropertyMenu
              onDelete={onDelete}
              deleteDisabled={deleteDisabledMessage?.length !== 0}
              property={property}
              onTypeAndNameChanged={(newType, newName) => {
                onTypeAndNameChanged(newType, newName);
                changePropertyPopupState.close();
              }}
            />
          </Menu>
        </Box>
      )}
      <PropertyValueElement
        readOnly={readOnly}
        card={card}
        board={board}
        updatedAt={pageUpdatedAt}
        updatedBy={pageUpdatedBy}
        propertyTemplate={property}
        showEmptyPlaceholder={true}
        displayType='details'
      />
    </Stack>
  );
}

function CardDetailProperties(props: Props) {
  const { board, card, cards, views, activeView, pageUpdatedAt, pageUpdatedBy } = props;
  const [newTemplateId, setNewTemplateId] = useState('');
  const intl = useIntl();
  const addPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'add-property' });
  const { showMessage } = useSnackbar();
  useEffect(() => {
    const newProperty = board.fields.cardProperties.find((property) => property.id === newTemplateId);
    if (newProperty) {
      setNewTemplateId('');
    }
  }, [newTemplateId, board.fields.cardProperties]);

  const [confirmationDialogBox, setConfirmationDialogBox] = useState<{
    heading: string;
    subText?: string;
    confirmButtonText?: string;
    onConfirm: () => void;
    onClose: () => void;
  }>({
    heading: '',
    onConfirm: () => {},
    onClose: () => {}
  });

  const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false);

  const onDrop = async (sourceProperty: IPropertyTemplate, destinationProperty: IPropertyTemplate) => {
    const cardPropertyIds = [...board.fields.cardProperties.map((cardProperty) => cardProperty.id)];
    const destIndex = cardPropertyIds.indexOf(destinationProperty.id);
    const srcIndex = cardPropertyIds.indexOf(sourceProperty.id);
    cardPropertyIds.splice(srcIndex, 1);
    cardPropertyIds.splice(destIndex, 0, sourceProperty.id);
    await charmClient.patchBlock(
      board.id,
      {
        updatedFields: {
          cardProperties: cardPropertyIds
            .map((cardPropertyId) =>
              board.fields.cardProperties.find((cardProperty) => cardProperty.id === cardPropertyId)
            )
            .filter(isTruthy)
        }
      },
      () => {}
    );
  };

  function onPropertyChangeSetAndOpenConfirmationDialog(
    newType: PropertyType,
    newName: string,
    propertyTemplate: IPropertyTemplate
  ) {
    const oldType = propertyTemplate.type;

    // do nothing if no change
    if (oldType === newType && propertyTemplate.name === newName) {
      return;
    }

    const affectsNumOfCards: string = Calculations.countNotEmpty(cards, propertyTemplate, intl);

    // if no card has this value set delete the property directly without warning
    if (affectsNumOfCards === '0') {
      mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName);
      return;
    }

    let subTextString = intl.formatMessage(
      {
        id: 'CardDetailProperty.property-name-change-subtext',
        defaultMessage: 'type from "{oldPropType}" to "{newPropType}"'
      },
      { oldPropType: oldType, newPropType: newType }
    );

    if (propertyTemplate.name !== newName) {
      subTextString = intl.formatMessage(
        {
          id: 'CardDetailProperty.property-type-change-subtext',
          defaultMessage: 'name to "{newPropName}"'
        },
        { newPropName: newName }
      );
    }

    setConfirmationDialogBox({
      heading: intl.formatMessage({
        id: 'CardDetailProperty.confirm-property-type-change',
        defaultMessage: 'Confirm Property Type Change!'
      }),
      subText: intl.formatMessage(
        {
          id: 'CardDetailProperty.confirm-property-name-change-subtext',
          defaultMessage:
            'Are you sure you want to change property "{propertyName}" {customText}? This will affect value(s) across {numOfCards} card(s) in this board, and can result in data loss.'
        },
        {
          propertyName: propertyTemplate.name,
          customText: subTextString,
          numOfCards: affectsNumOfCards
        }
      ),

      confirmButtonText: intl.formatMessage({
        id: 'CardDetailProperty.property-change-action-button',
        defaultMessage: 'Change Property'
      }),
      onConfirm: async () => {
        setShowConfirmationDialog(false);
        try {
          await mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName);
        } catch (err: any) {
          Utils.logError(`Error Changing Property And Name:${propertyTemplate.name}: ${err?.toString()}`);
        }
        showMessage(
          intl.formatMessage({
            id: 'CardDetailProperty.property-changed',
            defaultMessage: 'Changed property successfully!'
          }),
          'success'
        );
      },
      onClose: () => setShowConfirmationDialog(false)
    });

    // open confirmation dialog for property type or name change
    setShowConfirmationDialog(true);
  }

  function onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate: IPropertyTemplate) {
    // set ConfirmationDialogBox Props
    setConfirmationDialogBox({
      heading: intl.formatMessage({
        id: 'CardDetailProperty.confirm-delete-heading',
        defaultMessage: 'Confirm Delete Property'
      }),
      subText: intl.formatMessage(
        {
          id: 'CardDetailProperty.confirm-delete-subtext',
          defaultMessage:
            'Are you sure you want to delete the property "{propertyName}"? Deleting it will delete the property from all cards in this board.'
        },
        { propertyName: propertyTemplate.name }
      ),
      confirmButtonText: intl.formatMessage({
        id: 'CardDetailProperty.delete-action-button',
        defaultMessage: 'Delete'
      }),
      onConfirm: async () => {
        const deletingPropName = propertyTemplate.name;
        setShowConfirmationDialog(false);
        try {
          await mutator.deleteProperty(board, views, cards, propertyTemplate.id);
          showMessage(
            intl.formatMessage(
              { id: 'CardDetailProperty.property-deleted', defaultMessage: 'Deleted {propertyName} Successfully!' },
              { propertyName: deletingPropName }
            ),
            'success'
          );
        } catch (err: any) {
          Utils.logError(
            `Error Deleting Property!: Could Not delete Property -" + ${deletingPropName} ${err?.toString()}`
          );
        }
      },

      onClose: () => setShowConfirmationDialog(false)
    });

    // open confirmation dialog property delete
    setShowConfirmationDialog(true);
  }

  function getDeleteDisabled(template: IPropertyTemplate) {
    if (
      views.some((view) => view.fields.viewType === 'calendar' && view.fields.dateDisplayPropertyId === template.id)
    ) {
      return 'Date property is used in calendar view';
    }
  }

  return (
    <div className='octo-propertylist'>
      {board.fields.cardProperties.map((propertyTemplate) => {
        return (
          <CardDetailProperty
            onDrop={onDrop}
            key={propertyTemplate.id}
            board={board}
            card={card}
            deleteDisabledMessage={getDeleteDisabled(propertyTemplate)}
            onDelete={() => onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate)}
            onTypeAndNameChanged={(newType: PropertyType, newName: string) => {
              onPropertyChangeSetAndOpenConfirmationDialog(newType, newName, propertyTemplate);
            }}
            pageUpdatedAt={pageUpdatedAt}
            pageUpdatedBy={pageUpdatedBy}
            property={propertyTemplate}
            readOnly={props.readOnly}
          />
        );
      })}

      {showConfirmationDialog && (
        <ConfirmDeleteModal
          title={confirmationDialogBox.heading}
          onClose={confirmationDialogBox.onClose}
          open
          buttonText={confirmationDialogBox.confirmButtonText}
          question={confirmationDialogBox.subText}
          onConfirm={confirmationDialogBox.onConfirm}
        />
      )}

      {!props.readOnly && activeView && (
        <div className='octo-propertyname add-property'>
          <Button {...bindTrigger(addPropertyPopupState)}>
            <FormattedMessage id='CardDetail.add-property' defaultMessage='+ Add a property' />
          </Button>

          <Menu
            {...bindMenu(addPropertyPopupState)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'left'
            }}
          >
            <PropertyTypes
              onClick={async (type) => {
                const template: IPropertyTemplate = {
                  id: Utils.createGuid(IDType.BlockID),
                  name: typeDisplayName(intl, type),
                  type,
                  options: []
                };
                const templateId = await mutator.insertPropertyTemplate(board, activeView, -1, template);
                setNewTemplateId(templateId);
                addPropertyPopupState.close();
              }}
            />
          </Menu>
        </div>
      )}
    </div>
  );
}

export default React.memo(CardDetailProperties);
