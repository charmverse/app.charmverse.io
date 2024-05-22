import { useTheme } from '@emotion/react';
import type { RefObject } from 'react';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Coordinates = {
  x: number;
  y: number;
};

type DrawnArea = {
  start: undefined | Coordinates;
  end: undefined | Coordinates;
};

type UseAreaSelectionProps = {
  innerContainer: RefObject<HTMLElement>;
  readOnly?: boolean;
};

function createBoxNode(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return null;
  const boxNode = document.createElement('div');
  boxNode.style.position = 'fixed';
  boxNode.style.background = 'hsl(206deg 100% 50% / 5%)';
  if (theme === 'dark') {
    boxNode.style.mixBlendMode = 'unset';
  } else {
    boxNode.style.mixBlendMode = 'multiply';
  }
  boxNode.style.pointerEvents = 'none';
  boxNode.style.zIndex = '10';

  return boxNode;
}

export function useAreaSelection({ readOnly = false, innerContainer }: UseAreaSelectionProps) {
  const container = useRef<HTMLElement | null>(null);

  const theme = useTheme();
  const boxElement = useRef<HTMLDivElement | null>(createBoxNode(theme.palette.mode));
  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [selection, setSelection] = useState<DOMRect | null>(null);
  const [drawArea, setDrawArea] = useState<DrawnArea>({
    start: undefined,
    end: undefined
  });

  const initialOffsetTop = useRef<number>(0);
  const initialStartY = useRef<number>(0);

  useEffect(() => {
    if (!container.current) {
      container.current = document.querySelector('.app-content');
    }
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
    document.body.style.userSelect = 'none';
    const offsetTop = (innerContainer.current?.scrollTop || 0) - initialOffsetTop.current;

    setDrawArea((prev) => ({
      start: {
        x: prev.start?.x || e.clientX,
        y: initialStartY.current - offsetTop
      },
      end: {
        x: e.clientX,
        y: e.clientY
      }
    }));
  };

  const handleScroll = () => {
    const offsetTop = (innerContainer.current?.scrollTop || 0) - initialOffsetTop.current;

    setDrawArea((prev) => ({
      ...prev,
      start: {
        x: prev.start?.x || 0,
        y: initialStartY.current - offsetTop
      }
    }));
  };

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      setMouseDown(true);
      initialOffsetTop.current = innerContainer.current?.scrollTop || 0;
      initialStartY.current = e.clientY;

      // Skip if the click is on a disable-drag-selection element, don't start the selection box
      const disableDragSelectionElement =
        (e.target as HTMLElement)?.classList.contains('disable-drag-selection') ||
        (e.target as HTMLElement)?.closest('.disable-drag-selection');

      if (disableDragSelectionElement) return;

      if (container?.current && container.current.contains(e.target as HTMLElement)) {
        container.current.addEventListener('mousemove', handleMouseMove);
        innerContainer.current?.addEventListener('scroll', handleScroll);

        setDrawArea({
          start: {
            x: e.clientX,
            y: e.clientY
          },
          end: {
            x: e.clientX,
            y: e.clientY
          }
        });
      }
    },
    [container]
  );

  const handleMouseUp = useCallback((e: MouseEvent) => {
    document.body.style.userSelect = 'initial';
    container.current?.removeEventListener('mousemove', handleMouseMove);
    innerContainer.current?.removeEventListener('scroll', handleScroll);

    setMouseDown(false);
    setSelection(null);
    initialOffsetTop.current = 0;
    initialStartY.current = 0;
  }, []);

  const resetState = useCallback(() => {
    setDrawArea({
      start: undefined,
      end: undefined
    });
    setSelection(null);
    setMouseDown(false);
    initialOffsetTop.current = 0;
    initialStartY.current = 0;

    if (boxElement.current && container.current?.contains(boxElement.current)) {
      container.current.removeChild(boxElement.current);
    }
  }, [setDrawArea, setSelection, setMouseDown]);

  useEffect(() => {
    const containerElement = container.current;
    if (containerElement && !readOnly) {
      containerElement.addEventListener('mousedown', handleMouseDown);

      container.current?.addEventListener('mouseup', handleMouseUp);

      return () => {
        containerElement.removeEventListener('mousedown', handleMouseDown);
        container.current?.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [container, readOnly]);

  useEffect(() => {
    const { start, end } = drawArea;
    if (start && end && boxElement.current) {
      drawSelectionBox(boxElement.current, start, end);
      setSelection(boxElement.current.getBoundingClientRect());
    }
  }, [drawArea, boxElement]);

  useEffect(() => {
    const containerElement = container.current;
    const selectionBoxElement = boxElement.current;
    if (containerElement && selectionBoxElement) {
      if (mouseDown) {
        if (!document.body.contains(selectionBoxElement)) {
          containerElement.appendChild(selectionBoxElement);
        }
      } else if (containerElement.contains(selectionBoxElement)) {
        containerElement.removeChild(selectionBoxElement);
        selectionBoxElement.style.height = '0';
        selectionBoxElement.style.width = '0';
      }
    }
  }, [mouseDown, container, boxElement]);

  return useMemo(
    () => ({
      selection,
      setSelection,
      resetState
    }),
    [selection, setSelection, resetState]
  );
}

export function useSelected(elementRef: RefObject<HTMLElement>, selection: DOMRect | null) {
  const [isSelected, setIsSelected] = useState<boolean>(false);

  useEffect(() => {
    if (!elementRef.current || !selection) {
      setIsSelected(false);
    } else {
      const a = elementRef.current.getBoundingClientRect();
      // element is hidden
      if (a.height === 0 || a.width === 0) {
        setIsSelected(false);
      } else {
        const b = selection;
        setIsSelected(!(a.y + a.height < b.y || a.y > b.y + b.height || a.x + a.width < b.x || a.x > b.x + b.width));
      }
    }
  }, [elementRef, selection]);

  return isSelected;
}

function drawSelectionBox(boxElement: HTMLElement, start: Coordinates, end: Coordinates): void {
  const b = boxElement;
  if (end.x > start.x) {
    b.style.left = `${start.x}px`;
    b.style.width = `${end.x - start.x}px`;
  } else {
    b.style.left = `${end.x}px`;
    b.style.width = `${start.x - end.x}px`;
  }

  if (end.y > start.y) {
    b.style.top = `${start.y}px`;
    b.style.height = `${end.y - start.y}px`;
  } else {
    b.style.top = `${end.y}px`;
    b.style.height = `${start.y - end.y}px`;
  }
}

export const SelectionContext = createContext<{
  selection: DOMRect | null;
  // setSelection: React.Dispatch<React.SetStateAction<DOMRect | null>>;
}>({
  selection: null
  // setSelection: () => {}
});
