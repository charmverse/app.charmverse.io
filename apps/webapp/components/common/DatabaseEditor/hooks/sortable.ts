import type { CSSProperties } from 'react';
import type React from 'react';
import { useMemo, useRef } from 'react';
import type { DragElementWrapper, DragSourceOptions, DragPreviewOptions } from 'react-dnd';
import { useDrag, useDrop } from 'react-dnd';

function useSortableBase<T>(
  itemType: string,
  item: T,
  enabled: boolean,
  handler: (src: T, st: T) => void
): [
  boolean,
  boolean,
  DragElementWrapper<DragSourceOptions>,
  DragElementWrapper<DragSourceOptions>,
  DragElementWrapper<DragPreviewOptions>
] {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: itemType,
      item,
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      }),
      canDrag: () => enabled
    }),
    [itemType, item, enabled]
  );
  const [{ isOver }, drop] = useDrop<T, any, { isOver: boolean }>(
    () => ({
      accept: itemType,
      collect: (monitor) => ({
        isOver: monitor.isOver()
      }),
      drop: (dragItem) => {
        handler(dragItem, item);
      },
      canDrop: () => enabled
    }),
    [item, handler, enabled]
  );

  return [isDragging, isOver, drag, drop, preview];
}

export function useSortable<T, E = HTMLDivElement>(
  itemType: string,
  item: T,
  enabled: boolean,
  handler: (src: T, st: T) => void
): [boolean, boolean, React.RefObject<E>, CSSProperties] {
  const ref = useRef<E>(null);
  const [isDragging, isOver, drag, drop] = useSortableBase(itemType, item, enabled, handler);
  drop(drag(ref));
  const styles = useMemo<CSSProperties>(
    () => ({
      opacity: isDragging ? 0.5 : 1,
      transition: `background-color 150ms ease-in-out`,
      backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial',
      cursor: isDragging ? 'grab' : undefined
    }),
    [isDragging, isOver]
  );
  return [isDragging, isOver, ref, styles];
}
