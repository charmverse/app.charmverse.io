import React from 'react';
import { useDragLayer } from 'react-dnd';
import useEfficientDragLayer from 'hooks/useEffecientDragLayer';

import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import { Card } from '../../blocks/card';
import { Board } from '../../blocks/board';
import { BoardView } from '../../blocks/boardView';

import TableRow from './tableRow';

type Props = {
    board: Board
    activeView: BoardView
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>
    cards: readonly Card[]
    offset: number,
    resizingColumn: string,
    selectedCardIds: string[]
    readOnly: boolean
    cardIdToFocusOnRender: string
    showCard: (cardId?: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    onDrop: (srcCard: Card, dstCard: Card) => void
}

function TableRows (props: Props): JSX.Element {
  const { board, cards, activeView } = props;
  const { pages, setPages } = usePages();

  const saveTitle = React.useCallback(async (saveType: string, cardId: string, title: string) => {
    const updatedPage = await charmClient.updatePage({
      id: cardId,
      title
    });
    setPages((pages) => ({
      ...pages,
      [cardId]: updatedPage
    }));
    if (saveType === 'onEnter') {
      const card = cards.find(card => card.id === cardId);
      if (card && cards.length > 0 && cards[cards.length - 1] === card) {
        props.addCard(activeView.fields.groupById ? card.fields.properties[activeView.fields.groupById!] as string : '');
      }
    }
  }, []);
  return (
    <>
      {cards.map((card) => {

        const cardPage = pages[card.id];
        if (!cardPage) {
          throw new Error(`Card ${card.id} not found in pages`);
        }

        const tableRow = (
          <TableRow
            key={card.id + card.updatedAt}
            board={board}
            activeView={activeView}
            card={card}
            content={cardPage?.content as PageContent}
            isSelected={props.selectedCardIds.includes(card.id)}
            focusOnMount={props.cardIdToFocusOnRender === card.id}
            pageIcon={cardPage.icon}
            pageTitle={cardPage.title || ''}
            pageUpdatedAt={cardPage.updatedAt.toString()}
            pageUpdatedBy={cardPage.updatedBy}
            onClick={props.onCardClicked}
            saveTitle={saveTitle}
            showCard={props.showCard}
            readOnly={props.readOnly}
            onDrop={props.onDrop}
            offset={props.offset}
            resizingColumn={props.resizingColumn}
            columnRefs={props.columnRefs}
          />
        );

        return tableRow;
      })}
    </>
  );
}

export default TableRows;
