import { useState } from 'react';

interface UseResizeProps {
  initialWidth: number;
}

export default function useResize ({ initialWidth }: UseResizeProps) {
  // State to keep track of the current width
  const [width, setWidth] = useState(initialWidth);
  // State to keep track of the current dragged mouse position
  const [clientX, setClientX] = useState<number>(0);
  // Is dragging is used to hide the resize handles while dragging
  const [isDragging, setIsDragging] = useState(false);

  return {
    width,
    setWidth,
    clientX,
    setClientX,
    isDragging,
    setIsDragging
  };
}
