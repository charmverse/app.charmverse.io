import type { NodeViewProps } from '@bangle.dev/core';
import type { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import type { ReactNode } from 'react';
import { useCallback, useState, memo, useEffect, useRef } from 'react';

import BlockAligner from '../BlockAligner';

import HorizontalResizer from './HorizontalResizer';

interface ResizableProps {
  initialSize: number;
  children: ReactNode;
  aspectRatio?: number;
  minWidth: number;
  updateAttrs: NodeViewProps['updateAttrs'];
  onDelete: () => void;
}

function Resizable(props: ResizableProps) {
  const { updateAttrs, onDelete, initialSize = 100, aspectRatio, children, minWidth } = props;
  const [size, setSize] = useState(initialSize || 100);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxWidth = containerRef.current?.clientWidth;

  const onResizeStopCallback = useCallback((_: any, data: any) => {
    updateAttrs({
      size: data.size.width
    });
  }, []);

  const onResizeCallback = useCallback((_: any, data: any) => {
    if (typeof data.size.width === 'number') {
      setSize(data.size.width);
    }
  }, []);

  useEffect(() => {
    setSize(initialSize);
  }, [initialSize]);

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
