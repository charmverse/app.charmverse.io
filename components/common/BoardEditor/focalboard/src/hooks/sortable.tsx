import type React from 'react';
import { useRef } from 'react';
import type { DragElementWrapper, DragSourceOptions, DragPreviewOptions } from 'react-dnd';
import { useDrag, useDrop } from 'react-dnd';

function useSortableBase<T> (itemType: string, item: T, enabled: boolean, handler: (src: T, st: T) => void):
  [boolean, boolean, DragElementWrapper<DragSourceOptions>, DragElementWrapper<DragSourceOptions>, DragElementWrapper<DragPreviewOptions>] {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: itemType,
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: () => enabled
  }), [itemType, item, enabled]);
  const [{ isOver }, drop] = useDrop<T, any, { isOver: boolean }>(() => ({
    accept: itemType,
    collect: (monitor) => ({
      isOver: monitor.isOver()
    }),
    drop: (dragItem) => {
      handler(dragItem, item);
    },
    canDrop: () => enabled
  }), [item, handler, enabled]);

  return [isDragging, isOver, drag, drop, preview];
}

export function useSortable<T> (itemType: string, item: T, enabled: boolean, handler: (src: T, st: T) => void):
[boolean, boolean, React.RefObject<HTMLDivElement>] {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, isOver, drag, drop] = useSortableBase(itemType, item, enabled, handler);
  drop(drag(ref));
  return [isDragging, isOver, ref];
}
