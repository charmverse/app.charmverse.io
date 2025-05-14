/* eslint-disable max-lines */
import { Box, Menu, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from '@packages/databases/board';
import { proposalPropertyTypesList } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import type { BlockChange } from '@packages/databases/mutator';
import mutator from '@packages/databases/mutator';
import { Utils } from '@packages/databases/utils';
import { isTruthy } from '@packages/utils/types';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useCallback, useState } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';

import { typeDisplayName } from '../../widgets/typeDisplayName';
import { dragAndDropRearrange } from '../cardDetail/cardDetailContentsUtility';

import KanbanColumnHeader from './kanbanColumnHeader';
import { KanbanGroupColumn } from './KanbanGroupColumn';
import KanbanHiddenColumnItem from './kanbanHiddenColumnItem';

type Position = 'left' | 'right' | 'above' | 'below' | 'aboveRow' | 'belowRow';
interface NewGroupTextFieldProps {
  onClick: (groupName: string) => void;
}

function NewGroupTextField(props: NewGroupTextFieldProps) {
  const { onClick } = props;
  const [groupName, setGroupName] = useState('');
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        px: 1
      }}
    >
      <TextField
        placeholder='New group'
        sx={{
          '& .MuiOutlinedInput-input': {
            padding: 1
          }
        }}
        value={groupName}
        onChange={(e) => {
          setGroupName(e.target.value);
        }}
      />
      <Button onClick={() => onClick(groupName)}>Done</Button>
    </Box>
  );
}

type Props = {
  board: Board;
  activeView: BoardView;
  cards: Card[];
  groupByProperty?: IPropertyTemplate;
  visibleGroups: BoardGroup[];
  hiddenGroups: BoardGroup[];
  selectedCardIds: string[];
  intl: IntlShape;
  readOnly: boolean;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  addCard: (groupByOptionId?: string, show?: boolean, props?: any, insertLast?: boolean) => Promise<void> | void;
  showCard: (cardId: string | null) => void;
  disableAddingCards?: boolean;
  readOnlyTitle?: boolean;
  disableDnd?: boolean;
  hideLinkedBounty?: boolean;
  isApplication?: boolean;
};

