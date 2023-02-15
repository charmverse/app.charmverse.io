import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Typography } from '@mui/material';
import React, { useState } from 'react';

import charmClient from 'charmClient';
import { PageSizeInputPopup } from 'components/PageSizeInputPopup';
import { DEFAULT_PAGE_SIZE, usePaginatedData } from 'hooks/usePaginatedData';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card, CardPage } from 'lib/focalboard/card';

import TableRow from './tableRow';

type Props = {
  board: Board;
  activeView: BoardView;
  columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
  cardPages: readonly CardPage[];
  offset: number;
  resizingColumn: string;
  selectedCardIds: string[];
  readOnly: boolean;
  cardIdToFocusOnRender: string;
  showCard: (cardId: string) => void;
  addCard: (groupByOptionId?: string) => Promise<void>;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  onDrop: (srcCard: Card, dstCard: Card) => void;
};

function TableRows(props: Props): JSX.Element {
  const { board, cardPages: allCardPages, activeView } = props;
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const {
    data: cardPages,
    hasNextPage,
    showNextPage,
    moreCount
  } = usePaginatedData(allCardPages as CardPage[], { pageSize });

  const saveTitle = React.useCallback(async (saveType: string, cardId: string, title: string, oldTitle: string) => {
    // ignore if title is unchanged
    if (title === oldTitle) {
      return;
    }
    await charmClient.pages.updatePage({ id: cardId, title });

    if (saveType === 'onEnter') {
      const card = cardPages.find((c) => c.card.id === cardId);
      if (card && cardPages.length > 0 && cardPages[cardPages.length - 1] === card) {
        props.addCard(
          activeView.fields.groupById ? (card.card.fields.properties[activeView.fields.groupById!] as string) : ''
        );
      }
    }
  }, []);

  return (
    <>
      {cardPages.map(({ page, card }) => (
        <TableRow
          key={card.id + card.updatedAt}
          board={board}
          activeView={activeView}
          card={card}
          hasContent={page.hasContent}
          isSelected={props.selectedCardIds.includes(card.id)}
          focusOnMount={props.cardIdToFocusOnRender === card.id}
          pageIcon={page.icon}
          pageTitle={page.title || ''}
          pageUpdatedAt={page.updatedAt.toString()}
          pageUpdatedBy={page.updatedBy}
          onClick={props.onCardClicked}
          saveTitle={saveTitle}
          showCard={props.showCard}
          readOnly={props.readOnly}
          onDrop={props.onDrop}
          offset={props.offset}
          resizingColumn={props.resizingColumn}
          columnRefs={props.columnRefs}
          cardPage={page}
        />
      ))}

      {hasNextPage && (
        <div className='octo-table-footer'>
          <div className='octo-table-cell' onClick={showNextPage}>
            <Box display='flex' gap={1} alignItems='center'>
              <ArrowDownwardIcon fontSize='small' />
              <Typography fontSize='small'>Show {moreCount} more</Typography>
              <PageSizeInputPopup onChange={setPageSize} pageSize={pageSize} />
            </Box>
          </div>
        </div>
      )}
    </>
  );
}

export default TableRows;
