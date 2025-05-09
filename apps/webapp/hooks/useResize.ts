import { useCallback, useEffect, useState } from 'react';

type UseResizeProps = {
  minWidth: number;
  maxWidth?: number;
  initialWidth?: number | null;
  onResize?: (width: number) => void;
};

export function useResize({ minWidth, initialWidth, maxWidth, onResize }: UseResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(initialWidth || minWidth);
  const [startXOffset, setStartXOffset] = useState(0);

  useEffect(() => {
    if (initialWidth && initialWidth !== width) {
      setWidth(initialWidth);
    }
  }, [initialWidth, width]);

  const enableResize = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setIsResizing(true);
      setStartXOffset(e.clientX);
    },
    [setIsResizing]
  );

  const disableResize = useCallback(() => {
    setIsResizing(false);
    setStartXOffset(0);
  }, [setIsResizing]);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const offset = e.clientX - startXOffset;
        let newWidth = width + offset;

        if (newWidth < minWidth) {
          newWidth = minWidth;
        }

        if (maxWidth && newWidth > maxWidth) {
          newWidth = maxWidth;
        }

        setWidth((currentWidth) => {
          if (currentWidth !== newWidth) {
            onResize?.(newWidth);
          }

          return newWidth;
        });
      }
    },
    [minWidth, isResizing, setWidth]
  );

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', disableResize);
      document.body.classList.add('not-selectable');
    }

    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', disableResize);
      document.body.classList.remove('not-selectable');
    };
  }, [disableResize, resize, isResizing]);

  return { width, enableResize, isResizing };
}
