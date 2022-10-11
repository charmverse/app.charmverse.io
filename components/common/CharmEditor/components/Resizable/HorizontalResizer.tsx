import type { ReactNode } from 'react';
import { memo } from 'react';
import type { ResizableProps } from 'react-resizable';

import ResizableBox from './ResizableBox';
import ResizableContainer from './ResizableContainer';

interface ResizerProps {
  children: ReactNode;
  aspectRatio?: number;
  width: number;
  minWidth: number;
  maxWidth?: number;
  onResize?: ResizableProps['onResize'];
  onResizeStop?: ResizableProps['onResizeStop'];
}

function Resizer (props: ResizerProps) {
  const height = props.aspectRatio ? props.width / props.aspectRatio : 0;
  return (
    <ResizableContainer>
      <ResizableBox
        onResize={props.onResize}
        width={props.width}
        // @ts-ignore - HACK: give a garbage value to height so react-resizable will not try to calculate it
        height={height || ''}
        resizeHandles={['w', 'e']}
        onResizeStop={props.onResizeStop}
        minConstraints={[props.minWidth, Infinity]}
        maxConstraints={props.maxWidth ? [props.maxWidth, props.aspectRatio ? props.maxWidth / props.aspectRatio : Infinity] : undefined}
        // handle={(handleAxis: string, ref: React.Ref<unknown>) => <ResizableHandle ref={ref} className={`react-resizable-handle react-resizable-handle-${handleAxis}`} />}
      >
        {props.children}
      </ResizableBox>
    </ResizableContainer>
  );
}

export default memo(Resizer);
