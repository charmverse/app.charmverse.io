import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export interface DraggableListItemProps extends BoxProps {
  name: string;
  itemId: string;
  disabled?: boolean;
  changeOrderHandler: (draggedProperty: string, droppedOnProperty: string) => void;
}

export function DraggableListItem({
  itemId,
  children,
  name,
  changeOrderHandler,
  sx,
  disabled,
  ...restProps
}: DraggableListItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [, drag] = useDrag(() => ({
    type: name,
    item: { id: itemId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: name,
      drop: async (droppedPropertyId: { id: string }, monitor) => {
        const didDrop = monitor.didDrop();

        if (didDrop) {
          return;
        }

        if (droppedPropertyId.id !== itemId) {
          await changeOrderHandler(droppedPropertyId.id, itemId);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      })
    }),
    [itemId, changeOrderHandler]
  );

  drag(drop(ref));

  return (
    <Box
      sx={{
        ...(isOver && canDrop && !disabled && { ...sx })
      }}
      ref={disabled ? undefined : ref}
      {...restProps}
    >
      {children}
    </Box>
  );
}