function Kanban(props: Props) {
  const { board, activeView, cards, groupByProperty, visibleGroups, hiddenGroups, selectedCardIds } = props;
  const popupState = usePopupState({ variant: 'popper', popupId: 'new-group' });
  const propertyValues = groupByProperty?.options || [];
  Utils.log(`${propertyValues.length} propertyValues`);
  const visiblePropertyTemplates = activeView.fields.visiblePropertyIds
    .map((id) => board.fields.cardProperties.find((t) => t.id === id))
    .filter((i) => isTruthy(i) && i.id !== Constants.titleColumnId) as IPropertyTemplate[];
  const { showConfirmation } = useConfirmationModal();
  const localViewSettings = useLocalDbViewSettings(activeView.id);

  const propertyNameChanged = useCallback(
    async (option: IPropertyOption, text: string): Promise<void> => {
      if (groupByProperty) {
        await mutator.changePropertyOptionValue(board, groupByProperty, option, text);
      }
    },
    [board, groupByProperty]
  );

  const addGroupClicked = useCallback(
    async (groupName: string) => {
      Utils.log('onAddGroupClicked');

      const option: IPropertyOption = {
        id: Utils.createGuid(),
        value: groupName,
        color: 'propColorDefault'
      };

      await mutator.insertPropertyOption(board, groupByProperty!, option, 'add group');
    },
    [board, groupByProperty]
  );

  const orderAfterMoveToColumn = useCallback(
    (cardIds: string[], columnId?: string): string[] => {
      let cardOrder = activeView.fields.cardOrder.slice();
      const columnGroup = visibleGroups.find((g) => g.id === columnId);
      const columnCards = columnGroup?.cards;
      if (!columnCards || columnCards.length === 0) {
        return cardOrder;
      }
      const lastCardId = columnCards[columnCards.length - 1].id;
      const setOfIds = new Set(cardIds);
      cardOrder = cardOrder.filter((id) => !setOfIds.has(id));
      const lastCardIndex = cardOrder.indexOf(lastCardId);
      cardOrder.splice(lastCardIndex + 1, 0, ...cardIds);
      return cardOrder;
    },
    [activeView, visibleGroups]
  );

  const onDropToColumn = useCallback(
    async (option: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => {
      const optionId = option ? option.id : undefined;

      let draggedCardIds = selectedCardIds;
      if (card) {
        draggedCardIds = Array.from(new Set(selectedCardIds).add(card.id));
      }

      if (draggedCardIds.length > 0) {
        await mutator.performAsUndoGroup(async () => {
          const cardsById: { [key: string]: Card } = cards.reduce(
            (acc: { [key: string]: Card }, c: Card): { [key: string]: Card } => {
              acc[c.id] = c;
              return acc;
            },
            {}
          );
          const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o]).filter((c) => c);
          const description = draggedCards.length > 1 ? `drag ${draggedCards.length} cards` : 'drag card';
          const awaits = [];
          for (const draggedCard of draggedCards) {
            Utils.log(`ondrop. Card: ${draggedCard.title}, column: ${optionId}`);
            const oldValue = draggedCard.fields.properties[groupByProperty!.id];
            if (optionId !== oldValue) {
              awaits.push(mutator.changePropertyValue(draggedCard, groupByProperty!.id, optionId, description));
            }
          }
          const newOrder = orderAfterMoveToColumn(draggedCardIds, optionId);
          awaits.push(mutator.changeViewCardOrder(activeView, newOrder, description));
          await Promise.all(awaits);
        });
      } else if (dstOption) {
        Utils.log(`ondrop. Header option: ${dstOption.value}, column: ${option?.value}`);

        const visibleOptionIds = visibleGroups.map((o) => o.id);
        const srcBlockX = visibleOptionIds.indexOf(option.id);
        const dstBlockX = visibleOptionIds.indexOf(dstOption.id);

        // Here aboveRow means to the left while belowRow means to the right
        const moveTo = (srcBlockX > dstBlockX ? 'aboveRow' : 'belowRow') as Position;

        const visibleOptionIdsRearranged = dragAndDropRearrange({
          contentOrder: visibleOptionIds,
          srcBlockX,
          srcBlockY: -1,
          dstBlockX,
          dstBlockY: -1,
          srcBlockId: option.id,
          dstBlockId: dstOption.id,
          moveTo
        }) as string[];

        await mutator.changeViewVisibleOptionIds(
          activeView.id,
          activeView.fields.visibleOptionIds,
          visibleOptionIdsRearranged
        );
      }
    },
    [cards, visibleGroups, activeView, groupByProperty, selectedCardIds]
  );

  const onDropToCard = useCallback(
    async (srcCard: Card, dstCard: Card) => {
      if (
        srcCard.id === dstCard.id ||
        (groupByProperty && proposalPropertyTypesList.includes(groupByProperty.type as any))
      ) {
        return;
      }
      const hasSort = activeView.fields.sortOptions?.length !== 0;

      if (hasSort) {
        const { confirmed, cancelled } = await showConfirmation({
          message: 'Would you like to remove sorting?'
        });

        if (confirmed && localViewSettings) {
          localViewSettings.setLocalSort(null);
          await mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, []);
        } else if (cancelled) {
          return;
        }
      }

      Utils.log(`onDropToCard: ${dstCard.title}`);
      const optionId = groupByProperty ? dstCard.fields.properties[groupByProperty.id] : null;

      const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id));

      const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card';

      // Update dstCard order
      const cardsById: { [key: string]: Card } = cards.reduce(
        (acc: { [key: string]: Card }, card: Card): { [key: string]: Card } => {
          acc[card.id] = card;
          return acc;
        },
        {}
      );
      const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o]).filter((c) => c);
      let cardOrder = cards.map((o) => o.id);
      const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCard.id);
      cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id));
      let destIndex = cardOrder.indexOf(dstCard.id);
      if (
        (!groupByProperty || (groupByProperty && srcCard.fields.properties[groupByProperty!.id] === optionId)) &&
        isDraggingDown
      ) {
        // If the cards are in the same column and dragging down, drop after the target dstCard
        destIndex += 1;
      }
      cardOrder.splice(destIndex, 0, ...draggedCardIds);

      const blockUpdates: BlockChange[] = [
        mutator.changeViewCardOrder(
          hasSort
            ? {
                ...activeView,
                fields: {
                  ...activeView.fields,
                  sortOptions: []
                }
              }
            : activeView,
          cardOrder,
          description,
          false
        ) as BlockChange
      ];

      await mutator.performAsUndoGroup(async () => {
        // Update properties of dragged cards
        if (optionId && groupByProperty) {
          for (const draggedCard of draggedCards) {
            Utils.log(`draggedCard: ${draggedCard.title}, column: ${optionId}`);
            const oldOptionId = draggedCard.fields.properties[groupByProperty!.id];
            if (optionId !== oldOptionId) {
              blockUpdates.push(
                mutator.changePropertyValue(
                  draggedCard,
                  groupByProperty!.id,
                  optionId,
                  description,
                  false
                ) as BlockChange
              );
            }
          }
        }
        await mutator.updateBlocks(
          blockUpdates.map((b) => b.newBlock),
          blockUpdates.map((b) => b.block),
          description
        );
      });
    },
    [cards, activeView, groupByProperty, selectedCardIds]
  );

  const [showCalculationsMenu, setShowCalculationsMenu] = useState<Map<string, boolean>>(new Map<string, boolean>());

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const toggleOptions = (templateId: string, _anchorEl?: HTMLElement) => {
    const newShowOptions = new Map<string, boolean>(showCalculationsMenu);
    newShowOptions.set(templateId, !!_anchorEl);
    setShowCalculationsMenu(newShowOptions);
    setAnchorEl(_anchorEl || null);
  };

  const createNewSelectProperty = async () => {
    const template: IPropertyTemplate = {
      id: Utils.createGuid(),
      name: typeDisplayName(props.intl, 'select'),
      type: 'select',
      options: []
    };
    await mutator.insertPropertyTemplate(board, activeView, -1, template);
  };

  const { onClick, ...restBindings } = bindTrigger(popupState);
  const addNewGroupHandler = async (event: React.MouseEvent<Element, MouseEvent>) => {
    onClick(event);
    // If no groupByProperty means that we don't have a select property and the board can't be grouped in columns.
    if (!groupByProperty) {
      await createNewSelectProperty();
    }
  };
  const menuTriggerProps = !props.readOnly ? { ...restBindings, onClick: addNewGroupHandler } : {};

  return (
    <Box className='Kanban'>
      <div className='octo-board-header' id='mainBoardHeader'>
        {/* Column headers */}

        {visibleGroups.map((group) => (
          <KanbanColumnHeader
            key={group.id}
            group={group}
            board={board}
            activeView={activeView}
            intl={props.intl}
            groupByProperty={groupByProperty}
            addCard={props.addCard}
            readOnly={props.readOnly}
            propertyNameChanged={propertyNameChanged}
            onDropToColumn={onDropToColumn}
            calculationMenuOpen={showCalculationsMenu.get(group.id) || false}
            onCalculationMenuOpen={(_anchorEl) => toggleOptions(group.id, _anchorEl)}
            onCalculationMenuClose={() => toggleOptions(group.id)}
            anchorEl={anchorEl}
            readOnlyTitle={props.readOnlyTitle}
            disableAddingCards={props.disableAddingCards}
          />
        ))}

        {!props.readOnly && !props.disableAddingCards ? (
          <>
            <div className='octo-board-header-cell narrow' {...menuTriggerProps}>
              <Button size='small' variant='text' color='secondary'>
                <FormattedMessage id='BoardComponent.add-a-group' defaultMessage='+ Add a group' />
              </Button>
            </div>
            <Menu {...bindMenu(popupState)}>
              <NewGroupTextField
                onClick={(groupName) => {
                  addGroupClicked(groupName);
                  popupState.close();
                }}
              />
            </Menu>
          </>
        ) : (
          // Empty column to ensure hidden columns are aligned to the right
          <div className='octo-board-header-cell narrow'></div>
        )}
        {/* Hidden column header */}

        {hiddenGroups.length > 0 && (
          <div className='octo-board-header-cell narrow'>
            <FormattedMessage id='BoardComponent.hidden-columns' defaultMessage='Hidden columns' />
          </div>
        )}
      </div>

      {/* Main content */}

      <Box>
        <div className='octo-board-body' id='mainBoardBody'>
          {/* Columns */}
          {visibleGroups.map((group) => (
            <KanbanGroupColumn
              group={group}
              board={board}
              isApplication={props.isApplication}
              visiblePropertyTemplates={visiblePropertyTemplates}
              key={group.id || 'empty'}
              readOnly={props.readOnly}
              onDropToCard={props.disableDnd ? undefined : onDropToCard}
              selectedCardIds={props.selectedCardIds}
              addCard={props.addCard}
              onDropToColumn={onDropToColumn}
              onCardClicked={props.onCardClicked}
              showCard={props.showCard}
              disableAddingCards={props.disableAddingCards}
              hideLinkedBounty={props.hideLinkedBounty}
            />
          ))}

          {/* Add whitespace underneath "Add a group" button */}

          {!props.readOnly && <div className='octo-board-header-cell narrow'></div>}

          {/* Hidden columns */}

          {hiddenGroups.length > 0 && (
            <div className='octo-board-column narrow'>
              {hiddenGroups.map((group) => (
                <KanbanHiddenColumnItem
                  key={group.id}
                  group={group}
                  activeView={activeView}
                  intl={props.intl}
                  readOnly={props.readOnly}
                  onDrop={(card: Card) => onDropToColumn(group.option!, card)}
                />
              ))}
            </div>
          )}
        </div>
      </Box>
    </Box>
  );
}

export default injectIntl(Kanban);
