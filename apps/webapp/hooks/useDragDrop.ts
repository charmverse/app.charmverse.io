import { useTheme } from '@mui/material';
import { useDrag, useDrop } from 'react-dnd';

export function useDragDrop<Item extends { id: string }>({
  item,
  enabled,
  itemType,
  onDrop
}: {
  itemType: string;
  enabled?: boolean;
  item: Item;
  onDrop: (droppedItem: Item, targetItem: Item) => void;
}) {
  const theme = useTheme();

  const [{ offset, isDragging }, drag, preview] = useDrag(
    () => ({
      type: itemType,
      item,
      collect(monitor) {
        return {
          offset: monitor.getDifferenceFromInitialOffset(),
          isDragging: monitor.isDragging()
        };
      },
      canDrag: () => !!enabled
    }),
    [item, enabled, itemType]
  );

  const [{ canDrop, isOver }, drop] = useDrop<Item, any, { canDrop: boolean; isOver: boolean }>(
    () => ({
      accept: itemType,
      drop: async (droppedItem, monitor) => {
        const didDrop = monitor.didDrop();
        if (didDrop) {
          return;
        }
        onDrop(droppedItem, item);
      },
      canDrop(_item) {
        return _item.id !== item.id && !!enabled;
      },
      collect: (monitor) => {
        let canDropItem: boolean = true;
        try {
          canDropItem = monitor.canDrop();
        } catch {
          canDropItem = false;
        }
        return {
          isOver: monitor.isOver({ shallow: true }),
          canDrop: canDropItem
        };
      }
    }),
    [item, enabled, onDrop, itemType]
  );

  const isAdjacentActive = canDrop && isOver;
  const dragDirection = isAdjacentActive ? ((offset?.y ?? 0) < 0 ? 'top' : 'bottom') : undefined;

  return {
    drag,
    drop,
    preview,
    style: {
      opacity: isDragging ? 0.5 : 1,
      cursor: enabled ? 'move' : 'default',
      boxShadow:
        dragDirection === 'top'
          ? `0px -2px 0px ${theme.palette.primary.main}`
          : dragDirection === 'bottom'
            ? `0px 2px 0px ${theme.palette.primary.main}`
            : undefined
    }
  };
}
