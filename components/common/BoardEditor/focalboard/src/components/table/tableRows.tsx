import React from 'react';

import { usePages } from 'hooks/usePages';

import type { Board } from '../../blocks/board';
import type { BoardView } from '../../blocks/boardView';
import type { Card } from '../../blocks/card';

import TableRow from './tableRow';

type Props = {
    board: Board;
    activeView: BoardView;
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
    cards: readonly Card[];
    offset: number;
    resizingColumn: string;
    selectedCardIds: string[];
    readOnly: boolean;
    cardIdToFocusOnRender: string;
    showCard: (cardId: string) => void;
    addCard: (groupByOptionId?: string) => Promise<void>;
    onCardClicked: (e: React.MouseEvent, card: Card) => void;
    onDrop: (srcCard: Card, dstCard: Card) => void;
}

function TableRows (props: Props): JSX.Element {
  const { board, cards, activeView } = props;
  const { pages, updatePage } = usePages();

  const saveTitle = React.useCallback(async (saveType: string, cardId: string, title: string) => {
    await updatePage({ id: cardId, title });

    if (saveType === 'onEnter') {
      const card = cards.find(c => c.id === cardId);
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
            hasContent={cardPage?.hasContent}
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
