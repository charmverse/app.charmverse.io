import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Typography } from '@mui/material';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React, { useState } from 'react';

import charmClient from 'charmClient';
import { PageSizeInputPopup } from 'components/PageSizeInputPopup';
import { NewWorkButton } from 'components/rewards/components/RewardApplications/NewWorkButton';
import { useLocalStorage } from 'hooks/useLocalStorage';
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
  showCard: (cardId: string, parentId?: string) => void;
  addCard: (groupByOptionId?: string) => Promise<void> | void;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  onDrop: (srcCard: Card, dstCard: Card) => void;
  onDeleteCard?: (cardId: string) => Promise<void>;
  readOnlyTitle?: boolean;
  expandSubRowsOnLoad?: boolean;
  rowExpansionLocalStoragePrefix?: string;
  subRowsEmptyValueContent?: ReactElement | string;
  checkedIds?: string[];
  setCheckedIds?: Dispatch<SetStateAction<string[]>>;
};

function TableRows(props: Props): JSX.Element {
  const {
    board,
    cardPages: allCardPages,
    activeView,
    onDeleteCard,
    expandSubRowsOnLoad,
    subRowsEmptyValueContent,
    setCheckedIds,
    checkedIds = []
  } = props;
  const hasSubPages = allCardPages.some((cardPage) => cardPage.subPages?.length);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { data: cardPages, hasNextPage, showNextPage } = usePaginatedData(allCardPages as CardPage[], { pageSize });

  const [collapsedCardIds = [], setCollapsedCardIds] = useLocalStorage<string[]>(
    hasSubPages && props.rowExpansionLocalStoragePrefix
      ? `${props.rowExpansionLocalStoragePrefix}-collapsed-rows`
      : null,
    []
  );

  const setIsExpanded = ({ cardId, expanded }: { expanded: boolean; cardId: string }) => {
    setCollapsedCardIds((prev) => (expanded ? prev?.filter((id) => id !== cardId) ?? [] : [...(prev ?? []), cardId]));
  };

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

  const isExpanded = (cardId: string) => {
    return collapsedCardIds === null
      ? false
      : collapsedCardIds?.length !== 0
      ? !collapsedCardIds?.includes(cardId)
      : !!props.expandSubRowsOnLoad;
  };

  return (
    <>
      {cardPages.map(({ page, proposal, card, subPages, isStructuredProposal, reward }) => (
        <TableRow
          key={card.id + card.updatedAt}
          board={board}
          activeView={activeView}
          card={card}
          reward={reward}
          proposal={proposal}
          isStructuredProposal={isStructuredProposal}
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
          onDeleteCard={onDeleteCard}
          offset={props.offset}
          resizingColumn={props.resizingColumn}
          columnRefs={props.columnRefs}
          cardPage={page}
          readOnlyTitle={props.readOnlyTitle}
          subPages={subPages}
          expandSubRowsOnLoad={expandSubRowsOnLoad}
          setIsExpanded={setIsExpanded}
          setCheckedIds={setCheckedIds}
          isChecked={checkedIds.includes(page.id)}
          emptySubPagesPlaceholder={
            page.bountyId ? (
              <Box
                p={1}
                pl={5}
                display='flex'
                justifyContent='flex-start'
                style={{ backgroundColor: 'var(--input-bg)' }}
              >
                <NewWorkButton color='secondary' rewardId={page.bountyId} addIcon variant='text' buttonSize='small' />
              </Box>
            ) : null
          }
          isExpanded={isExpanded(card.id)}
          subRowsEmptyValueContent={subRowsEmptyValueContent}
        />
      ))}

      {hasNextPage && (
        <div className='octo-table-footer'>
          <div className='octo-table-cell' onClick={showNextPage}>
            <Box display='flex' gap={1} alignItems='center'>
              <ArrowDownwardIcon fontSize='small' />
              <Typography fontSize='small'>Load more</Typography>
              <PageSizeInputPopup onChange={setPageSize} pageSize={pageSize} />
            </Box>
          </div>
        </div>
      )}
    </>
  );
}

export default TableRows;
