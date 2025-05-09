import React from 'react';
import { useDrop } from 'react-dnd';

import type { Card } from '@packages/databases/card';

type Props = {
  onDrop: (card: Card) => void;
  children?: React.ReactNode;
};

const KanbanColumn = React.memo((props: Props) => {
  const [{ isOver }, drop] = useDrop<Card, any, { isOver: boolean }>(
    () => ({
      accept: 'card',
      collect: (monitor) => ({
        isOver: monitor.isOver()
      }),
      drop: (item, monitor) => {
        if (monitor.isOver({ shallow: true })) {
          props.onDrop(item);
        }
      }
    }),
    [props.onDrop]
  );

  let className = 'octo-board-column';
  if (isOver) {
    className += ' dragover';
  }
  return (
    <div ref={drop as any} className={className}>
      {props.children}
    </div>
  );
});

export default KanbanColumn;
