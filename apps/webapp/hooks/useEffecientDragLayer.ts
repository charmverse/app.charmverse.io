import { shallowEqual } from '@react-dnd/shallowequal';
import { useState } from 'react';
import type { DragLayerMonitor } from 'react-dnd';
import { useDragLayer } from 'react-dnd';

// more efficient than useDragLayer, only updating on animation frame: https://github.com/react-dnd/react-dnd/issues/2414
export default function useEfficientDragLayer<CollectedProps>(
  collect: (monitor: DragLayerMonitor<any>) => CollectedProps
): CollectedProps {
  const collected = useDragLayer(collect);
  const [previousCollected, setPreviousCollected] = useState<CollectedProps>(collected);
  const [requestID, setRequestID] = useState<number>();
  if (requestID === undefined && !shallowEqual(collected, previousCollected)) {
    setPreviousCollected(collected);
    setRequestID(requestAnimationFrame(() => setRequestID(undefined)));
  }
  return previousCollected;
}
