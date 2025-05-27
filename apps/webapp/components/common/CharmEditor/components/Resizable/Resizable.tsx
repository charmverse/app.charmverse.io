import { styled } from '@mui/material';
import type { ReactNode } from 'react';
import { useCallback, useState, memo, useEffect, useRef } from 'react';

import type { NodeViewProps } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';

import BlockAligner from '../BlockAligner';

import HorizontalResizer from './HorizontalResizer';

interface ResizableProps {
  initialSize: number;
  children: ReactNode;
  aspectRatio?: number;
  minWidth: number;
  updateAttrs: NodeViewProps['updateAttrs'];
  onDelete: VoidFunction;
  onEdit?: VoidFunction;
  readOnly?: boolean;
  defaultFullWidth?: boolean;
  onDragStart?: () => void;
}

const StaticContainer = styled.div<{ size: number }>`
  max-width: 100%;
  width: ${({ size }) => size}px;
  margin: ${({ theme }) => theme.spacing(0.5)} auto;
`;

function Resizable(props: ResizableProps) {
  const {
    readOnly = false,
    defaultFullWidth,
    updateAttrs,
    onDelete,
    onEdit,
    initialSize = 100,
    aspectRatio,
    children,
    minWidth,
    onDragStart
  } = props;
  const [size, setSize] = useState(initialSize || minWidth);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxWidth, setMaxWidth] = useState<number>(0);

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
    if (initialSize) {
      setSize(initialSize);
    }
  }, [initialSize]);

  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      setMaxWidth(containerWidth);
      if (defaultFullWidth && !initialSize) {
        setSize(containerWidth);
      }
    }
  }, [containerRef.current, size]);

  if (readOnly) {
    return <StaticContainer size={size}>{children}</StaticContainer>;
  }

  return (
    <div ref={containerRef} onDragStart={onDragStart}>
      <BlockAligner readOnly={readOnly} onEdit={onEdit} onDelete={onDelete}>
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
