import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import React, { useCallback } from 'react';

import charmClient from 'charmClient';
import { NewWorkButton } from 'components/rewards/components/RewardApplications/NewWorkButton';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePaginatedData } from 'hooks/usePaginatedData';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card, CardWithRelations } from 'lib/databases/card';

import { PaginationShowMore } from './PaginationShowMore';
import TableRow from './tableRow';

type Props = {
  board: Board;
  activeView: BoardView;
  columnRefs: Map<string, React.RefObject<HTMLDivElement>>;
  cards: readonly CardWithRelations[];
  offset: number;
  resizingColumn: string;
  selectedCardIds: string[];
  readOnly: boolean;
  cardIdToFocusOnRender: string;
  showCard: (
    cardId: string,
    parentId?: string,
    event?: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => void;
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
  disableDragAndDrop?: boolean;
  isExpandedGroup?: boolean;
};

function TableRows(props: Props): JSX.Element {
  const {
    addCard,
    board,
    cards: allCards,
    activeView,
    onDeleteCard,
    expandSubRowsOnLoad,
    subRowsEmptyValueContent,
    setCheckedIds,
    disableDragAndDrop,
    checkedIds = []
  } = props;
  const hasSubPages = allCards.some((card) => card.subPages?.length);
  const {
    data: cardsInView,
    pageSize,
    setPageSize,
    hasNextPage,
    showNextPage
  } = usePaginatedData(allCards as CardWithRelations[]);

  const [collapsedCardIds = [], setCollapsedCardIds] = useLocalStorage<string[]>(
    hasSubPages && props.rowExpansionLocalStoragePrefix
      ? `${props.rowExpansionLocalStoragePrefix}-collapsed-rows`
      : null,
    []
  );

  const setIsExpanded = useCallback(
    ({ cardId, expanded }: { expanded: boolean; cardId: string }) => {
      setCollapsedCardIds((prev) => {
        return expanded ? (prev?.filter((id) => id !== cardId) ?? []) : [...(prev ?? []), cardId];
      });
    },
    [setCollapsedCardIds]
  );

  const saveTitle = React.useCallback(
    async (saveType: string, cardId: string, title: string, oldTitle: string) => {
      // ignore if title is unchanged
      if (title === oldTitle) {
        return;
      }
      await charmClient.pages.updatePage({ id: cardId, title });

      if (saveType === 'onEnter') {
        const card = cardsInView.find((c) => c.id === cardId);
        if (card && cardsInView.length > 0 && cardsInView[cardsInView.length - 1] === card) {
          addCard(activeView.fields.groupById ? (card.fields.properties[activeView.fields.groupById!] as string) : '');
        }
      }
    },
    [activeView.fields.groupById, cardsInView, addCard]
  );

  const isExpanded = (cardId: string) => {
    return collapsedCardIds === null
      ? false
      : collapsedCardIds?.length !== 0
        ? !collapsedCardIds?.includes(cardId)
        : !!props.expandSubRowsOnLoad;
  };
  return (
    <>
      {cardsInView.map((card) => (
        <TableRow
          key={card.id + card.updatedAt}
          board={board}
          activeView={activeView}
          card={card}
          hasContent={card.hasContent}
          isSelected={props.selectedCardIds.includes(card.id)}
          focusOnMount={props.cardIdToFocusOnRender === card.id}
          pageIcon={card.icon}
          pageTitle={card.title || ''}
          pageUpdatedAt={card.updatedAt.toString()}
          pageUpdatedBy={card.updatedBy}
          onClick={props.onCardClicked}
          saveTitle={saveTitle}
          showCard={props.showCard}
          readOnly={props.readOnly}
          onDrop={props.onDrop}
          onDeleteCard={onDeleteCard}
          offset={props.offset}
          resizingColumn={props.resizingColumn}
          columnRefs={props.columnRefs}
          readOnlyTitle={props.readOnlyTitle}
          subPages={card.subPages}
          expandSubRowsOnLoad={expandSubRowsOnLoad}
          setIsExpanded={setIsExpanded}
          setCheckedIds={setCheckedIds}
          isChecked={checkedIds.includes(card.id)}
          isExpandedGroup={props.isExpandedGroup}
          disableDragAndDrop={disableDragAndDrop}
          emptySubPagesPlaceholder={
            card.reward ? (
              <Box
                p={1}
                pl={5}
                display='flex'
                justifyContent='flex-start'
                style={{ backgroundColor: 'var(--input-bg)' }}
              >
                <NewWorkButton color='secondary' rewardId={card.reward.id} addIcon variant='text' buttonSize='small' />
              </Box>
            ) : null
          }
          isExpanded={isExpanded(card.id)}
          subRowsEmptyValueContent={subRowsEmptyValueContent}
        />
      ))}

      <PaginationShowMore
        pageSize={pageSize}
        setPageSize={setPageSize}
        hasNextPage={hasNextPage}
        showNextPage={showNextPage}
      />
    </>
  );
}

export default TableRows;
