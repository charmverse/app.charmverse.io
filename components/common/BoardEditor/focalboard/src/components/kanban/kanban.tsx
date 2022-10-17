/* eslint-disable max-lines */
// import Button from '../../widgets/buttons/button'
import { Menu, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { Box } from '@mui/system';
import { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React, { useCallback, useState } from 'react';
import withScrolling, { createHorizontalStrength, createVerticalStrength } from 'react-dnd-scrolling';
import { FormattedMessage, injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import { isTouchScreen } from 'lib/utilities/browser';

import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from '../../blocks/board';
import type { BoardView } from '../../blocks/boardView';
import type { Card } from '../../blocks/card';
import { Constants } from '../../constants';
import type { BlockChange } from '../../mutator';
import mutator from '../../mutator';
import { IDType, Utils } from '../../utils';
import { dragAndDropRearrange } from '../cardDetail/cardDetailContentsUtility';

import KanbanCard from './kanbanCard';
import KanbanColumn from './kanbanColumn';
import KanbanColumnHeader from './kanbanColumnHeader';
import KanbanHiddenColumnItem from './kanbanHiddenColumnItem';

type Position = 'left' | 'right' | 'above' | 'below' | 'aboveRow' | 'belowRow'
interface NewGroupTextFieldProps {
  onClick: (groupName: string) => void;
}

function NewGroupTextField (props: NewGroupTextFieldProps) {
  const { onClick } = props;
  const [groupName, setGroupName] = useState('');
  return (
    <Box sx={{
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
      <Button onClick={() => onClick(groupName)}>
        Done
      </Button>
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
  addCard: (groupByOptionId?: string, show?: boolean, props?: any, insertLast?: boolean) => Promise<void>;
  showCard: (cardId: string | null) => void;
}

function Kanban (props: Props) {
  const { board, activeView, cards, groupByProperty, visibleGroups, hiddenGroups } = props;
  const popupState = usePopupState({ variant: 'popper', popupId: 'new-group' });
  const propertyValues = groupByProperty?.options || [];
  Utils.log(`${propertyValues.length} propertyValues`);

  const visiblePropertyTemplates = activeView.fields.visiblePropertyIds.map(
    (id) => board.fields.cardProperties.find((t) => t.id === id)
  ).filter((i) => i) as IPropertyTemplate[];
  const isManualSort = activeView.fields.sortOptions.length === 0;
  const visibleBadges = activeView.fields.visiblePropertyIds.includes(Constants.badgesColumnId);

  const propertyNameChanged = useCallback(async (option: IPropertyOption, text: string): Promise<void> => {
    if (groupByProperty) {
      await mutator.changePropertyOptionValue(board, groupByProperty, option, text);
    }
  }, [board, groupByProperty]);

  const addGroupClicked = useCallback(async (groupName: string) => {
    Utils.log('onAddGroupClicked');

    const option: IPropertyOption = {
      id: Utils.createGuid(IDType.BlockID),
      value: groupName,
      color: 'propColorDefault'
    };

    await mutator.insertPropertyOption(board, groupByProperty!, option, 'add group');
  }, [board, groupByProperty]);

  const orderAfterMoveToColumn = useCallback((cardIds: string[], columnId?: string): string[] => {
    let cardOrder = activeView.fields.cardOrder.slice();
    const columnGroup = visibleGroups.find((g) => g.option.id === columnId);
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
  }, [activeView, visibleGroups]);

  const onDropToColumn = useCallback(async (option: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => {
    const { selectedCardIds } = props;
    const optionId = option ? option.id : undefined;

    let draggedCardIds = selectedCardIds;
    if (card) {
      draggedCardIds = Array.from(new Set(selectedCardIds).add(card.id));
    }

    if (draggedCardIds.length > 0) {
      await mutator.performAsUndoGroup(async () => {
        const cardsById: { [key: string]: Card } = cards.reduce((acc: { [key: string]: Card }, c: Card): { [key: string]: Card } => {
          acc[c.id] = c;
          return acc;
        }, {});
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
    }
    else if (dstOption) {
      Utils.log(`ondrop. Header option: ${dstOption.value}, column: ${option?.value}`);

      const visibleOptionIds = visibleGroups.map((o) => o.option.id);
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

      await mutator.changeViewVisibleOptionIds(activeView.id, activeView.fields.visibleOptionIds, visibleOptionIdsRearranged);
    }
  }, [cards, visibleGroups, activeView, groupByProperty, props.selectedCardIds]);

  const onDropToCard = useCallback(async (srcCard: Card, dstCard: Card) => {
    if (srcCard.id === dstCard.id || !groupByProperty) {
      return;
    }
    Utils.log(`onDropToCard: ${dstCard.title}`);
    const { selectedCardIds } = props;
    const optionId = dstCard.fields.properties[groupByProperty.id];

    const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id));

    const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card';

    // Update dstCard order
    const cardsById: { [key: string]: Card } = cards.reduce((acc: { [key: string]: Card }, card: Card): { [key: string]: Card } => {
      acc[card.id] = card;
      return acc;
    }, {});
    const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o]).filter((c) => c);
    let cardOrder = cards.map((o) => o.id);
    const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCard.id);
    cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id));
    let destIndex = cardOrder.indexOf(dstCard.id);
    if (srcCard.fields.properties[groupByProperty!.id] === optionId && isDraggingDown) {
      // If the cards are in the same column and dragging down, drop after the target dstCard
      destIndex += 1;
    }
    cardOrder.splice(destIndex, 0, ...draggedCardIds);

    await mutator.performAsUndoGroup(async () => {
      // Update properties of dragged cards
      const blockUpdates: BlockChange[] = [];
      for (const draggedCard of draggedCards) {
        Utils.log(`draggedCard: ${draggedCard.title}, column: ${optionId}`);
        const oldOptionId = draggedCard.fields.properties[groupByProperty!.id];
        if (optionId !== oldOptionId) {
          blockUpdates.push(mutator.changePropertyValue(draggedCard, groupByProperty!.id, optionId, description, false) as BlockChange);
        }
      }
      blockUpdates.push(mutator.changeViewCardOrder(activeView, cardOrder, description, false) as BlockChange);
      await mutator.updateBlocks(blockUpdates.map(b => b.newBlock), blockUpdates.map(b => b.block), description);
    });
  }, [cards, activeView, groupByProperty, props.selectedCardIds]);

  const [showCalculationsMenu, setShowCalculationsMenu] = useState<Map<string, boolean>>(new Map<string, boolean>());
  const toggleOptions = (templateId: string, show: boolean) => {
    const newShowOptions = new Map<string, boolean>(showCalculationsMenu);
    newShowOptions.set(templateId, show);
    setShowCalculationsMenu(newShowOptions);
  };

  const ScrollingComponent = withScrolling('div');
  const hStrength = createHorizontalStrength(isTouchScreen() ? 60 : 250);
  const vStrength = createVerticalStrength(isTouchScreen() ? 60 : 250);

  const menuTriggerProps = !props.readOnly ? bindTrigger(popupState) : {};
  return (
    <Box
      className='Kanban'
    >
      <div
        className='octo-board-header'
        id='mainBoardHeader'
      >
        {/* Column headers */}

        {visibleGroups.map((group) => (
          <KanbanColumnHeader
            key={group.option.id}
            group={group}
            board={board}
            activeView={activeView}
            intl={props.intl}
            groupByProperty={groupByProperty}
            addCard={props.addCard}
            readOnly={props.readOnly}
            propertyNameChanged={propertyNameChanged}
            onDropToColumn={onDropToColumn}
            calculationMenuOpen={showCalculationsMenu.get(group.option.id) || false}
            onCalculationMenuOpen={() => toggleOptions(group.option.id, true)}
            onCalculationMenuClose={() => toggleOptions(group.option.id, false)}
          />
        ))}

        {groupByProperty && (
          <div className='octo-board-header-cell narrow' {...menuTriggerProps}>
            <Button
              size='small'
              variant='text'
              color='secondary'
            >
              <FormattedMessage
                id='BoardComponent.add-a-group'
                defaultMessage='+ Add a group'
              />
            </Button>
          </div>
        )}

        <Menu
          {...bindMenu(popupState)}
        >
          <NewGroupTextField onClick={(groupName) => {
            addGroupClicked(groupName);
            popupState.close();
          }}
          />
        </Menu>

        {/* Hidden column header */}

        {hiddenGroups.length > 0
          && (
            <div className='octo-board-header-cell narrow'>
              <FormattedMessage
                id='BoardComponent.hidden-columns'
                defaultMessage='Hidden columns'
              />
            </div>
          )}
      </div>

      {/* Main content */}

      <ScrollingComponent
        horizontalStrength={hStrength}
        verticalStrength={vStrength}
      >
        <div
          className='octo-board-body'
          id='mainBoardBody'
        >
          {/* Columns */}

          {visibleGroups.map((group) => (
            <KanbanColumn
              key={group.option.id || 'empty'}
              onDrop={(card: Card) => onDropToColumn(group.option, card)}
            >
              {group.cards.map((card) => (
                <KanbanCard
                  card={card}
                  board={board}
                  visiblePropertyTemplates={visiblePropertyTemplates}
                  key={card.id}
                  readOnly={props.readOnly}
                  isSelected={props.selectedCardIds.includes(card.id)}
                  onClick={(e) => {
                    props.onCardClicked(e, card);
                  }}
                  onDrop={onDropToCard}
                  showCard={props.showCard}
                  isManualSort={isManualSort}
                />
              ))}
              {!props.readOnly
                && (
                  <Button
                    size='small'
                    variant='text'
                    color='secondary'
                    sx={{ justifyContent: 'flex-start' }}
                    onClick={() => {
                      props.addCard(group.option.id, true, {}, true);
                    }}
                  >
                    <FormattedMessage
                      id='BoardComponent.new'
                      defaultMessage='+ New'
                    />
                  </Button>
                )}
            </KanbanColumn>
          ))}

          {/* Add whitespace underneath "Add a group" button */}

          {!props.readOnly
            && (
              <div className='octo-board-header-cell narrow'>
              </div>
            )}

          {/* Hidden columns */}

          {hiddenGroups.length > 0
            && (
              <div className='octo-board-column narrow'>
                {hiddenGroups.map((group) => (
                  <KanbanHiddenColumnItem
                    key={group.option.id}
                    group={group}
                    activeView={activeView}
                    intl={props.intl}
                    readOnly={props.readOnly}
                    onDrop={(card: Card) => onDropToColumn(group.option, card)}
                  />
                ))}
              </div>
            )}
        </div>
      </ScrollingComponent>
    </Box>
  );
}

export default injectIntl(Kanban);
