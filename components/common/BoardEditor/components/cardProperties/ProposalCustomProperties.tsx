import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, Menu, Stack } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CardDetailProperty } from 'components/common/BoardEditor/components/cardProperties/CardDetailProperty';
import Calculations from 'components/common/BoardEditor/focalboard/src/components/calculations/calculations';
import { IDType, Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { typeDisplayName } from 'components/common/BoardEditor/focalboard/src/widgets/propertyMenu';
import { PropertyTypes } from 'components/common/BoardEditor/focalboard/src/widgets/propertyTypes';
import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { isTruthy } from 'lib/utilities/types';

type Props = {
  syncWithPageId?: string | null;
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

function CardDetailProperties(props: Props) {
  const { proposalPropertiesBlock, createProperty, updateProperty, deleteProperty, updateBlock } = useProposalBlocks();
  const fields = proposalPropertiesBlock?.fields;
  const properties = fields?.properties || [];

  const { card, cards, views, activeView, pageUpdatedAt, pageUpdatedBy, syncWithPageId } = props;
  const [newTemplateId, setNewTemplateId] = useState('');
  const intl = useIntl();
  const addPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'add-property' });

  const { showMessage } = useSnackbar();
  const theme = useTheme();
  const isSmallScreen = useSmallScreen();

  useEffect(() => {
    const newProperty = fields?.properties.find((property) => property.id === newTemplateId);
    if (newProperty) {
      setNewTemplateId('');
    }
  }, [newTemplateId, fields?.properties]);

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

  const createNewProperty = useCallback(
    async (type: PropertyType) => {
      const template: IPropertyTemplate = {
        id: Utils.createGuid(IDType.BlockID),
        name: typeDisplayName(intl, type),
        type,
        options: []
      };

      const templateId = await createProperty(template);

      if (templateId) {
        setNewTemplateId(templateId);
        addPropertyPopupState.close();
      }
    },
    [addPropertyPopupState, createProperty, intl]
  );

  const onDrop = async (sourceProperty: IPropertyTemplate, destinationProperty: IPropertyTemplate) => {
    const arr = [...properties.map((property) => property.id)];
    const destIndex = arr.indexOf(destinationProperty.id);
    const srcIndex = arr.indexOf(sourceProperty.id);
    // reorder the properties
    [arr[srcIndex], arr[destIndex]] = [arr[destIndex], arr[srcIndex]];

    const udpdatedProperties = arr
      .map((cardPropertyId) => properties.find((cardProperty) => cardProperty.id === cardPropertyId))
      .filter(isTruthy);

    if (proposalPropertiesBlock) {
      const oldFields = proposalPropertiesBlock.fields || {};

      await updateBlock({
        ...proposalPropertiesBlock,
        fields: { ...oldFields, properties: udpdatedProperties }
      });
    }
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
      updateProperty({ ...propertyTemplate, type: newType, name: newName });

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
          await updateProperty({ ...propertyTemplate, type: newType, name: newName });
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
          await deleteProperty(propertyTemplate.id);

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

  const propertyTypes = useMemo(
    () => activeView && <PropertyTypes isMobile={isSmallScreen} onClick={createNewProperty} />,
    [activeView, isSmallScreen, createNewProperty]
  );

  return (
    <div className='octo-propertylist'>
      {properties.map((propertyTemplate) => {
        return (
          <CardDetailProperty
            syncWithPageId={syncWithPageId}
            onDrop={onDrop}
            key={propertyTemplate.id}
            board={{} as any} // TODO - fix
            card={card}
            deleteDisabledMessage={getDeleteDisabled(propertyTemplate as IPropertyTemplate)}
            onDelete={() => onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate as IPropertyTemplate)}
            onTypeAndNameChanged={(newType: PropertyType, newName: string) => {
              onPropertyChangeSetAndOpenConfirmationDialog(newType, newName, propertyTemplate as IPropertyTemplate);
            }}
            pageUpdatedAt={pageUpdatedAt}
            pageUpdatedBy={pageUpdatedBy}
            property={propertyTemplate as IPropertyTemplate}
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
        <>
          <div className='octo-propertyname add-property'>
            <Button {...bindTrigger(addPropertyPopupState)}>
              <FormattedMessage id='CardDetail.add-property' defaultMessage='+ Add a property' />
            </Button>
            {!isSmallScreen && (
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
                {propertyTypes}
              </Menu>
            )}
          </div>
          {isSmallScreen && (
            <MobileDialog
              title={intl.formatMessage({ id: 'PropertyMenu.selectType', defaultMessage: 'Select property type' })}
              open={addPropertyPopupState.isOpen}
              onClose={addPropertyPopupState.close}
              PaperProps={{ sx: { background: theme.palette.background.light } }}
              contentSx={{ pr: 0, pb: 0, pl: 1 }}
            >
              <Box display='flex' gap={1} flexDirection='column' flex={1} height='100%'>
                {propertyTypes}
              </Box>
            </MobileDialog>
          )}
        </>
      )}
    </div>
  );
}

export const ProposalCustomProperties = React.memo(CardDetailProperties);
