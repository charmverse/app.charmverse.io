import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { PageListItemsRecord } from 'components/common/BoardEditor/interfaces';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';

import mutator from '../../mutator';
import { Utils } from '../../utils';

import GalleryCard from './galleryCard';

type Props = {
  board: Board;
  cards: Card[];
  activeView: BoardView;
  readOnly: boolean;
  addCard: (show: boolean) => Promise<void> | void;
  selectedCardIds: string[];
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  disableAddingCards?: boolean;
  cardPages: CardPage[];
};

function Gallery(props: Props): JSX.Element {
  const { activeView, board, cards, cardPages } = props;
  const localViewSettings = useLocalDbViewSettings(activeView.id);

  const visiblePropertyTemplates = activeView.fields.visiblePropertyIds
    .map((id) => board.fields.cardProperties.find((t) => t.id === id))
    .filter((i) => i) as IPropertyTemplate[];
  const { showConfirmation } = useConfirmationModal();

  const onDropToCard = async (srcCard: Card, dstCard: Card) => {
    Utils.log(`onDropToCard: ${dstCard.title}`);
    const { selectedCardIds } = props;
    const hasSort = activeView.fields.sortOptions?.length !== 0;

    const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id));
    const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card';

    let changeCardOrder = !hasSort;
    let cardOrder = hasSort
      ? cardPages.map((o) => o.card.id)
      : Array.from(new Set([...activeView.fields.cardOrder, ...cardPages.map((o) => o.card.id)]));

    let destIndex = cardOrder.indexOf(dstCard.id);
    const srcIndex = cardOrder.indexOf(srcCard.id);
    const isDraggingDown = srcIndex <= destIndex;
    cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id));

    if (hasSort) {
      const { confirmed } = await showConfirmation({
        message: 'Would you like to remove sorting?'
      });

      if (confirmed && localViewSettings) {
        await mutator.changeViewSortOptions(activeView.id, activeView.fields.sortOptions, []);
        localViewSettings.setLocalSort(null);
        changeCardOrder = true;
      }
    }

    // Update dstCard order
    if (changeCardOrder) {
      if (isDraggingDown) {
        destIndex += 1;
      }

      cardOrder.splice(destIndex, 0, ...draggedCardIds);
      await mutator.performAsUndoGroup(async () => {
        await mutator.changeViewCardOrder(
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
          description
        );
      });
    }
  };

  const visibleTitle = activeView.fields.visiblePropertyIds.includes(Constants.titleColumnId);

  return (
    <div className='Gallery'>
      {cards
        .filter((c) => c.parentId === board.id)
        .map((card) => {
          return (
            <GalleryCard
              key={card.id + card.updatedAt}
              card={card}
              board={board}
              onClick={props.onCardClicked}
              visiblePropertyTemplates={visiblePropertyTemplates}
              visibleTitle={visibleTitle}
              isSelected={props.selectedCardIds.includes(card.id)}
              readOnly={props.readOnly}
              onDrop={onDropToCard}
            />
          );
        })}

      {/* Add New row */}

      {!props.readOnly && !props.disableAddingCards && (
        <div
          className='octo-gallery-new'
          onClick={() => {
            props.addCard(true);
          }}
        >
          <FormattedMessage id='TableComponent.plus-new' defaultMessage='+ New' />
        </div>
      )}
    </div>
  );
}

export default Gallery;
