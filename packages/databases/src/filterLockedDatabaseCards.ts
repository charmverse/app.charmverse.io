import type { Board } from './board';
import type { BoardView } from './boardView';
import type { Card } from './card';
import { CardFilter } from './cardFilter';

export function filterLockedDatabaseCards({
  views,
  cards,
  board
}: {
  views: Pick<BoardView, 'fields'>[];
  cards: Card[];
  board: Pick<Board, 'fields'>;
}): Card[] {
  const visibleSubtreeMap = new Map();

  for (const view of views) {
    const filterGroup = view.fields.filter || { filters: [] };
    const visibleSubtree = CardFilter.applyFilterGroup(filterGroup, board.fields.cardProperties, cards) || [];

    for (const item of visibleSubtree) {
      visibleSubtreeMap.set(item.id, item.id);
    }
  }

  return cards.filter((item) => !!visibleSubtreeMap.get(item.id));
}
