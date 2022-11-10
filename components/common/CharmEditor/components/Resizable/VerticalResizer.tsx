import type { ReactNode } from 'react';
import { memo } from 'react';
import type { ResizableProps } from 'react-resizable';

import ResizableBox from './ResizableBox';
import ResizableContainer from './ResizableContainer';

interface ResizerProps {
  width: number;
  height: number;
  children: ReactNode;
  onResize?: ResizableProps['onResize'];
  minConstraints?: ResizableProps['minConstraints'];
  maxConstraints?: ResizableProps['maxConstraints'];
  onResizeStop?: ResizableProps['onResizeStop'];
}

function VerticalResizer (props: ResizerProps) {
  const { width, height, onResizeStop, onResize, minConstraints,
    maxConstraints, children } = props;

  return (
    <ResizableContainer>
      <ResizableBox
        onResize={onResize}
        width={width}
        height={height}
        resizeHandles={['s', 'sw', 'se', 'w', 'e']}
        minConstraints={minConstraints}
        maxConstraints={maxConstraints}
        onResizeStop={onResizeStop}
      >
        {children}
      </ResizableBox>
    </ResizableContainer>
  );
}

export default memo(VerticalResizer);
