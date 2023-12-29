import { useTheme } from '@emotion/react';
import type { RefObject } from 'react';
import { createContext, useCallback, useEffect, useRef, useState } from 'react';

interface Coordinates {
  x: number;
  y: number;
}
interface DrawnArea {
  start: undefined | Coordinates;
  end: undefined | Coordinates;
}
interface UseAreaSelectionProps {
  container: RefObject<HTMLElement> | undefined;
  readOnly?: boolean;
}

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

export function useAreaSelection({ container = { current: document.body }, readOnly = false }: UseAreaSelectionProps) {
  const theme = useTheme();
  const boxElement = useRef<HTMLDivElement | null>(createBoxNode(theme.palette.mode));
  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [selection, setSelection] = useState<DOMRect | null>(null);
  const [drawArea, setDrawArea] = useState<DrawnArea>({
    start: undefined,
    end: undefined
  });

  const handleMouseMove = (e: MouseEvent) => {
    document.body.style.userSelect = 'none';
    setDrawArea((prev) => ({
      ...prev,
      end: {
        x: e.clientX,
        y: e.clientY
      }
    }));
  };

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      setMouseDown(true);

      const containerElement = container.current;
      // Skip if the click is on a disable-drag-selection element, don't start the selection box
      const disableDragSelectionElement =
        (e.target as HTMLElement)?.classList.contains('disable-drag-selection') ||
        (e.target as HTMLElement)?.parentElement?.classList.contains('disable-drag-selection');

      if (disableDragSelectionElement) return;

      if (containerElement && containerElement.contains(e.target as HTMLElement)) {
        document.addEventListener('mousemove', handleMouseMove);
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
    document.removeEventListener('mousemove', handleMouseMove);
    setMouseDown(false);
    setSelection(null);
  }, []);

  const resetState = () => {
    setDrawArea({
      start: undefined,
      end: undefined
    });
    setSelection(null);
    setMouseDown(false);
    if (boxElement.current && container.current?.contains(boxElement.current)) {
      container.current.removeChild(boxElement.current);
    }
  };

  useEffect(() => {
    const containerElement = container.current;
    if (containerElement && !readOnly) {
      containerElement.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        containerElement.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
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

  return {
    selection,
    setSelection,
    boxElement,
    setDrawArea,
    resetState
  };
}

export function useSelected(elementRef: RefObject<HTMLElement>, selection: DOMRect | null) {
  const [isSelected, setIsSelected] = useState<boolean>(false);

  useEffect(() => {
    if (!elementRef.current || !selection) {
      setIsSelected(false);
    } else {
      const a = elementRef.current.getBoundingClientRect();
      const b = selection;
      setIsSelected(!(a.y + a.height < b.y || a.y > b.y + b.height || a.x + a.width < b.x || a.x > b.x + b.width));
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
  setSelection: React.Dispatch<React.SetStateAction<DOMRect | null>>;
}>({
  selection: null,
  setSelection: () => {}
});
