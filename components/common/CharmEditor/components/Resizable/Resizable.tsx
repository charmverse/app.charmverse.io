import type { NodeViewProps } from '@bangle.dev/core';
import type { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import type { ReactNode } from 'react';
import { useCallback, useState, memo, useRef } from 'react';

import BlockAligner from '../BlockAligner';

import HorizontalResizer from './HorizontalResizer';

interface ResizableProps {
  initialSize: number;
  children: ReactNode;
  aspectRatio?: number;
  minWidth: number;
  updateAttrs: NodeViewProps['updateAttrs'];
  onDelete: () => void;
  onResizeStop?: (view: EditorView) => void;
}

function Resizable (props: ResizableProps) {
  const { onResizeStop, updateAttrs, onDelete, initialSize = 100, aspectRatio, children, minWidth } = props;
  const [size, setSize] = useState(initialSize || 100);
  const view = useEditorViewContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const maxWidth = containerRef.current?.clientWidth;

  const onResizeStopCallback = useCallback((_, data) => {
    updateAttrs({
      size: data.size.width
    });
    if (onResizeStop) {
      onResizeStop(view);
    }
  }, []);

  const onResizeCallback = useCallback((_, data) => {
    if (typeof data.size.width === 'number') {
      setSize(data.size.width);
    }
  }, []);

  return (
    <div ref={containerRef}>
      <BlockAligner onDelete={onDelete}>
        <HorizontalResizer
          aspectRatio={aspectRatio}
          onResizeStop={onResizeStopCallback}
          width={size}
          minWidth={minWidth}
          maxWidth={maxWidth}
          onResize={onResizeCallback}
        >
          {children}
        </HorizontalResizer>
      </BlockAligner>
    </div>
  );
}

export default memo(Resizable);
