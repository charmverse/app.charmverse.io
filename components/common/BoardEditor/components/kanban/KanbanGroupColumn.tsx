import { Add } from '@mui/icons-material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Typography } from '@mui/material';
import Button from '@mui/material/Button';

import KanbanCard from 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanCard';
import KanbanColumn from 'components/common/BoardEditor/focalboard/src/components/kanban/kanbanColumn';
import { usePaginatedData } from 'hooks/usePaginatedData';
import type { Board, BoardGroup, IPropertyOption, IPropertyTemplate } from 'lib/focalboard/board';
import type { Card } from 'lib/focalboard/card';

type Props = {
  group: BoardGroup;
  board: Board;
  readOnly: boolean;
  visiblePropertyTemplates: IPropertyTemplate[];
  selectedCardIds: string[];
  addCard: (groupByOptionId?: string, show?: boolean, props?: any, insertLast?: boolean) => Promise<void>;
  onDropToColumn: (option: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => Promise<void>;
  onCardClicked: (e: React.MouseEvent, card: Card) => void;
  onDropToCard: (srcCard: Card, dstCard: Card) => Promise<void>;
  showCard: (cardId: string | null) => void;
  isManualSort: boolean;
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
  isManualSort
}: Props) {
  const { data: cards, hasNextPage, showNextPage, moreCount } = usePaginatedData(group.cards);

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
          isManualSort={isManualSort}
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
          <Typography fontSize='small'>Show {moreCount} more</Typography>
        </Button>
      )}

      {!readOnly && (
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
