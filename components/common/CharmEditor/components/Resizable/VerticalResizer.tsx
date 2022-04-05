import { ReactNode, memo } from 'react';
import { ResizableBox, ResizableProps } from 'react-resizable';
import ResizableHandle from './ResizableHandle';
import ResizableContainer from './ResizableContainer';

interface ResizerProps {
  width: number
  height: number
  children: ReactNode
  onResize?: ResizableProps['onResize']
  minConstraints?: ResizableProps['minConstraints']
  maxConstraints?: ResizableProps['maxConstraints']
  onResizeStop?: ResizableProps['onResizeStop']
}

function VerticalResizer (props: ResizerProps) {
  const { width, height, onResizeStop, onResize, minConstraints,
    maxConstraints, children } = props;

  return (
    <ResizableContainer>
      <ResizableBox
        // @ts-ignore library type is wrong
        style={{ display: 'inline-block', maxWidth: '100%' }}
        onResize={onResize}
        width={width}
        height={height}
        resizeHandles={['s']}
        lockAspectRatio
        minConstraints={minConstraints}
        maxConstraints={maxConstraints}
        onResizeStop={onResizeStop}
        /* eslint-disable-next-line */
        handle={(handleAxis: string, ref: React.Ref<unknown>) => <ResizableHandle ref={ref} className={`react-resizable-handle react-resizable-handle-${handleAxis}`} />}
      >
        {children}
      </ResizableBox>
    </ResizableContainer>
  );
}

export default memo(VerticalResizer);
