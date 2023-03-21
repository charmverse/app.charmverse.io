import { Stack } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import type { Board, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import Button from '../../widgets/buttons/button';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';
import PropertyMenu, { PropertyTypes, typeDisplayName } from '../../widgets/propertyMenu';
import Calculations from '../calculations/calculations';
import type { ConfirmationDialogBoxProps } from '../confirmationDialogBox';
import ConfirmationDialogBox from '../confirmationDialogBox';
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

function CardDetailProperty({
  readOnly,
  property,
  onTypeAndNameChanged,
  board,
  card,
  onDelete,
  isOpen,
  pageUpdatedBy,
  pageUpdatedAt,
  deleteDisabledMessage,
  onDrop
}: {
  isOpen: boolean;
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

  return (
    <Stack
      ref={columnRef}
      sx={{
        minWidth: 250,
        overflow: 'unset',
        opacity: isDragging ? 0.5 : 1,
        transition: `background-color 150ms ease-in-out`,
        backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial',
        flexDirection: 'row'
      }}
      className='octo-propertyrow'
    >
      {readOnly && (
        <div className='octo-propertyname octo-propertyname--readonly'>
          <Button>{property.name}</Button>
        </div>
      )}
      {!readOnly && (
        <MenuWrapper isOpen={isOpen}>
          <div className='octo-propertyname'>
            <Button>{property.name}</Button>
          </div>
          <PropertyMenu
            deleteDisabled={deleteDisabledMessage}
            propertyId={property.id}
            propertyName={property.name}
            propertyType={property.type}
            onTypeAndNameChanged={onTypeAndNameChanged}
            onDelete={onDelete}
          />
        </MenuWrapper>
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
  const { showMessage } = useSnackbar();
  useEffect(() => {
    const newProperty = board.fields.cardProperties.find((property) => property.id === newTemplateId);
    if (newProperty) {
      setNewTemplateId('');
    }
  }, [newTemplateId, board.fields.cardProperties]);

  const [confirmationDialogBox, setConfirmationDialogBox] = useState<ConfirmationDialogBoxProps>({
    heading: '',
    onConfirm: () => {},
    onClose: () => {}
  });
  const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false);

  const onDrop = async (sourceProperty: IPropertyTemplate, destinationProperty: IPropertyTemplate) => {
    const visibleCardPropertyIds = [...board.fields.visibleCardPropertyIds];
    const destIndex = visibleCardPropertyIds.indexOf(destinationProperty.id);
    const srcIndex = visibleCardPropertyIds.indexOf(sourceProperty.id);
    visibleCardPropertyIds.splice(srcIndex, 1);
    visibleCardPropertyIds.splice(destIndex, 0, sourceProperty.id);
    await charmClient.patchBlock(board.id, { updatedFields: { visibleCardPropertyIds } }, () => {});
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
      {board.fields.visibleCardPropertyIds.map((cardPropertyId) => {
        const propertyTemplate = board.fields.cardProperties.find((cardProperty) => cardProperty.id === cardPropertyId);
        if (!propertyTemplate) {
          return null;
        }
        return (
          <CardDetailProperty
            onDrop={onDrop}
            key={propertyTemplate.id}
            board={board}
            card={card}
            deleteDisabledMessage={getDeleteDisabled(propertyTemplate)}
            isOpen={propertyTemplate.id === newTemplateId}
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

      {showConfirmationDialog && <ConfirmationDialogBox dialogBox={confirmationDialogBox} />}

      {!props.readOnly && activeView && (
        <div className='octo-propertyname add-property'>
          <MenuWrapper>
            <Button>
              <FormattedMessage id='CardDetail.add-property' defaultMessage='+ Add a property' />
            </Button>
            <Menu position='bottom-start' disablePortal={false}>
              <PropertyTypes
                label={intl.formatMessage({ id: 'PropertyMenu.selectType', defaultMessage: 'Select property type' })}
                onTypeSelected={async (type) => {
                  const template: IPropertyTemplate = {
                    id: Utils.createGuid(IDType.BlockID),
                    name: typeDisplayName(intl, type),
                    type,
                    options: []
                  };
                  const templateId = await mutator.insertPropertyTemplate(board, activeView, -1, template);
                  setNewTemplateId(templateId);
                }}
              />
            </Menu>
          </MenuWrapper>
        </div>
      )}
    </div>
  );
}

export default React.memo(CardDetailProperties);
