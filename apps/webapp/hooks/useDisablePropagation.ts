import type { MouseEvent } from 'react';
import { useCallback } from 'react';

export function useDisableClickPropagation() {
  const stopPropagation = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    return false;
  }, []);
  return {
    onClick: stopPropagation,
    onMouseDown: stopPropagation,
    onMouseUp: stopPropagation
  };
}
