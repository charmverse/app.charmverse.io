import { useCallback, useEffect, useState } from 'react';

type UseResizeProps = {
  minWidth: number;
  maxWidth?: number;
  initialWidth?: number;
};

export function useResize({ minWidth, initialWidth, maxWidth }: UseResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(initialWidth || minWidth);
  const [startXOffset, setStartXOffset] = useState(0);

  useEffect(() => {
    if (initialWidth) {
      setWidth(initialWidth);
    }
  }, [initialWidth]);

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
        const newWidth = width + offset;

        if (newWidth < minWidth) {
          setWidth(minWidth);
          return;
        }

        if (maxWidth && newWidth > maxWidth) {
          setWidth(maxWidth);
          return;
        }

        setWidth(newWidth);
      }
    },
    [minWidth, isResizing, setWidth]
  );

  useEffect(() => {
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', disableResize);

    return () => {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', disableResize);
    };
  }, [disableResize, resize]);

  return { width, enableResize, isResizing };
}
