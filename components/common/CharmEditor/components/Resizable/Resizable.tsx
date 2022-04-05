import { NodeViewProps } from '@bangle.dev/core';
import { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { ReactNode, useCallback, useState, memo, useRef } from 'react';
import styled from '@emotion/styled';
import BlockAligner from '../BlockAligner';
import HorizontalResizer from './HorizontalResizer';

interface ResizableProps {
  initialSize: number;
  children: ReactNode;
  minWidth: number;
  updateAttrs: NodeViewProps['updateAttrs'];
  onDelete: () => void;
  onResizeStop?: (view: EditorView) => void;
}

const ResizeContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 100%;
`;

function Resizable (props: ResizableProps) {
  const { onResizeStop, updateAttrs, onDelete, initialSize = 100, children, minWidth } = props;
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
    <ResizeContainer draggable='false' ref={containerRef}>
      <BlockAligner onDelete={onDelete}>
        <HorizontalResizer
          onResizeStop={onResizeStopCallback}
          width={size}
          minWidth={minWidth}
          maxWidth={maxWidth}
          onResize={onResizeCallback}
        >
          {children}
        </HorizontalResizer>
      </BlockAligner>
    </ResizeContainer>
  );
}

export default memo(Resizable);
