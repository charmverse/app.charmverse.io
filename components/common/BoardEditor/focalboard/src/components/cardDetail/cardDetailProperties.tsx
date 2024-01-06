import { useTheme } from '@emotion/react';
import { Box, Menu } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CardDetailProperty } from 'components/common/BoardEditor/components/cardProperties/CardDetailProperty';
import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';
import { proposalPropertyTypesList, type Board, type IPropertyTemplate, type PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import { defaultRewardPropertyIds } from 'lib/rewards/blocks/constants';
import { isTruthy } from 'lib/utilities/types';

import type { Mutator } from '../../mutator';
import defaultMutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import Button from '../../widgets/buttons/button';
import { PropertyTypes } from '../../widgets/propertyTypes';
import { typeDisplayName } from '../../widgets/typeDisplayName';
import Calculations from '../calculations/calculations';

type Props = {
  board: Board;
  syncWithPageId?: string | null;
  card: Card<any>;
  cards: Card<any>[];
  activeView?: BoardView;
  views: BoardView[];
  readOnly: boolean;
  pageUpdatedBy: string;
  pageUpdatedAt: string;
  mutator?: Mutator;
  readOnlyProperties?: string[];
  disableEditPropertyOption?: boolean;
};

function CardDetailProperties(props: Props) {
  const {
    board,
    card,
    cards,
    views,
    activeView,
    pageUpdatedAt,
    pageUpdatedBy,
    syncWithPageId,
    mutator = defaultMutator,
    disableEditPropertyOption
  } = props;
  const [newTemplateId, setNewTemplateId] = useState('');
  const intl = useIntl();
  const addPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'add-property' });

  const { showMessage } = useSnackbar();
  const theme = useTheme();
  const isSmallScreen = useSmallScreen();

  useEffect(() => {
    const newProperty = board.fields?.cardProperties.find((property) => property.id === newTemplateId);
    if (newProperty) {
      setNewTemplateId('');
    }
  }, [newTemplateId, board.fields?.cardProperties]);

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

    const updatedProperties = cardPropertyIds
      .map((cardPropertyId) => board.fields.cardProperties.find((cardProperty) => cardProperty.id === cardPropertyId))
      .filter(isTruthy);

    await mutator.reorderProperties(board.id, updatedProperties);
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
      mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName, views);
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
          await mutator.changePropertyTypeAndName(board, cards, propertyTemplate, newType, newName, views);
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

  const propertyTypes = useMemo(
    () =>
      activeView && (
        <PropertyTypes
          isMobile={isSmallScreen}
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
      ),
    [mutator, board, activeView, isSmallScreen]
  );

  return (
    <div className='octo-propertylist' data-test='card-detail-properties'>
      {board.fields?.cardProperties.map((propertyTemplate) => {
        const readOnly = props.readOnly || props.readOnlyProperties?.includes(propertyTemplate.id) || false;
        const isReadonlyTemplateProperty =
          readOnly ||
          proposalPropertyTypesList.includes(propertyTemplate.type as any) ||
          defaultRewardPropertyIds.includes(propertyTemplate.id) ||
          !!(board.fields?.cardProperties ?? []).find((cardProperty) => cardProperty.id === propertyTemplate.id)
            ?.formFieldId;

        if (propertyTemplate.id === Constants.titleColumnId) {
          return null;
        }

        return (
          <CardDetailProperty
            syncWithPageId={syncWithPageId}
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
            readOnly={isReadonlyTemplateProperty}
            mutator={mutator}
            disableEditPropertyOption={disableEditPropertyOption}
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

      {!props.readOnly && !disableEditPropertyOption && activeView && (
        <>
          <div className='octo-propertyname add-property'>
            <Button {...bindTrigger(addPropertyPopupState)} data-dataTest='add-custom-property'>
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

export default React.memo(CardDetailProperties);
