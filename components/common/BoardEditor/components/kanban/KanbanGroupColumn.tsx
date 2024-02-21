import { Add } from '@mui/icons-material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { useState } from 'react';

import KanbanCard from 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanCard';
import KanbanColumn from 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanColumn';
import { PageSizeInputPopup } from 'components/PageSizeInputPopup';
import { DEFAULT_PAGE_SIZE, usePaginatedData } from 'hooks/usePaginatedData';
import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

type Props = {
  group: BoardGroup;
  board: Board;
  readOnly: boolean;
  visiblePropertyTemplates: IPropertyTemplate[];
  selectedCardIds: string[];
  addCard: (groupByOptionId?: string, show?: boolean, props?: any, insertLast?: boolean) => Promise<void> | void;
  onDropToColumn: (option: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => Promise<void>;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  onDropToCard?: (srcCard: Card, dstCard: Card) => Promise<void>;
  showCard: (cardId: string | null) => void;
  disableAddingCards?: boolean;
  hideLinkedBounty?: boolean;
};

export function KanbanGroupColumn({
  group,
  readOnly,
  addCard,
  board,
  visiblePropertyTemplates,
  onDropToColumn,
  onCardClicked,
  selectedCardIds,
  onDropToCard,
  showCard,
  disableAddingCards,
  hideLinkedBounty
}: Props) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { data: cards, hasNextPage, showNextPage } = usePaginatedData(group.cards, { pageSize });
  return (
    <KanbanColumn onDrop={(card: Card) => onDropToColumn(group.option, card)}>
      {cards.map((card) => (
        <KanbanCard
          card={card}
          board={board}
          visiblePropertyTemplates={visiblePropertyTemplates}
          key={card.id}
          readOnly={readOnly}
          isSelected={selectedCardIds.includes(card.id)}
          onClick={(e) => {
            onCardClicked(e, card);
          }}
          onDrop={onDropToCard}
          showCard={showCard}
          hideLinkedBounty={hideLinkedBounty}
        />
      ))}
      {hasNextPage && (
        <Button
          size='small'
          variant='text'
          color='secondary'
          sx={{ justifyContent: 'flex-start', mb: 1 }}
          onClick={showNextPage}
          startIcon={<ArrowDownwardIcon fontSize='small' />}
        >
          <Box display='flex' justifyContent='space-between' gap={1} alignItems='center'>
            <Typography fontSize='small'>Load more</Typography>
            <PageSizeInputPopup onChange={setPageSize} pageSize={pageSize} />
          </Box>
        </Button>
      )}
      {!readOnly && !disableAddingCards && (
        <Button
          size='small'
          variant='text'
          color='secondary'
          sx={{ justifyContent: 'flex-start' }}
          onClick={() => {
            addCard(group.option.id, true, {}, true);
          }}
          startIcon={<Add fontSize='small' />}
        >
          <Typography fontSize='small'>New</Typography>
        </Button>
      )}
    </KanbanColumn>
  );
}
